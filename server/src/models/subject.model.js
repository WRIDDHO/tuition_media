const pool = require('../config/db');
//firstly do models-> seed_subjects.sql ->subject.controller.js->subject.routes.js->app.js a add->Checking thunter client
async function getAllSubjects() {
  const result = await pool.query(
    `SELECT * FROM subjects ORDER BY subject_name ASC`
  );
  return result.rows;
}

async function findSubjectByName(subjectName) {
  const result = await pool.query(
    `SELECT * FROM subjects WHERE subject_name = $1`,
    [subjectName]
  );
  return result.rows[0];
}

async function createSubject({ subjectName, category }) {
  const result = await pool.query(
    `INSERT INTO subjects (subject_name, category)
     VALUES ($1, $2)
     RETURNING *`,
    [subjectName, category]
  );
  return result.rows[0];
}

module.exports = { getAllSubjects, findSubjectByName, createSubject };