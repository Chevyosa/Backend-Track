const express = require("express");
const router = express.Router();
const uploadLeaveUsers = require("../middleware/uploadLeaveUsers");
const { leaveController } = require("../Controllers");

router.post(
  "/users",
  uploadLeaveUsers.single("upload_image"),
  leaveController.handleLeaveRequest
);
router.post(
  "/users/:leaveId/headprogram/approve",
  leaveController.approveByHeadProgram
);
router.post(
  "/users/:leaveId/operational/approve",
  leaveController.approveByOperational
);
router.post(
  "/users/:leaveId/programdirector/approve",
  leaveController.approveByProgramDirector
);
router.get("/history", leaveController.getAllLeaveUsers);
router.get("/users/:role/assigned", leaveController.getAssignedLeaveRequests);
router.get("/users/:role/declined", leaveController.getDeclinedLeaveRequests);
router.get("/users/:role/approved", leaveController.getApprovedLeaveRequests);

module.exports = router;
