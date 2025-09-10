const express = require("express");
const { verifyToken } = require("../middleware/authMiddleWare");
const { allAttendanceController } = require("../Controllers");

const router = express.Router();

router.get("/get", allAttendanceController.getTotalAttendance);
router.get("/monthly", allAttendanceController.getMonthlyAttendance);
router.get("/todays", allAttendanceController.getTodaysAttendance);
router.get("/fastest", allAttendanceController.getFastestAttendance);
router.get(
  "/filtered-fastest",
  verifyToken,
  allAttendanceController.filteredFastestAttendance
);
router.get(
  "/filtered-latest",
  verifyToken,
  allAttendanceController.filteredLatesAttendance
);
router.get("/latest", allAttendanceController.getLatestAttendance);
router.get("/export-to-sheet", allAttendanceController.exportSheet);

module.exports = router;
