const mysql = require("mysql2/promise");
require("dotenv").config();

const infinite_track_connection = mysql.createPool({
  host: process.env.HOST,
  user: process.env.UNAME,
  port: process.env.DBPORT,
  password: process.env.PASSWORD,
  database: process.env.DB || "infinite_track",
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

module.exports = {
  infinite_track_connection,
};
