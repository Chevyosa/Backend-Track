const { infinite_track_connection: db } = require("../dbconfig.js");

const getContacts = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.userId, 
        u.name, 
        u.phone_number,
        u.email, 
        u.profile_photo,
        p.positionId, 
        p.positionName 
      FROM 
        users u
      LEFT JOIN 
        positions p 
      ON 
        u.positionId = p.positionId
      WHERE 
        u.phone_number IS NOT NULL
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "No contacts found" });
      }

      const formattedContacts = results.map((contact) => ({
        userId: contact.userId,
        name: contact.name,
        positionId: contact.positionId,
        positionName: contact.positionName,
        profile_photo: contact.profile_photo,
        actions: {
          call: contact.phone_number,
          email: contact.email,
          whatsapp: contact.phone_number,
        },
      }));

      res.status(200).json({ contactData: formattedContacts });
    });
  } catch (err) {
    console.error("Error fetching contacts:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getContacts };
