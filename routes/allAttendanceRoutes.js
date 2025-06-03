const express = require("express");
const {
  getFastestAttendance,
  getLatestAttendance,
} = require("../Controllers/allAttendanceController");

const router = express.Router();

router.get("/fastest", getFastestAttendance);
router.get("/latest", getLatestAttendance);

module.exports = router;
