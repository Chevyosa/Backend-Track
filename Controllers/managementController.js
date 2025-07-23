const { infinite_track_connection: db } = require("../dbconfig.js");

const getAllDivisions = (req, res) => {
  const query = `SELECT division FROM divisions`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching divisions");
      return res.status(500).json({ message: "Failed to fetch divisions" });
    }

    if (results.length === 0) {
      res.status(200).json({ message: "No Divisions Recorded" });
    }

    res.status(200).json(results);
  });
};

const getAllPrograms = (req, res) => {
  const query = `SELECT programName FROM programs`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching programs");
      return res.status(500).json({ message: "Failed to fetch programs" });
    }

    if (results.length === 0) {
      res.status(200).json({ message: "No Programs Recorded" });
    }

    res.status(200).json(results);
  });
};

const getAllRoles = (req, res) => {
  const query = `SELECT role FROM roles`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching roles");
      return res.status(500).json({ message: "Failed to fetch roles" });
    }

    if (results.length === 0) {
      res.status(200).json({ message: "No Roles Recorded" });
    }

    res.status(200).json(results);
  });
};

const getAllPositions = (req, res) => {
  const query = `SELECT positionName FROM positions`;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching positions");
      return res.status(500).json({ message: "Failed to fetch positions" });
    }

    if (results.length === 0) {
      res.status(200).json({ message: "No Positions Recorded" });
    }

    res.status(200).json(results);
  });
};

module.exports = {
  getAllDivisions,
  getAllPrograms,
  getAllRoles,
  getAllPositions,
};
