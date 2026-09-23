const pool = require('../config/db');

// Deliberately excludes resolution_note (admin-only, per spec §12) --
// admin's own view in admin.model.js uses a separate query that does
// include it. reporter_user_id/reported_user_id are selected so the
// controller can compute which side the viewer is on, but the
// controller strips these raw ids before sending the response --
// a participant should see "you are the reported party", never the
// other person's numeric id.
const REPORT_SELECT_SQL = `
  SELECT
      r.report_id, r.match_id, r.reason, r.description, r.status,
      r.reporter_user_id, r.reported_user_id,
      r.explanation, r.explanation_requested_at, r.explanation_deadline,
      r.explanation_submitted_at, r.resolution_action,
      r.resolved_at, r.created_at,
      reporter.full_name AS reporter_name,
      reported.full_name AS reported_name
  FROM reports r
  JOIN users reporter ON reporter.user_id = r.reporter_user_id
  JOIN users reported ON reported.user_id = r.reported_user_id
`;

// Creates the report via the stored procedure, which itself derives
// reported_user_id from the match and verifies the reporter is a
// participant -- this function never accepts a reported_user_id at all.
async function createReport(reporterUserId, matchId, reason, description) {
  const result = await pool.query(
    `CALL create_match_report($1, $2, $3, $4, NULL, NULL, NULL)`,
    [reporterUserId, matchId, reason, description]
  );
  return result.rows[0]; // { out_success, out_message, out_report_id }
}

async function getMyReports(userId) {
  const result = await pool.query(
    `${REPORT_SELECT_SQL} WHERE r.reporter_user_id = $1 ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Cases where the current user is the reported party -- used for both
// "cases about me" listing and for checking whether they may submit an
// explanation. Deliberately excludes resolution_note (admin-private).
async function getReportsAboutMe(userId) {
  const result = await pool.query(
    `SELECT report_id, match_id, reason, description, status,
            explanation, explanation_requested_at, explanation_deadline,
            explanation_submitted_at, resolution_action, resolved_at, created_at
     FROM reports WHERE reported_user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Full detail for a participant (reporter or reported user) -- omits
// resolution_note, which stays admin-only.
async function getReportForParticipant(reportId, userId) {
  const result = await pool.query(
    `${REPORT_SELECT_SQL}
     WHERE r.report_id = $1 AND (r.reporter_user_id = $2 OR r.reported_user_id = $2)`,
    [reportId, userId]
  );
  return result.rows[0];
}

async function submitExplanation(reportId, userId, explanation) {
  const result = await pool.query(
    `CALL submit_report_explanation($1, $2, $3, NULL, NULL)`,
    [userId, reportId, explanation]
  );
  return result.rows[0];
}

async function getEvidenceForReport(reportId) {
  const result = await pool.query(
    `SELECT evidence_id, report_id, uploaded_by, file_url, original_filename, uploaded_at
     FROM report_evidence WHERE report_id = $1 ORDER BY uploaded_at ASC`,
    [reportId]
  );
  return result.rows;
}

async function addEvidence(reportId, uploadedBy, fileUrl, originalFilename) {
  const result = await pool.query(
    `INSERT INTO report_evidence (report_id, uploaded_by, file_url, original_filename)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [reportId, uploadedBy, fileUrl, originalFilename]
  );
  return result.rows[0];
}

module.exports = {
  createReport, getMyReports, getReportsAboutMe, getReportForParticipant,
  submitExplanation, getEvidenceForReport, addEvidence,
};