const express = require("express");
const {
  updateUser,
  updateUserbyAdmin,
  deleteUser,
  getAllUsers,
  getUserById,
  register,
  getAttendanceByUserId,
} = require("../Controllers/user_Controller");

const router = express.Router();
const uploadProfile = require("../middleware/uploadProfile");
const { verifyToken, checkRole } = require("../middleware/authMiddleWare");

router.post("/register", register);
router.put(
  "/updatebyadmin/:id",
  verifyToken,
  checkRole(["Admin"]),
  uploadProfile.single("profile_photo"),
  updateUserbyAdmin
);
router.put("/:id", uploadProfile.single("profile_photo"), updateUser);
router.delete("/:id", deleteUser);
router.get("/get", getAllUsers);
router.get("/get/:id", getUserById);
router.get("/attendance/:id", getAttendanceByUserId);

module.exports = router;
