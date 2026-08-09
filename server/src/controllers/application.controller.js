const {
  applyToPost, getApplicationsForPost, getMyPostApplications,
  applyToRequest, getApplicationsForRequest, getMyRequestApplications,
  acceptPostApplication,
} = require('../models/application.model');

async function applyPost(req, res) {
  try {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ error: 'postId is required.' });

    const application = await applyToPost(req.studentId, postId);
    res.status(201).json({ message: 'Applied successfully', application });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already applied to this post.' });
    }
    console.error('ApplyPost error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function myPostApplications(req, res) {
  try {
    const applications = await getMyPostApplications(req.studentId);
    res.status(200).json({ applications });
  } catch (err) {
    console.error('MyPostApplications error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function viewPostApplications(req, res) {
  try {
    const applications = await getApplicationsForPost(req.params.postId);
    res.status(200).json({ applications });
  } catch (err) {
    console.error('ViewPostApplications error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function acceptApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const result = await acceptPostApplication(applicationId, req.teacherId);

    if (!result.out_success) {
      return res.status(400).json({ error: result.out_message });
    }
    res.status(200).json({
      message: result.out_message,
      matchId: result.out_match_id,
    });
  } catch (err) {
    console.error('AcceptApplication error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { applyPost, myPostApplications, viewPostApplications, acceptApplication };