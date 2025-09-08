const { google } = require("googleapis");
const { readFileSync } = require("fs");

const auth = new google.auth.GoogleAuth({
  keyFile: "appdestionation-a1c54913bfe3.json",
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

const getSheetsClient = async () => {
  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient });
};

module.exports = getSheetsClient;
