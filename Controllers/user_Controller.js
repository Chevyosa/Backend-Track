const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { dbCallback } = require("../dbconfig.js");
const { sendAccountReactivation } = require("../utils/nodeMailer.js");

const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    dbCallback.query(query, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      is_hasDivision,
      division,
      is_hasProgram,
      program,
      position,
      annual_balance,
      annual_used,
      isHeadProgram,
      isApprover,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !position ||
      annual_balance === undefined ||
      annual_used === undefined ||
      isHeadProgram === undefined ||
      isApprover === undefined
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.",
      });
    }

    const existingUser = await queryAsync(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    let roleResults = await queryAsync("SELECT * FROM roles WHERE role = ?", [
      role,
    ]);
    let roleId;
    if (roleResults.length > 0) {
      roleId = roleResults[0].roleId;
    } else {
      const roleInsertResult = await queryAsync(
        "INSERT INTO roles (role) VALUES (?)",
        [role]
      );
      roleId = roleInsertResult.insertId;
    }

    let divisionId = null;
    let programId = null;

    if (isHeadProgram) {
      let programResults = await queryAsync(
        "SELECT * FROM programs WHERE programName = ?",
        [program]
      );
      if (programResults.length > 0) {
        programId = programResults[0].programId;
      } else {
        const programInsertResult = await queryAsync(
          "INSERT INTO programs (programName) VALUES (?)",
          [program]
        );
        programId = programInsertResult.insertId;
      }
    } else if (is_hasDivision && is_hasProgram) {
      let programResults = await queryAsync(
        "SELECT * FROM programs WHERE programName = ?",
        [program]
      );
      if (programResults.length > 0) {
        programId = programResults[0].programId;
      } else {
        const programInsertResult = await queryAsync(
          "INSERT INTO programs (programName) VALUES (?)",
          [program]
        );
        programId = programInsertResult.insertId;
      }

      let divisionResults = await queryAsync(
        "SELECT * FROM divisions WHERE division = ?",
        [division]
      );
      if (divisionResults.length > 0) {
        divisionId = divisionResults[0].divisionId;
      } else {
        const divisionInsertResult = await queryAsync(
          "INSERT INTO divisions (programId, division) VALUES (?, ?)",
          [programId, division]
        );
        divisionId = divisionInsertResult.insertId;
      }
    }

    let positionResults = await queryAsync(
      "SELECT * FROM positions WHERE positionName = ?",
      [position]
    );
    let positionId;
    if (positionResults.length > 0) {
      positionId = positionResults[0].positionId;
    } else {
      const positionInsertResult = await queryAsync(
        "INSERT INTO positions (positionName) VALUES (?)",
        [position]
      );
      positionId = positionInsertResult.insertId;
    }

    await insertUser(
      name,
      email,
      password,
      roleId,
      divisionId,
      programId,
      positionId,
      annual_balance,
      annual_used,
      isHeadProgram,
      isApprover,
      res
    );
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const insertUser = async (
  name,
  email,
  password,
  roleId,
  divisionId,
  programId,
  positionId,
  annual_balance,
  annual_used,
  isHeadProgram,
  isApprover,
  res
) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userInsertResult = await queryAsync(
      "INSERT INTO users (name, email, password, roleId, divisionId, positionId, is_deleted) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [name, email, hashedPassword, roleId, divisionId, positionId]
    );

    const userId = userInsertResult.insertId;
    const profile_photo = `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${userId}`;

    await queryAsync("UPDATE users SET profile_photo = ? WHERE userId = ?", [
      profile_photo,
      userId,
    ]);

    await queryAsync(
      "INSERT INTO leave_balance (userId, annual_balance, annual_used) VALUES (?, ?, ?)",
      [userId, annual_balance, annual_used]
    );

    if (isHeadProgram) {
      await queryAsync(
        "INSERT INTO head_program (userId, programId) VALUES (?, ?)",
        [userId, programId]
      );
    }

    if (isApprover) {
      await queryAsync("INSERT INTO leave_approver (userId) VALUES (?)", [
        userId,
      ]);
    }

    const token = jwt.sign(
      { id: userId, role: roleId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      user: {
        id: userId,
        name,
        annual_balance,
        annual_used,
        profile_photo,
      },
      token: {
        token,
      },
    });
  } catch (err) {
    console.error("Error inserting user:", err.message);
    res.status(500).json({ message: "Failed to register user" });
  }
};

const updateUserbyAdmin = (req, res) => {
  const userId = parseInt(req.params.id);
  const { phone_number, nip_nim, address, start_contract, end_contract } =
    req.body;

  const profile_photo = req.file ? req.file.path : null;

  const queryGetUser = `
    SELECT nip_nim, address, start_contract, end_contract, profile_photo
    FROM users 
    WHERE userId = ?
  `;

  dbCallback.query(queryGetUser, [userId], (err, userResult) => {
    if (err) {
      console.error("Database error while fetching user:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    const existingUserData = userResult[0];
    const dataIsFullyUpdated =
      existingUserData.nip_nim &&
      existingUserData.start_contract &&
      existingUserData.end_contract;

    const updateUserQuery = (fields, values) => {
      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const query = `UPDATE users SET ${setClause} WHERE userId = ?`;

      dbCallback.query(query, [...values, userId], (err, result) => {
        if (err) {
          console.error("Database error while updating user:", err);
          return res
            .status(500)
            .json({ message: "Database error", error: err });
        }
        res.status(201).json({ message: "User updated successfully." });
      });
    };

    if (nip_nim && start_contract && end_contract) {
      const fields = [
        "phone_number",
        "nip_nim",
        "address",
        "start_contract",
        "end_contract",
      ];
      const values = [
        phone_number,
        nip_nim,
        address,
        start_contract,
        end_contract,
      ];

      if (profile_photo) {
        fields.push("profile_photo");
        values.push(profile_photo);
      }

      dbCallback.query(
        `UPDATE users SET ${fields
          .map((f) => `${f} = ?`)
          .join(", ")} WHERE userId = ?`,
        [...values, userId],
        (err, result) => {
          if (err) {
            console.error(
              "Database error while updating contract details:",
              err
            );
            return res
              .status(500)
              .json({ message: "Database error", error: err });
          }

          const start = new Date(start_contract);
          const end = new Date(end_contract);
          const monthsDifference =
            (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());
          const annual_balance = Math.max(0, monthsDifference);

          dbCallback.query(
            `UPDATE leave_balance SET annual_balance = ? WHERE userId = ?`,
            [annual_balance, userId],
            (err) => {
              if (err) {
                console.error(
                  "Database error while updating leave balance:",
                  err
                );
                return res
                  .status(500)
                  .json({ message: "Database error", error: err });
              }
              res.status(201).json({
                message: "Profile updated successfully.",
                annual_balance,
              });
            }
          );
        }
      );
    } else {
      res.status(400).json({
        message:
          "All contract details (nip_nim, start_contract, end_contract) must be provided.",
      });
    }
  });
};

const resetPasswordByAdmin = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    dbCallback.query(
      "UPDATE users SET password = ? WHERE userId = ?",
      [hashedPassword, userId],
      (err, result) => {
        if (err) {
          console.error("Error resetting password:", err.message);
          return res.status(500).json({ message: "Failed to reset password" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        res
          .status(200)
          .json({ message: "Password reset successfully by admin" });
      }
    );
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateUser = (req, res) => {
  const userId = parseInt(req.params.id);
  const { phone_number, address } = req.body;

  const profile_photo = req.file ? req.file.path : null;

  const fields = [];
  const values = [];

  if (phone_number) {
    fields.push("phone_number");
    values.push(phone_number);
  }

  if (address) {
    fields.push("address");
    values.push(address);
  }

  if (profile_photo) {
    fields.push("profile_photo");
    values.push(profile_photo);
  }

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No fields to update.",
    });
  }

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const query = `UPDATE users SET ${setClause} WHERE userId = ?`;

  dbCallback.query(query, [...values, userId], (err, result) => {
    if (err) {
      console.error("Error updating user self:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    res.status(200).json({ message: "Profile updated successfully." });
  });
};

const deleteUser = (req, res) => {
  const userId = parseInt(req.params.id);

  const queryDeleteUser = "DELETE FROM users WHERE userId = ?";
  dbCallback.query(queryDeleteUser, [userId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  });
};

const softDeleteUser = (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid userId provided" });
  }

  const query = "UPDATE users SET is_deleted = TRUE WHERE userId = ?";
  dbCallback.query(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User soft-deleted successfully" });
  });
};

const reactivateUser = (req, res) => {
  const userId = parseInt(req.params.id);

  const queryCheckUser = `
    SELECT * FROM users 
    WHERE userId = ? AND is_deleted = 1
  `;

  dbCallback.query(queryCheckUser, [userId], (err, result) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found or already active" });
    }

    const userEmail = result[0].email;

    const queryReactivate = `
      UPDATE users 
      SET is_deleted = 0 WHERE userId = ?
    `;

    dbCallback.query(queryReactivate, [userId], async (err, updateResult) => {
      if (err) {
        console.error("Error during reactivation:", err.message);
        return res.status(500).json({ message: "Failed to reactivate user" });
      }

      try {
        await sendAccountReactivation(userEmail);
        res.status(200).json({
          message: "User account has been reactivated and email sent!",
          userId,
        });
      } catch (emailErr) {
        console.error("Failed to send reactivation email:", emailErr.message);
        res.status(200).json({
          message: "User reactivated successfully, but failed to send email.",
          userId,
        });
      }
    });
  });
};

const getDeactivatedUsers = (req, res) => {
  const queryGetDeactivatedUsers = "SELECT * FROM users WHERE is_deleted = 1";
  dbCallback.query(queryGetDeactivatedUsers, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database Error", error: err });
    }
    if (result.length === 0) {
      return res.status(204).json({ message: "No Deactivated Users" });
    }
    res.json(result);
  });
};

const getAllUsers = (req, res) => {
  const queryGetAllUsers = `
    SELECT 
      users.*,
      divisions.division,
      positions.positionName,
      roles.role
    FROM users
    LEFT JOIN divisions ON users.divisionId = divisions.divisionId
    LEFT JOIN positions ON users.positionId = positions.positionId
    LEFT JOIN roles ON users.roleId = roles.roleId
  `;

  dbCallback.query(queryGetAllUsers, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.json(result);
  });
};

const getUserById = (req, res) => {
  const id = parseInt(req.params.id);

  const queryGetUserById = `
    SELECT 
      users.name AS name, 
      users.divisionId AS divisionId, 
      divisions.division AS division, 
      head_user.name AS headprogram,
      users.profile_photo AS profilePhoto
    FROM 
      users 
    LEFT JOIN 
      divisions ON users.divisionId = divisions.divisionId 
    LEFT JOIN 
      head_program ON divisions.programId = head_program.programId 
    LEFT JOIN 
      users AS head_user ON head_program.userId = head_user.userId 
    WHERE 
      users.userId = ?;
  `;

  dbCallback.query(queryGetUserById, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = {
      name: result[0].name,
      divisionId: result[0].divisionId,
      division: result[0].division,
      headprogram: result[0].headprogram,
      profilePhoto: result[0].profilePhoto,
    };

    res.json(user);
  });
};

const getAttendanceByUserId = (req, res) => {
  const id = parseInt(req.params.id);

  const queryGetAttendanceByUserId = `
    SELECT 
      a.attendanceId AS attendanceId,
      a.userId AS userId,
      a.attendance_date AS attendance_date,
      a.check_in_time AS check_in_time,
      a.check_out_time AS check_out_time,
      a.latitude AS latitude,
      a.longitude AS longitude,
      a.upload_image AS upload_image,
      a.notes AS notes,
      ac.attendance_category AS attendance_category,
      s.attendance_status AS attendance_status
    FROM 
      attendance a
    LEFT JOIN 
      attendance_category ac ON a.attendance_category_id = ac.attendance_category_id
    LEFT JOIN 
      attendance_status s ON a.attendance_status_id = s.attendance_status_id
    WHERE 
      a.userId = ?
    ORDER BY
      a.attendance_date DESC, a.check_in_time DESC;
  `;

  dbCallback.query(queryGetAttendanceByUserId, [id], (err, result) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Database error", error: err });
    }
    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No attendance records found for this user" });
    }

    const formattedResult = result.map((record) => {
      const attendanceDate = new Date(record.attendance_date);
      const checkInTime = record.check_in_time
        ? new Date(record.check_in_time)
        : null;
      const checkOutTime = record.check_out_time
        ? new Date(record.check_out_time)
        : null;

      const formattedAttendanceDate = attendanceDate
        .getDate()
        .toString()
        .padStart(2, "0");

      const formattedAttendanceMonthYear = `${attendanceDate.toLocaleString(
        "en-EN",
        { month: "short" }
      )} ${attendanceDate.getFullYear()}`;

      return {
        attendanceId: record.attendanceId,
        userId: record.userId,
        attendance_category: record.attendance_category,
        attendance_status: record.attendance_status,
        attendance_date: formattedAttendanceDate,
        attendance_month_year: formattedAttendanceMonthYear,
        check_in_time: checkInTime
          ? checkInTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        check_out_time: checkOutTime
          ? checkOutTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
        latitude: record.latitude,
        longitude: record.longitude,
        upload_image: record.upload_image,
        notes: record.notes,
      };
    });

    res.json(formattedResult);
  });
};

module.exports = {
  register,
  insertUser,
  updateUser,
  updateUserbyAdmin,
  deleteUser,
  getAllUsers,
  getUserById,
  getAttendanceByUserId,
  getDeactivatedUsers,
  softDeleteUser,
  reactivateUser,
  resetPasswordByAdmin,
};
