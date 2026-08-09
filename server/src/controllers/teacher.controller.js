const {
  createTeacherProfile,
  findTeacherByUserId,
  findTeacherById,
  updateTeacherProfile,
  searchTeachers,
} = require('../models/teacher.model');

async function createProfile(req, res) {
  try {
    const existing = await findTeacherByUserId(req.user.userId);
    if (existing) {
      return res.status(409).json({ error: 'Teacher profile already exists.' });
    }

    const newProfile = await createTeacherProfile(req.user.userId, req.body);
    res.status(201).json({ message: 'Teacher profile created', teacher: newProfile });
  } catch (err) {
    console.error('CreateProfile error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getMyProfile(req, res) {
  try {
    const teacher = await findTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }
    res.status(200).json({ teacher });
  } catch (err) {
    console.error('GetMyProfile error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function updateMyProfile(req, res) {
  try {
    const updated = await updateTeacherProfile(req.user.userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Teacher profile not found.' });
    }
    res.status(200).json({ message: 'Profile updated', teacher: updated });
  } catch (err) {
    console.error('UpdateMyProfile error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getTeacherPublic(req, res) {
  try {
    const teacher = await findTeacherById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    res.status(200).json({ teacher });
  } catch (err) {
    console.error('GetTeacherPublic error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function search(req, res) {
  try {
    const { subject, district, gender, minRate, maxRate, limit } = req.query;
    const teachers = await searchTeachers({
      subjectName: subject,
      district,
      gender,
      minRate,
      maxRate,
      limit,
    });
    res.status(200).json({ count: teachers.length, teachers });
  } catch (err) {
    console.error('SearchTeachers error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { createProfile, getMyProfile, updateMyProfile, getTeacherPublic,search };