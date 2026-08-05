const Pool = require('pg').Pool;

const pool = new Pool({
  user: "postgres",
  password: "WRIddho195102%",
  host: "localhost",
  port: 5432,
  database: "tutor_hub"
});

module.exports = pool;