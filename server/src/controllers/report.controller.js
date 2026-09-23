const {
  createReport, getMyReports, getReportsAboutMe, getReportForParticipant,
  submitExplanation, getEvidenceForReport, addEvidence,
} = require('../models/report.model');
const { buildEvidenceUrl } = require('../middleware/upload.middleware');

function sendDbError(res, err, label) {
  console.error(`${label} error:`, err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

function isValidId(id) {
  return /^\d+$/.test(String(id));
}

const VALID_REASONS = [
  'misbehavior', 'harassment', 'inappropriate_communication', 'fake_information',
  'payment_issue', 'failure_to_attend', 'repeated_cancellation',
  'academic_misconduct', 'fraud_scam', 'agreement_violation', 'other',
];

async function create(req, res) {
  try {
    const { matchId, reason, description } = req.body;
    if (!matchId || !isValidId(matchId)) {
      return res.status(400).json({ error: 'A valid matchId is required.' });
    }
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'A description is required.' });
    }

    const result = await createReport(req.user.userId, matchId, reason, description.trim());
    if (!result.out_success) {
      return res.status(400).json({ error: result.out_message });
    }

    // Evidence, if any files were attached to this same multipart request.
    if (req.files?.length) {
      for (const file of req.files) {
        await addEvidence(result.out_report_id, req.user.userId, buildEvidenceUrl(file.filename), file.originalname);
      }
    }

    res.status(201).json({ message: result.out_message, reportId: result.out_report_id });
  } catch (err) {
    sendDbError(res, err, 'CreateReport');
  }
}

async function listMine(req, res) {
  try {
    const reports = await getMyReports(req.user.userId);
    res.status(200).json({ reports });
  } catch (err) {
    sendDbError(res, err, 'ListMyReports');
  }
}

async function listAboutMe(req, res) {
  try {
    const reports = await getReportsAboutMe(req.user.userId);
    res.status(200).json({ reports });
  } catch (err) {
    sendDbError(res, err, 'ListReportsAboutMe');
  }
}

async function getOne(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid report id.' });
    }
    const report = await getReportForParticipant(req.params.id, req.user.userId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // FIXED: compute which side the viewer is on server-side (never
    // trust the client to figure this out from a name match), then
    // strip the raw ids so neither party's numeric user_id leaks to
    // the other through this response.
    const viewerRole = report.reporter_user_id === req.user.userId ? 'reporter' : 'reported';
    delete report.reporter_user_id;
    delete report.reported_user_id;

    // Evidence is visible to both participants -- it's the substance of
    // the complaint, not an admin-private note.
    const evidence = await getEvidenceForReport(req.params.id);
    res.status(200).json({ report: { ...report, viewerRole }, evidence });
  } catch (err) {
    sendDbError(res, err, 'GetReport');
  }
}

async function explain(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid report id.' });
    }
    const { explanation } = req.body;
    if (!explanation || !explanation.trim()) {
      return res.status(400).json({ error: 'An explanation is required.' });
    }

    const result = await submitExplanation(req.params.id, req.user.userId, explanation.trim());
    if (!result.out_success) {
      return res.status(400).json({ error: result.out_message });
    }

    if (req.files?.length) {
      for (const file of req.files) {
        await addEvidence(req.params.id, req.user.userId, buildEvidenceUrl(file.filename), file.originalname);
      }
    }

    res.status(200).json({ message: result.out_message });
  } catch (err) {
    sendDbError(res, err, 'SubmitExplanation');
  }
}

module.exports = { create, listMine, listAboutMe, getOne, explain, VALID_REASONS };