const express = require("express");
const router = express.Router();
const { divisionController } = require("../Controllers");

router.get("/get", divisionController.getAllDivisions);

module.exports = router;
