const express = require("express");
const { headProgramController } = require("../Controllers");
const router = express.Router();

router.get("/get", headProgramController.getAllHeadPrograms);
router.get("/get/:headprogramId", headProgramController.getHeadProgramById);

module.exports = router;
