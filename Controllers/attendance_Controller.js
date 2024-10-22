// controllers/attendance_Controller.js
const { infinite_track_connection: db } = require("../config/dbconfig");

const checkIn = (req, res) => {
  const { attendance_category } = req.body;
  const attendance_category_id = getAttendanceCategoryId(attendance_category);
  const userId = req.user.id;

  const now = new Date();
  const currentHour = now.getHours();

  let attendance_status_id = currentHour < 9 ? 1 : 2;
  let upload_image = null;

  if (attendance_category_id === 2) {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Image is required for Work From Home" });
    }
    upload_image = req.file.path;
  } else {
    upload_image = "";
  }

  db.query(
    "INSERT INTO attendance (check_in_time, check_out_time,  userId, attendance_category_id, attendance_status_id, attendance_date, upload_image) VALUES (NOW(), NULL, ?, ?, ?, CURDATE(), ?)",
    [userId, attendance_category_id, attendance_status_id, upload_image],
    (err, result) => {
      if (err) {
        console.error("Error during check-in:", err.message);
        return res.status(500).json({ message: "Failed to check in" });
      }

      const attendanceId = result.insertId;

      const queryAttendanceDetails = `
        SELECT a.attendance_date, s.attendance_status AS attendance_status
        FROM attendance a
        JOIN attendance_status s ON a.attendance_status_id = s.attendance_status_id
        WHERE a.attendanceId = ?
      `;

      db.query(queryAttendanceDetails, [attendanceId], (err, detailsResult) => {
        if (err) {
          console.error("Error retrieving attendance details:", err.message);
          return res
            .status(500)
            .json({ message: "Failed to retrieve attendance details" });
        }

        res.status(200).json({
          attendanceId,
          attendance_status: detailsResult[0].attendance_status,
        });
      });
    }
  );
};

const checkOut = (req, res) => {
  const { attendance_category } = req.body;
  const attendance_category_id = getAttendanceCategoryId(attendance_category);
  const userId = req.user.id;

  const now = new Date();
  const currentHour = now.getHours();

  let attendance_status_id = currentHour > 17 ? 3 : 1;

  db.query(
    "INSERT INTO attendance (check_in_time, check_out_time,  userId, attendance_category_id, attendance_status_id, attendance_date) VALUES (NULL, NOW(), ?, ?, ?, CURDATE())",
    [userId, attendance_category_id, attendance_status_id],
    (err, result) => {
      if (err) {
        console.error("Error during check-out:", err.message);
        return res.status(500).json({ message: "Failed to check out" });
      }

      const attendanceId = result.insertId;

      const queryAttendanceDetails = `
        SELECT a.attendance_date, s.attendance_status AS attendance_status
        FROM attendance a
        JOIN attendance_status s ON a.attendance_status_id = s.attendance_status_id
        WHERE a.attendanceId = ?
      `;

      db.query(queryAttendanceDetails, [attendanceId], (err, detailsResult) => {
        if (err) {
          console.error("Error retrieving attendance details:", err.message);
          return res
            .status(500)
            .json({ message: "Failed to retrieve attendance details" });
        }

        res.status(200).json({
          attendanceId,
          attendance_status: detailsResult[0].attendance_status,
        });
      });
    }
  );
};

module.exports = {
  checkIn,
  checkOut,
};
