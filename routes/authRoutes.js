const express = require("express");
const router = express.Router();
const { authController } = require("../Controllers");

router.post("/login", authController.loginUser);

router.post("/reset-password", authController.resetPassword);

module.exports = router;
