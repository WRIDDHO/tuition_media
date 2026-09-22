const {
  applyToPost, getApplicationsForPost, getMyPostApplications,
  rejectPostApplication, withdrawPostApplication,
  applyToRequest, getApplicationsForRequest, getMyRequestApplications,
  rejectRequestApplication, withdrawRequestApplication,
  acceptPostApplication, acceptRequestApplication,
} = require('../models/application.model');
const { getTeacherPostById } = require('../models/teacherPost.model');
const { getStudentRequestById } = require('../models/studentRequest.model');
const { isValidId } = require('../utils/validate');
const { sendDbError } = require('../utils/dbErrors');

// =======================================================================
// Post-side: student applies to a teacher's tuition post
// =======================================================================

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
    sendDbError(res, err, 'ApplyPost');
  }
}

async function myPostApplications(req, res) {
  try {
    const applications = await getMyPostApplications(req.studentId);
    res.status(200).json({ applications });
  } catch (err) {
    sendDbError(res, err, 'MyPostApplications');
  }
}

async function viewPostApplications(req, res) {
  try {
    if (!isValidId(req.params.postId)) {
      return res.status(400).json({ error: 'Invalid post id.' });
    }

    // FIXED (Phase 3, flagged in the Phase 1 audit): this previously
    // returned any post's applicant list to any authenticated teacher --
    // ownership was never checked. A teacher can now only view
    // applications for a post they actually own.
    const post = await getTeacherPostById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    if (post.teacher_id !== req.teacherId) {
      return res.status(403).json({ error: 'You do not own this post.' });
    }

    const applications = await getApplicationsForPost(req.params.postId);
    res.status(200).json({ applications });
  } catch (err) {
    sendDbError(res, err, 'ViewPostApplications');
  }
}

async function acceptApplication(req, res) {
  try {
    if (!isValidId(req.params.applicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    const result = await acceptPostApplication(req.params.applicationId, req.teacherId);
    if (!result.out_success) {
      const status = result.out_message === 'Application not found' ? 404 : 400;
      return res.status(status).json({ error: result.out_message });
    }
    res.status(200).json({ message: result.out_message, matchId: result.out_match_id });
  } catch (err) {
    sendDbError(res, err, 'AcceptApplication');
  }
}

async function rejectApplication(req, res) {
  try {
    if (!isValidId(req.params.applicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    const rejected = await rejectPostApplication(req.params.applicationId, req.teacherId);
    if (!rejected) {
      return res.status(404).json({ error: 'Application not found, already resolved, or you do not own this post.' });
    }
    res.status(200).json({ message: 'Application rejected', application: rejected });
  } catch (err) {
    sendDbError(res, err, 'RejectApplication');
  }
}

async function withdrawApplication(req, res) {
  try {
    if (!isValidId(req.params.applicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    const withdrawn = await withdrawPostApplication(req.params.applicationId, req.studentId);
    if (!withdrawn) {
      return res.status(404).json({ error: 'Application not found, already resolved, or not yours.' });
    }
    res.status(200).json({ message: 'Application withdrawn' });
  } catch (err) {
    sendDbError(res, err, 'WithdrawApplication');
  }
}

// =======================================================================
// Request-side: teacher applies to a student's tuition request
// =======================================================================

async function applyRequest(req, res) {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId is required.' });

    const application = await applyToRequest(req.teacherId, requestId);
    res.status(201).json({ message: 'Applied successfully', application });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already applied to this request.' });
    }
    sendDbError(res, err, 'ApplyRequest');
  }
}

async function myRequestApplications(req, res) {
  try {
    const applications = await getMyRequestApplications(req.teacherId);
    res.status(200).json({ applications });
  } catch (err) {
    sendDbError(res, err, 'MyRequestApplications');
  }
}

async function viewRequestApplications(req, res) {
  try {
    if (!isValidId(req.params.requestId)) {
      return res.status(400).json({ error: 'Invalid request id.' });
    }

    const request = await getStudentRequestById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    if (request.student_id !== req.studentId) {
      return res.status(403).json({ error: 'You do not own this request.' });
    }

    const applications = await getApplicationsForRequest(req.params.requestId);
    res.status(200).json({ applications });
  } catch (err) {
    sendDbError(res, err, 'ViewRequestApplications');
  }
}

async function acceptRequestApplicationHandler(req, res) {
  try {
    if (!isValidId(req.params.applicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    const result = await acceptRequestApplication(req.params.applicationId, req.studentId);
    if (!result.out_success) {
      const status = result.out_message === 'Application not found' ? 404 : 400;
      return res.status(status).json({ error: result.out_message });
    }
    res.status(200).json({ message: result.out_message, matchId: result.out_match_id });
  } catch (err) {
    sendDbError(res, err, 'AcceptRequestApplication');
  }
}

async function rejectRequestApplicationHandler(req, res) {
  try {
    if (!isValidId(req.params.applicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    const rejected = await rejectRequestApplication(req.params.applicationId, req.studentId);
    if (!rejected) {
      return res.status(404).json({ error: 'Application not found, already resolved, or you do not own this request.' });
    }
    res.status(200).json({ message: 'Application rejected', application: rejected });
  } catch (err) {
    sendDbError(res, err, 'RejectRequestApplication');
  }
}

async function withdrawRequestApplicationHandler(req, res) {
  try {
    if (!isValidId(req.params.applicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    const withdrawn = await withdrawRequestApplication(req.params.applicationId, req.teacherId);
    if (!withdrawn) {
      return res.status(404).json({ error: 'Application not found, already resolved, or not yours.' });
    }
    res.status(200).json({ message: 'Application withdrawn' });
  } catch (err) {
    sendDbError(res, err, 'WithdrawRequestApplication');
  }
}

module.exports = {
  applyPost, myPostApplications, viewPostApplications, acceptApplication,
  rejectApplication, withdrawApplication,
  applyRequest, myRequestApplications, viewRequestApplications,
  acceptRequestApplication: acceptRequestApplicationHandler,
  rejectRequestApplication: rejectRequestApplicationHandler,
  withdrawRequestApplication: withdrawRequestApplicationHandler,
};
