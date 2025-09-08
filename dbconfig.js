require("dotenv").config();
const mysql = require("mysql2");
const mysqlPromise = require("mysql2/promise");

const poolCallback = mysql.createPool({
  host: process.env.HOST,
  user: process.env.UNAME,
  port: process.env.DBPORT,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

const poolPromise = mysqlPromise.createPool({
  host: process.env.HOST,
  user: process.env.UNAME,
  port: process.env.DBPORT,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

async function testDbConnection() {
  try {
    const conn = await poolPromise.getConnection();
    await conn.ping();
    console.log("Successfully Connected to Database!");
    conn.release();
  } catch (err) {
    console.error("Failed Connected to Database: ", err.message);
    process.exit(1);
  }
}

module.exports = {
  dbCallback: poolCallback,
  dbPromise: poolPromise,
  testDbConnection,
};
