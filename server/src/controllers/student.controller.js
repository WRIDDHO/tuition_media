const {
  createStudentProfile,
  findStudentByUserId,
  findStudentById,
  updateStudentProfile,
} = require('../models/student.model');

async function createProfile(req, res) {
  try {
    const existing = await findStudentByUserId(req.user.userId);
    if (existing) {
      return res.status(409).json({ error: 'Student profile already exists.' });
    }

    const newProfile = await createStudentProfile(req.user.userId, req.body);
    res.status(201).json({ message: 'Student profile created', student: newProfile });
  } catch (err) {
    console.error('CreateProfile error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getMyProfile(req, res) {
  try {
    const student = await findStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    res.status(200).json({ student });
  } catch (err) {
    console.error('GetMyProfile error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function updateMyProfile(req, res) {
  try {
    const updated = await updateStudentProfile(req.user.userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }
    res.status(200).json({ message: 'Profile updated', student: updated });
  } catch (err) {
    console.error('UpdateMyProfile error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getStudentPublic(req, res) {
  try {
    const student = await findStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    res.status(200).json({ student });
  } catch (err) {
    console.error('GetStudentPublic error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { createProfile, getMyProfile, updateMyProfile, getStudentPublic };