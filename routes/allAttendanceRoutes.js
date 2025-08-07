const express = require("express");
const {
  getTotalAttendance,
  getMonthlyAttendance,
  getTodaysAttendance,
  getFastestAttendance,
  getLatestAttendance,
  filteredFastestAttendance,
  filteredLatesAttendance,
  exportSheet,
} = require("../Controllers/allAttendanceController");
const { verifyToken } = require("../middleware/authMiddleWare");

const router = express.Router();

router.get("/get", getTotalAttendance);
router.get("/monthly", getMonthlyAttendance);
router.get("/todays", getTodaysAttendance);
router.get("/fastest", getFastestAttendance);
router.get("/filtered-fastest", verifyToken, filteredFastestAttendance);
router.get("/filtered-latest", verifyToken, filteredLatesAttendance);
router.get("/latest", getLatestAttendance);
router.get("/export-to-sheet", exportSheet);

module.exports = router;
