const express = require("express");
const {
  getFastestAttendance,
  getLatestAttendance,
  filteredFastestAttendance,
  filteredLatesAttendance,
} = require("../Controllers/allAttendanceController");
const { verifyToken } = require("../middleware/authMiddleWare");

const router = express.Router();

router.get("/fastest", getFastestAttendance);
router.get("/filtered-fastest", verifyToken, filteredFastestAttendance);
router.get("/filtered-latest", verifyToken, filteredLatesAttendance);
router.get("/latest", getLatestAttendance);

module.exports = router;
