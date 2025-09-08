const express = require("express");
const router = express.Router();
const { contactController } = require("../Controllers");

router.get("/", contactController.getContacts);

module.exports = router;
