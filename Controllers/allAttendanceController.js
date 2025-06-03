const { infinite_track_connection: db } = require("../dbconfig.js");

// Format waktu saja (tanpa tanggal)
const formatTimeOnly = (datetime) => {
  const date = new Date(datetime);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
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
        return res.status(400).json({ message: "No attendance found" });
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
      return res.status(400).json({ message: "No attendance found" });
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



module.exports = { getFastestAttendance, getLatestAttendance };
