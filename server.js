const app = require("./index");
const { testDbConnection } = require("./dbconfig");
const port = process.env.PORT;

(async () => {
  try {
    await testDbConnection();
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error(
      "Failed Starting Server. Shutting Down Server..",
      err.message
    );
    process.exit(1);
  }
})();
