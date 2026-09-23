const {
  getPlatformStats,
  listPendingTeachers,
  listAllTeachers,
  getTeacherDetailForAdmin,
  approveTeacher,
  rejectTeacher,
  listAllStudents,
  setAccountStatus,
  deleteUserAccount,
  listAllMatches,
  listReportsByStatus, getReportDetailForAdmin, getReportStats,
  markUnderReview, requestExplanationForReport, resolveReportAsAdmin,
} = require('../models/admin.model');
const { getEvidenceForReport } = require('../models/report.model');
// Shared pagination parsing: page starts at 1, limit is capped so nobody
// can accidentally (or deliberately) ask for the entire users table in
// one request.
function getPagination(req) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

// Every DB procedure below returns { out_success, out_message }. This maps
// that shape onto a normal HTTP response so every action route can share
// the same handling instead of repeating it five times.
function respondFromProcedure(res, result, successStatus = 200) {
  if (!result.out_success) {
    const status = result.out_message === 'User not found' ? 404 : 400;
    return res.status(status).json({ error: result.out_message });
  }
  return res.status(successStatus).json({ message: result.out_message });
}

async function getStats(req, res) {
  try {
    const stats = await getPlatformStats();
    res.status(200).json({ stats });
  } catch (err) {
    console.error('Admin getStats error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getPendingTeachers(req, res) {
  try {
    const teachers = await listPendingTeachers();
    res.status(200).json({ count: teachers.length, teachers });
  } catch (err) {
    console.error('Admin getPendingTeachers error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getAllTeachers(req, res) {
  try {
    const { limit, page, offset } = getPagination(req);
    const rows = await listAllTeachers(limit, offset);
    const totalCount = rows[0] ? Number(rows[0].total_count) : 0;
    const teachers = rows.map(({ total_count, ...rest }) => rest);
    res.status(200).json({ teachers, page, limit, totalCount });
  } catch (err) {
    console.error('Admin getAllTeachers error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getTeacherDetail(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid teacher id.' });
    }

    const teacher = await getTeacherDetailForAdmin(userId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }
    res.status(200).json({ teacher });
  } catch (err) {
    console.error('Admin getTeacherDetail error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function approveTeacherAccount(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid teacher id.' });
    }

    const result = await approveTeacher(req.user.userId, userId);
    respondFromProcedure(res, result);
  } catch (err) {
    console.error('Admin approveTeacherAccount error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function rejectTeacherAccount(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid teacher id.' });
    }

    const { reason } = req.body;
    const result = await rejectTeacher(req.user.userId, userId, reason);
    respondFromProcedure(res, result);
  } catch (err) {
    console.error('Admin rejectTeacherAccount error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function getAllStudents(req, res) {
  try {
    const { limit, page, offset } = getPagination(req);
    const rows = await listAllStudents(limit, offset);
    const totalCount = rows[0] ? Number(rows[0].total_count) : 0;
    const students = rows.map(({ total_count, ...rest }) => rest);
    res.status(200).json({ students, page, limit, totalCount });
  } catch (err) {
    console.error('Admin getAllStudents error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function suspendAccount(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    const { reason } = req.body;
    const result = await setAccountStatus(req.user.userId, userId, 'suspended', reason);
    respondFromProcedure(res, result);
  } catch (err) {
    console.error('Admin suspendAccount error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function activateAccount(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    const { reason } = req.body;
    const result = await setAccountStatus(req.user.userId, userId, 'active', reason);
    respondFromProcedure(res, result);
  } catch (err) {
    console.error('Admin activateAccount error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function deleteAccount(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    // An admin can't accidentally delete their own account through this
    // endpoint -- the procedure also refuses any 'admin' role, but this
    // catches it earlier with a clearer message.
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account here.' });
    }

    const { reason } = req.body;
    const result = await deleteUserAccount(req.user.userId, userId, reason);
    respondFromProcedure(res, result);
  } catch (err) {
    console.error('Admin deleteAccount error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
async function getAllMatches(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const rows = await listAllMatches(limit, offset);
    const totalCount = rows[0]?.total_count ? Number(rows[0].total_count) : 0;

    res.status(200).json({
      matches: rows.map(({ total_count, ...rest }) => rest),
      page,
      limit,
      totalCount,
    });
  } catch (err) {
    sendDbError(res, err, 'GetAllMatches');
  }
}
const VALID_STATUS_FILTERS = {
  pending: ['pending'],
  under_review: ['under_review'],
  waiting: ['explanation_requested'],
  explanation_received: ['explanation_received'],
  resolved: ['resolved'],
  dismissed: ['dismissed'],
};

async function getAllReports(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const bucket = req.query.status; // 'pending' | 'under_review' | 'waiting' | ...
    const statuses = bucket ? VALID_STATUS_FILTERS[bucket] : null;

    if (bucket && !statuses) {
      return res.status(400).json({ error: 'Invalid status filter.' });
    }

    const reports = await listReportsByStatus(statuses, limit, offset);
    res.status(200).json({ reports, page, limit });
  } catch (err) {
    sendDbError(res, err, 'GetAllReports');
  }
}

async function getReportStatsHandler(req, res) {
  try {
    const stats = await getReportStats();
    res.status(200).json(stats);
  } catch (err) {
    sendDbError(res, err, 'GetReportStats');
  }
}

async function getReportDetail(req, res) {
  try {
    const report = await getReportDetailForAdmin(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    const evidence = await getEvidenceForReport(req.params.id);
    res.status(200).json({ report, evidence });
  } catch (err) {
    sendDbError(res, err, 'GetReportDetail');
  }
}

async function reviewReport(req, res) {
  try {
    const updated = await markUnderReview(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found or already reviewed.' });
    }
    res.status(200).json({ message: 'Report moved to under review.' });
  } catch (err) {
    sendDbError(res, err, 'ReviewReport');
  }
}

async function requestExplanation(req, res) {
  try {
    const hours = parseInt(req.body.deadlineHours) || 48;
    const result = await requestExplanationForReport(req.user.userId, req.params.id, hours);
    if (!result.out_success) {
      return res.status(400).json({ error: result.out_message });
    }
    res.status(200).json({ message: result.out_message });
  } catch (err) {
    sendDbError(res, err, 'RequestExplanation');
  }
}

const VALID_ACTIONS = ['dismiss', 'warning', 'temporary_suspension', 'permanent_suspension', 'account_deletion'];

async function resolveReportHandler(req, res) {
  try {
    const { action, note, suspensionDays } = req.body;
    if (!VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'A decision note is required.' });
    }
    if (action === 'temporary_suspension' && (!suspensionDays || suspensionDays < 1)) {
      return res.status(400).json({ error: 'suspensionDays is required for a temporary suspension.' });
    }

    const result = await resolveReportAsAdmin(req.user.userId, req.params.id, action, note.trim(), suspensionDays);
    if (!result.out_success) {
      return res.status(400).json({ error: result.out_message });
    }
    res.status(200).json({ message: result.out_message });
  } catch (err) {
    sendDbError(res, err, 'ResolveReport');
  }
}
module.exports = {
  getStats,
  getPendingTeachers,
  getAllTeachers,
  getTeacherDetail,
  approveTeacherAccount,
  rejectTeacherAccount,
  getAllStudents,
  suspendAccount,
  activateAccount,
  deleteAccount,
  getAllMatches,
    getAllReports,
    getReportStatsHandler,
    getReportDetail,
  reviewReport, 
  requestExplanation, 
  resolveReportHandler,
};
