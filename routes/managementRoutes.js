const express = require("express");
const router = express.Router();
const { managementController } = require("../Controllers");

router.post("/programs", managementController.addProgram);
router.post("/divisions", managementController.addDivision);
router.post("/positions", managementController.addPosition);
router.post("/roles", managementController.addRole);

router.get("/getPrograms", managementController.getAllPrograms);
router.get("/getDivisions", managementController.getAllDivisions);
router.get("/getPositions", managementController.getAllPositions);
router.get("/getRoles", managementController.getAllRoles);

router.delete("/programs/:id", managementController.deleteProgrambyId);
router.delete("/divisions/:id", managementController.deleteDivisionbyId);
router.delete("/positions/:id", managementController.deletePositionbyId);
router.delete("/roles/:id", managementController.deleteRolebyId);

router.put("/programs/:id", managementController.updateProgrambyId);
router.put("/divisions/:id", managementController.updateDivisionbyId);
router.put("/positions/:id", managementController.updatePositionbyId);
router.put("/roles/:id", managementController.updateRolebyId);

module.exports = router;
