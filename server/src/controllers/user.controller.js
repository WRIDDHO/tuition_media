const {
  findUserById,
  updateUser,
  updateProfilePicture,
} = require('../models/user.model');

const { buildProfilePictureUrl } = require('../middleware/upload.middleware');
async function getMe(req, res) {
  try {
    const user = await findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function updateMe(req, res) {
  try {
    const { fullName } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: 'fullName is required.' });
    }

    const updatedUser = await updateUser(req.user.userId, { fullName });

    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error('UpdateMe error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
async function uploadPicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }
    const url = buildProfilePictureUrl(req.file.filename);
    const updated = await updateProfilePicture(req.user.userId, url);
    res.status(200).json({ message: 'Profile picture updated', user: updated });
  } catch (err) {
    console.error('UploadPicture error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
module.exports = { getMe, updateMe, uploadPicture };