const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const routes = require("./routes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", routes);

app.get("/", (req, res) => {
  res.send("Successfully Connected to InfiniteTrack API");
});

module.exports = app;
