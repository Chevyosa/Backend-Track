// const mysql = require("mysql2/promise");
// require("dotenv").config();

// const dbCallback = mysql.createPool({
//   host: process.env.HOST,
//   user: process.env.UNAME,
//   port: process.env.DBPORT,
//   password: process.env.PASSWORD,
//   database: process.env.DB || "infinite_track",
//   waitForConnections: true,
//   connectionLimit: 50,
//   queueLimit: 0,
// });

// module.exports = {
//   dbCallback,
// };

require("dotenv").config();
const mysql = require("mysql2");
const mysqlPromise = require("mysql2/promise");

const poolCallback = mysql.createPool({
  host: process.env.HOST,
  user: process.env.UNAME,
  port: process.env.DBPORT,
  password: process.env.PASSWORD,
  database: process.env.DB || "infinite_track",
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

const poolPromise = mysqlPromise.createPool({
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
  dbCallback: poolCallback,
  dbPromise: poolPromise,
};
