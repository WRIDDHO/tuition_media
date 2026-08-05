// Database route to get all users
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); // এটি যোগ করতে হবে

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Users API Route
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT * FROM users');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});