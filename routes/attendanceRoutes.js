const express = require("express");
const { verifyToken } = require("../middleware/authMiddleWare");
const uploadAttendance = require("../middleware/uploadAttendance");
const router = express.Router();
const { attendanceController } = require("../Controllers");

router.post(
  "/users",
  verifyToken,
  uploadAttendance.single("upload_image"),
  attendanceController.handleAttendance
);

router.get("/users/overview", attendanceController.getAttendanceOverview);

module.exports = router;
