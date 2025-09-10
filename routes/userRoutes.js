const express = require("express");
const { userController } = require("../Controllers");
const router = express.Router();
const uploadProfile = require("../middleware/uploadProfile");
const { verifyToken, checkRole } = require("../middleware/authMiddleWare");

router.post("/register", userController.register);

router.post(
  "/resetpasswordbyadmin/:id",
  verifyToken,
  checkRole(["Admin"]),
  userController.resetPasswordByAdmin
);

router.put(
  "/updatebyadmin/:id",
  verifyToken,
  checkRole(["Admin"]),
  uploadProfile.single("profile_photo"),
  userController.updateUserbyAdmin
);
router.put(
  "/:id",
  uploadProfile.single("profile_photo"),
  userController.updateUser
);
router.delete("/:id", userController.deleteUser);
router.delete("/softdelete/:id", userController.softDeleteUser);
router.patch(
  "/reactivate/:id",
  verifyToken,
  checkRole(["Admin"]),
  userController.reactivateUser
);
router.get("/get", userController.getAllUsers);
router.get("/get-deactivated", userController.getDeactivatedUsers);
router.get("/get/:id", userController.getUserById);
router.get("/attendance/:id", userController.getAttendanceByUserId);

module.exports = router;
