const express = require("express");
const { body, validationResult } = require("express-validator");
const mysql = require("mysql2/promise"); // Using mysql2 for promises support
const router = express.Router();

// MySQL connection pool configuration
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GET localhost:5000/api/notes/fetchallbooks (to get all the notes)
router.get("/fetchallbooks", async (req, res) => {
  try {
    // Use the pool to get a connection
    const connection = await pool.getConnection();
    const [notes, fields] = await connection.query("SELECT * FROM notes");
    connection.release(); // Release the connection back to the pool

    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server error");
  }
});

// POST localhost:5000/api/notes/addnote (to create new notes)
router.post(
  "/addnote",
  [
    body("title", "Enter a Valid title").isLength({ min: 3 }),
    body("description", "Description at least 5 Characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const connection = await pool.getConnection();
      const [result, fields] = await connection.query(
        "INSERT INTO notes (title, description, author, bookID, quantity, borrower) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.body.title,
          req.body.description,
          req.body.author,
          req.body.bookID,
          req.body.quantity,
          req.body.borrower,
        ]
      );
      connection.release();

      const insertedId = result.insertId;
      const savedNote = {
        id: insertedId,
        title: req.body.title,
        description: req.body.description,
      };

      res.json(savedNote);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server error");
    }
  }
);

module.exports = router;
