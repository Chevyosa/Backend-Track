const { infinite_track_connection: db } = require("../dbconfig.js");

// Format waktu saja (tanpa tanggal)
const formatTimeOnly = (datetime) => {
  const date = new Date(datetime);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getTotalAttendance = (req, res) => {
  const query = `
    SELECT 
      users.name,
      users.profile_photo,
      attendance.notes,
      DATE_FORMAT(attendance.check_in_time, '%d %M %Y') AS check_in_date,
      DATE_FORMAT(attendance.check_in_time, '%H:%i') AS check_in_time,
      DATE_FORMAT(attendance.check_out_time, '%H:%i') AS check_out_time 
    FROM attendance
    JOIN users ON attendance.userId = users.userId
    ORDER BY attendanceId DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching attendance for all users:", err.message);
      return res
        .status(500)
        .json({ message: "Failed to fetch all attendance" });
    }
    if (results.length === 0) {
      res.status(200).json({ message: "No Attendance Recorded" });
    }

    res.status(200).json(results);
  });
};

const getTodaysAttendance = (req, res) => {
  try {
    const query = `
      SELECT 
        users.name,
        users.profile_photo,
        attendance.check_in_time
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      WHERE attendance.attendance_date = CURDATE()
      ORDER BY attendance.check_in_time ASC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No Attendance Found" });
      }

      const formatted = results.map((item) => ({
        ...item,
        check_in_time: formatTimeOnly(item.check_in_time),
      }));

      res.status(200).json(formatted);
    });
  } catch (err) {
    console.error("Error Fetching All Attendance:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// FASTEST Attendance
const getFastestAttendance = (req, res) => {
  try {
    const query = `
      SELECT 
        users.name,
        users.profile_photo,
        attendance.check_in_time
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      WHERE attendance.attendance_date = CURDATE()
      ORDER BY attendance.check_in_time ASC
      LIMIT 3
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: "No attendance found" });
      }

      const formatted = results.map((item) => ({
        ...item,
        check_in_time: formatTimeOnly(item.check_in_time),
      }));

      res.status(200).json(formatted);
    });
  } catch (err) {
    console.error("Error fetching fastest attendance:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const filteredFastestAttendance = (req, res) => {
  try {
    const userRole = req.user.roleName;
    const query = `
      SELECT 
        users.name,
        users.profile_photo,
        attendance.check_in_time
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      JOIN roles ON users.roleId = roles.roleId
      WHERE attendance.attendance_date = CURDATE()
        AND roles.role = ?
      ORDER BY attendance.check_in_time ASC
      LIMIT 3
    `;

    db.query(query, [userRole], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res
          .status(200)
          .json({ message: "No attendance found for this role" });
      }

      const formatted = results.map((item) => ({
        ...item,
        check_in_time: formatTimeOnly(item.check_in_time),
      }));

      res.status(200).json(formatted);
    });
  } catch (err) {
    console.error("Error fetching fastest attendance:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// LATEST Attendance
const getLatestAttendance = (req, res) => {
  const countQuery = `
    SELECT COUNT(*) AS total FROM attendance 
    WHERE attendance_date = CURDATE()
  `;

  db.query(countQuery, (err, countResult) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    const total = countResult[0].total;

    if (total < 6) {
      return res.status(200).json({ message: "No attendance found" });
    }

    const query = `
      SELECT 
        users.name,
        users.profile_photo,
        attendance.check_in_time
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      WHERE attendance.attendance_date = CURDATE()
      ORDER BY attendance.check_in_time DESC
      LIMIT 3
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      const formatted = results.map((item) => ({
        ...item,
        check_in_time: formatTimeOnly(item.check_in_time),
      }));

      res.status(200).json(formatted);
    });
  });
};

const filteredLatesAttendance = (req, res) => {
  const userRole = req.user.roleName;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM attendance 
    JOIN users ON attendance.userId = users.userId
    JOIN roles ON users.roleId = roles.roleId
    WHERE attendance.attendance_date = CURDATE()
      AND roles.role = ?
  `;

  db.query(countQuery, [userRole], (err, countResult) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    const total = countResult[0].total;

    if (total < 6) {
      return res
        .status(200)
        .json({ message: "Not enough attendance data for this role" });
    }

    const query = `
      SELECT 
        users.name,
        users.profile_photo,
        attendance.check_in_time
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      JOIN roles ON users.roleId = roles.roleId
      WHERE attendance.attendance_date = CURDATE()
        AND roles.role = ?
      ORDER BY attendance.check_in_time DESC
      LIMIT 3
    `;

    db.query(query, [userRole], (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      const formatted = results.map((item) => ({
        ...item,
        check_in_time: formatTimeOnly(item.check_in_time),
      }));

      res.status(200).json(formatted);
    });
  });
};

module.exports = {
  getTotalAttendance,
  getTodaysAttendance,
  getFastestAttendance,
  getLatestAttendance,
  filteredFastestAttendance,
  filteredLatesAttendance,
};
