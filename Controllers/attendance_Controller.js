const { infinite_track_connection: db } = require("../dbconfig");
const { haversineDistance } = require("../utils/geofence");
const { verifyToken } = require("../middleware/authMiddleWare");

const getAttendanceCategoryId = (category) => {
  return category === "Work From Office" ? 1 : 2;
};

const getAttendanceStatusId = (status) => {
  return status === "late" ? 1 : 2;
};

const officeLocation = {
  latitude: 1.1853587, // Latitude yang benar
  longitude: 104.1021903,
};

const handleAttendance = (req, res) => {
  const { attendance_category, action, notes } = req.body;
  let { latitude, longitude } = req.body;
  const attendance_category_id = getAttendanceCategoryId(attendance_category);
  const userId = req.user.id;

  let upload_image = null;
  const now = new Date();
  const currentHour = now.getHours();
  let attendance_status_id;
  const randomMinute = Math.floor(Math.random() * 60); // Acak menit antara 0-59
  const randomSecond = Math.floor(Math.random() * 60); // Acak detik antara 0-59
  now.setHours(8, randomMinute, randomSecond, 0);

  console.log(
    "File path (upload_image):",
    req.file ? req.file.path : "No file"
  );

  if (action === "checkin") {
    if (attendance_category_id === 2) {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Image is required for Work From Home" });
      }
      upload_image = req.file.path;
      latitude = parseFloat(latitude);
      longitude = parseFloat(longitude);
    } else {
      const allowedRadius = 125;
      const userLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };

      const distance = haversineDistance(officeLocation, userLocation);
      if (distance > allowedRadius) {
        return res
          .status(400)
          .json({ message: "Location out of allowed radius" });
      }
      upload_image = "";
    }

    attendance_status_id = currentHour < 9 ? 1 : 2;
    db.query(
      "INSERT INTO attendance (check_in_time, fake_check_in_time, check_out_time, userId, attendance_category_id, attendance_status_id, attendance_date, latitude, longitude, upload_image, notes) VALUES (NOW(), ?, NULL, ?, ?, ?, CURDATE(), ?, ?, ?, ?)",
      [
        now,
        userId,
        attendance_category_id,
        attendance_status_id,
        latitude,
        longitude,
        upload_image,
        notes,
      ],
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

        db.query(
          queryAttendanceDetails,
          [attendanceId],
          (err, detailsResult) => {
            if (err) {
              console.error(
                "Error retrieving attendance details:",
                err.message
              );
              return res
                .status(500)
                .json({ message: "Failed to retrieve attendance details" });
            }

            // Tentukan pesan berdasarkan attendance_status_id
            const message =
              attendance_status_id === 1
                ? "Check-in successful"
                : "Check-in successful (Late)";

            res.status(200).json({
              message,
              attendanceId,
              attendance_status: detailsResult[0].attendance_status,
            });
          }
        );
      }
    );
  } else if (action === "checkout") {
    db.query(
      "SELECT attendanceId, attendance_status_id, notes FROM attendance WHERE userId = ? AND attendance_date = CURDATE() AND check_out_time IS NULL",
      [userId],
      (err, result) => {
        if (err) {
          console.error("Error retrieving attendance status:", err.message);
          return res
            .status(500)
            .json({ message: "Failed to retrieve attendance status" });
        }

        if (result.length === 0) {
          return res
            .status(400)
            .json({ message: "No active check-in found for today" });
        }

        const attendanceId = result[0].attendanceId;
        const previousAttendanceStatus = result[0].attendance_status_id;
        const previousNotes = result[0].notes || "";

        if (previousAttendanceStatus === 2) {
          attendance_status_id = 2;
        } else {
          attendance_status_id = currentHour > 17 ? 3 : 1;
        }

        const updatedNotes = previousNotes
          ? `Check-in: ${previousNotes}\nCheck-out: ${notes}`
          : `Check-out: ${notes}`;

        db.query(
          "UPDATE attendance SET check_out_time = NOW(), attendance_status_id = ?, notes = ? WHERE attendanceId = ?",
          [attendance_status_id, updatedNotes, attendanceId],
          (err, updateResult) => {
            if (err) {
              console.error("Error during check-out:", err.message);
              return res.status(500).json({ message: "Failed to check out" });
            }

            if (updateResult.affectedRows === 0) {
              return res
                .status(400)
                .json({ message: "No active check-in found for today" });
            }

            // Ambil status attendance dalam bentuk string
            const queryStatus = `
            SELECT s.attendance_status AS attendance_status
            FROM attendance a
            JOIN attendance_status s ON a.attendance_status_id = s.attendance_status_id
            WHERE a.attendanceId = ?
          `;

            db.query(queryStatus, [attendanceId], (err, statusResult) => {
              if (err) {
                console.error("Error retrieving status:", err.message);
                return res
                  .status(500)
                  .json({ message: "Failed to retrieve attendance status" });
              }

              const attendance_status =
                statusResult[0]?.attendance_status || "";

              res.status(200).json({
                message: "Check-out successful",
                attendanceId,
                attendance_status,
              });
            });
          }
        );
      }
    );
  }
};

const getAttendanceOverview = (req, res) => {
  const userId = req.user.id;

  const queryAccumulated = `
    SELECT 
      COUNT(*) AS total_attendance,
      SUM(CASE WHEN attendance_status_id = 2 THEN 1 ELSE 0 END) AS late,
      SUM(CASE WHEN ac.attendance_category = 'Work From Office' THEN 1 ELSE 0 END) AS total_work_from_office,
      SUM(CASE WHEN ac.attendance_category = 'Work From Home' THEN 1 ELSE 0 END) AS total_work_from_home
    FROM attendance a
    JOIN attendance_category ac ON a.attendance_category_id = ac.attendance_category_id
    WHERE a.userId = ?`;

  const queryDaily = `
    SELECT 
      MAX(a.check_in_time) AS check_in_time,
      MAX(a.check_out_time) AS check_out_time,
      SUM(CASE WHEN check_out_time IS NULL THEN 1 ELSE 0 END) AS active_attendance,
      SUM(CASE WHEN attendance_status_id = 1 THEN 1 ELSE 0 END) AS on_time
    FROM attendance a
    JOIN attendance_category ac ON a.attendance_category_id = ac.attendance_category_id
    WHERE a.userId = ? AND a.attendance_date = CURDATE()`;

  const queryPreviousDay = `
    SELECT 
      MAX(a.check_out_time) AS check_out_time
    FROM attendance a
    WHERE a.userId = ? AND a.attendance_date = CURDATE() - INTERVAL 1 DAY`;

  db.query(queryAccumulated, [userId], (err, accumulatedResult) => {
    if (err) {
      console.error("Error fetching accumulated attendance:", err.message);
      return res
        .status(500)
        .json({ message: "Failed to fetch attendance overview" });
    }

    db.query(queryDaily, [userId], (err, dailyResult) => {
      if (err) {
        console.error("Error fetching daily attendance:", err.message);
        return res
          .status(500)
          .json({ message: "Failed to fetch attendance overview" });
      }

      db.query(queryPreviousDay, [userId], (err, previousDayResult) => {
        if (err) {
          console.error(
            "Error fetching previous day's check-out time:",
            err.message
          );
          return res
            .status(500)
            .json({ message: "Failed to fetch previous day's check-out time" });
        }

        const formatDateTime = (dateTime) => {
          const date = new Date(dateTime);
          const hh = String(date.getHours()).padStart(2, "0");
          const mi = String(date.getMinutes()).padStart(2, "0");
          return `${hh}:${mi}`;
        };

        const overview = {
          total_attendance: accumulatedResult[0].total_attendance || 0,
          late: accumulatedResult[0].late || 0,
          total_absence: 0,
          total_work_from_office:
            accumulatedResult[0].total_work_from_office || 0,
          total_work_from_home: accumulatedResult[0].total_work_from_home || 0,
          active_attendance: dailyResult[0].active_attendance || 0,
          on_time: dailyResult[0].on_time || 0,
          check_in_time: dailyResult[0].check_in_time
            ? formatDateTime(dailyResult[0].check_in_time)
            : null,
          check_out_time:
            dailyResult[0].check_in_time && dailyResult[0].check_out_time
              ? formatDateTime(dailyResult[0].check_out_time)
              : null,
        };

        res.status(200).json({
          message: "Attendance overview fetched successfully",
          overview,
        });
      });
    });
  });
};

module.exports = {
  handleAttendance,
  getAttendanceOverview,
};
