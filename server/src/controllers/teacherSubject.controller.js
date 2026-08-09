const {
  addSubjectToTeacher,
  getSubjectsByTeacher,
  removeSubjectFromTeacher,
} = require('../models/teacherSubject.model');

async function addSubject(req, res) {
  try {
    const { subjectId, proficiencyLevel } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId is required.' });
    }

    const teacherId = req.teacherId; // will be set by a small helper below
    const link = await addSubjectToTeacher(teacherId, subjectId, proficiencyLevel);
    res.status(201).json({ message: 'Subject added', link });
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL unique_violation code
      return res.status(409).json({ error: 'This subject is already added.' });
    }
    console.error('AddSubject error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listMySubjects(req, res) {
  try {
    const subjects = await getSubjectsByTeacher(req.teacherId);
    res.status(200).json({ subjects });
    /*
    `req.teacherId` is not set yet. The token contains the `userId`, 
    but we need the separate `teacher_id` from the `teachers` table. 
    We will solve this by creating a small middleware that gets the `teacher_id` using the `userId` from the token.

    */
  } catch (err) {
    console.error('ListMySubjects error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function removeSubject(req, res) {
  try {
    const { subjectId } = req.params;
    const removed = await removeSubjectFromTeacher(req.teacherId, subjectId);
    if (!removed) {
      return res.status(404).json({ error: 'Subject link not found.' });
    }
    res.status(200).json({ message: 'Subject removed' });
  } catch (err) {
    console.error('RemoveSubject error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { addSubject, listMySubjects, removeSubject };
//firstly do that