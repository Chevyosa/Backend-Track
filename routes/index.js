const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleWare.js");

const attendanceRoutes = require("./attendanceRoutes.js");
const allAttendanceRoutes = require("./allAttendanceRoutes.js");
const authRoutes = require("./authRoutes.js");
const headProgramRoutes = require("./headProgramRoutes.js");
const otpRoutes = require("./otpRoutes.js");
const userRoutes = require("./userRoutes.js");
const leaveRoutes = require("./leaveRoutes.js");
const divisionRoutes = require("./divisionRoutes.js");
const contactRoutes = require("./contactRoutes.js");
const managemenRoutes = require("./managementRoutes.js");

router.use("/auth", authRoutes);
router.use("/attendance", verifyToken, attendanceRoutes);
router.use("/head-program", headProgramRoutes);
router.use("/otp", otpRoutes);
router.use("/users", userRoutes);
router.use("/divisions", divisionRoutes);
router.use("/management", managemenRoutes);
router.use("/leave", leaveRoutes);
router.use("/contacts", contactRoutes);
router.use("/all-attendance", allAttendanceRoutes);

module.exports = router;
