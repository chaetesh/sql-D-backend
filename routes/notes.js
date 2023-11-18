const express = require("express");
const { body, validationResult } = require("express-validator");
const mysql = require("mysql2/promise");
const noteRouter = express.Router();

const dbPool = mysql.createPool({
  host: "localhost",
  user: "db_user",
  password: "db_password",
  database: "notes_app_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GET localhost:5000/api/notes/allnotes
noteRouter.get("/allnotes", async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [notes, fields] = await connection.query("SELECT * FROM notes");
    connection.release();

    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

noteRouter.post(
  "/addnote",
  [
    body("title", "Enter a valid title").isLength({ min: 3 }),
    body("description", "Description should be at least 5 characters").isLength(
      {
        min: 5,
      }
    ),
  ],
  async (req, res) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() });
      }

      const connection = await dbPool.getConnection();
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
      res.status(500).send("Internal Server Error");
    }
  }
);

module.exports = noteRouter;
