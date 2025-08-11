const { dbCallback, dbPromise } = require("../dbconfig.js");
const getSheetsClient = require("../utils/googleSheets.js");
require("dotenv").config();

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
      roles.role AS user_role,
      attendance.notes,
      attendance.attendance_category_id,
      attendance.upload_image,
      attendance_category.attendance_category,
      DATE_FORMAT(attendance.check_in_time, '%d %M %Y') AS check_in_date,
      DATE_FORMAT(attendance.check_in_time, '%H:%i') AS check_in_time,
      DATE_FORMAT(attendance.check_out_time, '%H:%i') AS check_out_time 
    FROM attendance
    JOIN users ON attendance.userId = users.userId
    JOIN roles ON users.roleId = roles.roleId -- join ke roles
    JOIN attendance_category ON attendance.attendance_category_id = attendance_category.attendance_category_id
    ORDER BY attendanceId DESC
  `;

  dbCallback.query(query, (err, results) => {
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

const getMonthlyAttendance = (req, res) => {
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
    WHERE MONTH(attendance.check_in_time) = MONTH(CURRENT_DATE())
      AND YEAR(attendance.check_in_time) = YEAR(CURRENT_DATE())
    ORDER BY attendanceId DESC
  `;

  dbCallback.query(query, (err, results) => {
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

    dbCallback.query(query, (err, results) => {
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
        attendance.check_in_time,
        attendance_category.attendance_category
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      JOIN attendance_category ON attendance.attendance_category_id = attendance_category.attendance_category_id
      WHERE attendance.attendance_date = CURDATE()
      ORDER BY attendance.check_in_time ASC
      LIMIT 3
    `;

    dbCallback.query(query, (err, results) => {
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

    dbCallback.query(query, [userRole], (err, results) => {
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

  dbCallback.query(countQuery, (err, countResult) => {
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
        attendance.check_in_time,
        attendance_category.attendance_category
      FROM attendance
      JOIN users ON attendance.userId = users.userId
      JOIN attendance_category ON attendance.attendance_category_id = attendance_category.attendance_category_id
      WHERE attendance.attendance_date = CURDATE()
      ORDER BY attendance.check_in_time DESC
      LIMIT 3
    `;

    dbCallback.query(query, (err, results) => {
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

  dbCallback.query(countQuery, [userRole], (err, countResult) => {
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

    dbCallback.query(query, [userRole], (err, results) => {
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

const exportSheet = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end date required" });
    }

    const query = `
    SELECT 
      users.name,
      roles.role AS user_role,
      attendance_category.attendance_category,
      DATE_FORMAT(attendance.check_in_time, '%d %M %Y') AS check_in_date,
      DATE_FORMAT(attendance.fake_check_in_time, '%H:%i') AS check_in_time,
      DATE_FORMAT(attendance.check_out_time, '%H:%i') AS check_out_time,
      attendance.notes
    FROM attendance
    JOIN users ON attendance.userId = users.userId
    JOIN roles ON users.roleId = roles.roleId
    JOIN attendance_category ON attendance.attendance_category_id = attendance_category.attendance_category_id
    WHERE attendance.attendance_date BETWEEN ? AND ?
    ORDER BY attendanceId DESC
  `;

    const [rows] = await dbPromise.execute(query, [start, end]);

    if (!rows.length) {
      return res.status(404).json({ message: "No data to export" });
    }

    const sheets = await getSheetsClient();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const dateStart = new Date(start);
    const month = monthNames[dateStart.getMonth()];
    const year = dateStart.getFullYear();

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = metadata.data.sheets.map((s) => s.properties.title);

    const baseTitle = `Export_${year}_${month}`;
    const matchingSheets = existingSheets.filter((title) =>
      title.startsWith(baseTitle)
    );

    const nextIndex = matchingSheets.length + 1;
    const paddedIndex = String(nextIndex).padStart(3, "0");

    const newSheetTitle = `${baseTitle}_${paddedIndex}`;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: newSheetTitle,
              },
            },
          },
        ],
      },
    });

    const rawHeader = Object.keys(rows[0]);

    const headerMap = {
      name: "Name",
      user_role: "Role",
      attendance_category: "Attendance Category",
      check_in_date: "Check-in Date",
      check_in_time: "Check-in Time",
      check_out_time: "Check-out Time",
      notes: "Notes",
    };

    const header = rawHeader.map((col) => headerMap[col] || col);
    const data = rows.map((row) => Object.values(row));
    const finalData = [header, ...data];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${newSheetTitle}!A1`,
      valueInputOption: "RAW",
      resource: {
        values: finalData,
      },
    });

    res.json({
      message: "Export successful",
      sheetName: newSheetTitle,
      link: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
};

module.exports = {
  exportSheet,
  getTotalAttendance,
  getMonthlyAttendance,
  getTodaysAttendance,
  getFastestAttendance,
  getLatestAttendance,
  filteredFastestAttendance,
  filteredLatesAttendance,
};
