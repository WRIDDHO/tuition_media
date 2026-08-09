const { getAllSubjects, findSubjectByName, createSubject } = require('../models/subject.model');

async function listSubjects(req, res) {
  try {
    const subjects = await getAllSubjects();
    res.status(200).json({ subjects });
  } catch (err) {
    console.error('ListSubjects error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function addSubject(req, res) {
  try {
    const { subjectName, category } = req.body;

    if (!subjectName) {
      return res.status(400).json({ error: 'subjectName is required.' });
    }

    const existing = await findSubjectByName(subjectName);
    if (existing) {
      return res.status(409).json({ error: 'This subject already exists.' });
    }

    const newSubject = await createSubject({ subjectName, category });
    res.status(201).json({ message: 'Subject created', subject: newSubject });
  } catch (err) {
    console.error('AddSubject error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { listSubjects, addSubject };