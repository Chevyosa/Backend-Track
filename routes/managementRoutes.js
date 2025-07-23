const express = require("express");
const {
  getAllDivisions,
  getAllPrograms,
  getAllRoles,
  getAllPositions,
} = require("../Controllers/managementController");
const router = express.Router();

router.get("/getDivisions", getAllDivisions);
router.get("/getPrograms", getAllPrograms);
router.get("/getRoles", getAllRoles);
router.get("/getPositions", getAllPositions);

module.exports = router;
