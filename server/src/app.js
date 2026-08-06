const express = require('express');
const cors = require('cors');

const app = express();

// Parse incoming JSON request bodies into req.body
app.use(express.json());

// Allow the frontend (different port) to call this API
app.use(cors());

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Simple test route to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tuition Media API is running' });
});
app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.0' });
});
module.exports = app;