const express = require("express");
const router = express.Router();
const { managementController } = require("../Controllers");

router.get("/getDivisions", managementController.getAllDivisions);
router.get("/getPrograms", managementController.getAllPrograms);
router.get("/getRoles", managementController.getAllRoles);
router.get("/getPositions", managementController.getAllPositions);

module.exports = router;
