const { dbCallback } = require("../dbconfig.js");

const addProgram = (req, res) => {
  try {
    const { programName } = req.body;

    if (!programName)
      return res
        .status(400)
        .json({ message: "ProgramName Field is Required!" });

    dbCallback.query(
      "INSERT INTO programs (programName) VALUES (?)",
      [programName],
      (err, result) => {
        if (err) {
          console.error("Error Adding Program, ", err);
          return result
            .status(500)
            .json({ message: "Failed Adding Program: ", err });
        }
        res.status(200).json({ message: "Successfully Add New Program" });
      }
    );
  } catch (error) {
    console.error("Failed to Insert Program: ", error);
    res.status(500).json({ message: "Failed to Insert Program" });
  }
};

const addDivision = (req, res) => {
  try {
    const { division, programName } = req.body;

    if (!division || !programName) {
      return res.status(400).json({
        message: "Division and Program Name are required!",
      });
    }

    dbCallback.query(
      "SELECT programId, programName FROM programs WHERE programName = ?",
      [programName],
      (err, programResults) => {
        if (err) {
          console.error("Error fetching program: ", err);
          return res
            .status(500)
            .json({ message: "Failed to fetch program data" });
        }

        if (programResults.length === 0) {
          return res
            .status(400)
            .json({ message: "Program with the given name not found" });
        }

        const { programId, programName: foundProgramName } = programResults[0];

        dbCallback.query(
          "INSERT INTO divisions (division, programId) VALUES (?, ?)",
          [division, programId],
          (err, result) => {
            if (err) {
              console.error("Error adding division, ", err);
              return res
                .status(500)
                .json({ message: "Failed to add division" });
            }

            res.status(200).json({
              message: "Successfully added new division",
              data: {
                divisionId: result.insertId,
                division,
                programId,
                programName: foundProgramName,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Failed to insert division: ", error);
    res.status(500).json({ message: "Failed to insert division" });
  }
};

const addPosition = (req, res) => {
  try {
    const { positionName } = req.body;

    if (!positionName)
      return res
        .status(400)
        .json({ message: "PositionName Field is Required!" });

    dbCallback.query(
      "INSERT INTO positions (positionName) VALUES (?)",
      [positionName],
      (err, result) => {
        if (err) {
          console.error("Error Adding Position, ", err);
          return result
            .status(500)
            .json({ message: "Failed Adding Position: ", err });
        }
        res.status(200).json({ message: "Successfully Add New Position" });
      }
    );
  } catch (error) {
    console.error("Failed to Insert Position: ", error);
    res.status(500).json({ message: "Failed to Insert Position" });
  }
};

const addRole = (req, res) => {
  try {
    const { role } = req.body;

    if (!role)
      return res.status(400).json({ message: "Role Field is Required!" });

    dbCallback.query(
      "INSERT INTO roles (role) VALUES (?)",
      [role],
      (err, result) => {
        if (err) {
          console.error("Error Adding Role, ", err);
          return result
            .status(500)
            .json({ message: "Failed Adding Role: ", err });
        }
        res.status(200).json({ message: "Successfully Add New Role" });
      }
    );
  } catch (error) {
    console.error("Failed to Insert Role: ", error);
    res.status(500).json({ message: "Failed to Insert Role" });
  }
};

const getAllDivisions = (req, res) => {
  const query = `
    SELECT d.divisionId, d.division, d.programId, p.programName
    FROM divisions d
    LEFT JOIN programs p ON d.programId = p.programId
  `;

  dbCallback.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching divisions:", err);
      return res.status(500).json({ message: "Failed to fetch divisions" });
    }

    if (results.length === 0) {
      return res.status(200).json({ message: "No Divisions Recorded" });
    }

    res.status(200).json(results);
  });
};

const getAllPrograms = (req, res) => {
  const query = `SELECT * FROM programs`;

  dbCallback.query(query, (err, results) => {
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
  const query = `SELECT * FROM roles`;

  dbCallback.query(query, (err, results) => {
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
  const query = `SELECT * FROM positions`;

  dbCallback.query(query, (err, results) => {
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

const deleteDivisionbyId = (req, res) => {
  const divisionId = parseInt(req.params.id);

  const queryDeleteDivision = "DELETE FROM divisions WHERE divisionId = ?";
  dbCallback.query(queryDeleteDivision, [divisionId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Division not found" });
    }
    res.json({ message: "Division deleted successfully" });
  });
};

const deleteProgrambyId = (req, res) => {
  const programId = parseInt(req.params.id);

  const queryDeleteProgram = "DELETE FROM programs WHERE programId = ?";
  dbCallback.query(queryDeleteProgram, [programId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Program not found" });
    }
    res.json({ message: "Program deleted successfully" });
  });
};

const deletePositionbyId = (req, res) => {
  const positionId = parseInt(req.params.id);

  const queryDeletePosition = "DELETE FROM positions WHERE positionId = ?";
  dbCallback.query(queryDeletePosition, [positionId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Position not found" });
    }
    res.json({ message: "Position deleted successfully" });
  });
};

const deleteRolebyId = (req, res) => {
  const roleId = parseInt(req.params.id);

  const queryDeleteRole = "DELETE FROM roles WHERE roleId = ?";
  dbCallback.query(queryDeleteRole, [roleId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json({ message: "Role deleted successfully" });
  });
};

const updateProgrambyId = (req, res) => {
  const programId = parseInt(req.params.id);
  const { programName } = req.body;

  if (!programName) {
    return res.status(400).json({ message: "Update Program is Required" });
  }

  const queryUpdateProgram =
    "UPDATE programs SET programName = ? WHERE programId = ?";

  dbCallback.query(
    queryUpdateProgram,
    [programName, programId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Database error", error: err });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json({ message: "Program Updated successfully" });
    }
  );
};

const updateDivisionbyId = (req, res) => {
  const divisionId = parseInt(req.params.id);
  const { division } = req.body;

  if (!division) {
    return res.status(400).json({ message: "Update Division is Required" });
  }

  const queryUpdateDivision =
    "UPDATE divisions SET division = ? WHERE divisionId = ?";
  dbCallback.query(
    queryUpdateDivision,
    [division, divisionId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Database error", error: err });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Division not found" });
      }
      res.json({ message: "Division Updated successfully" });
    }
  );
};

const updatePositionbyId = (req, res) => {
  const positionId = parseInt(req.params.id);
  const { positionName } = req.body;

  if (!positionName) {
    return res
      .status(400)
      .json({ message: "Update Position Name is Required" });
  }

  const queryUpdatePosition =
    "UPDATE positions SET positionName = ? WHERE positionId = ?";
  dbCallback.query(
    queryUpdatePosition,
    [positionName, positionId],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Database error", error: err });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json({ message: "Position Updated successfully" });
    }
  );
};

const updateRolebyId = (req, res) => {
  const roleId = parseInt(req.params.id);
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ message: "Update Role Name is Required" });
  }

  const queryUpdateRole = "UPDATE roles SET role = ? WHERE roleId = ?";
  dbCallback.query(queryUpdateRole, [role, roleId], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json({ message: "Role updated successfully" });
  });
};

module.exports = {
  addRole,
  addDivision,
  addPosition,
  addProgram,
  getAllPrograms,
  getAllDivisions,
  getAllPositions,
  getAllRoles,
  deleteProgrambyId,
  deleteDivisionbyId,
  deletePositionbyId,
  deleteRolebyId,
  updateProgrambyId,
  updateDivisionbyId,
  updatePositionbyId,
  updateRolebyId,
};
