// Database route to get all users
require('dotenv').config();
const app = require('./app');
//const pool = require('./config/db'); 
const PORT = process.env.PORT || 5000;
// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('❌ Database connection failed:', err.message);
//   } else {
//     console.log('✅ Database connected. Server time:', res.rows[0].now);
//   }
// });
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});