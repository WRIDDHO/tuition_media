const { getMyMatches, getMatchForParticipant, cancelMatch } = require('../models/match.model');

function sendDbError(res, err, label) {
  console.error(`${label} error:`, err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

function isValidId(id) {
  return /^\d+$/.test(String(id));
}

async function listMine(req, res) {
  try {
    const matches = await getMyMatches(req.user.userId);
    res.status(200).json({ matches });
  } catch (err) {
    sendDbError(res, err, 'ListMyMatches');
  }
}

async function getOne(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid match id.' });
    }
    const match = await getMatchForParticipant(req.params.id, req.user.userId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }
    res.status(200).json({ match });
  } catch (err) {
    sendDbError(res, err, 'GetMatch');
  }
}

async function cancel(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid match id.' });
    }
    const { reason } = req.body;
    const cancelled = await cancelMatch(req.params.id, req.user.userId, reason);
    if (!cancelled) {
      return res.status(404).json({ error: 'Match not found, not yours, or not active.' });
    }
    res.status(200).json({ message: 'Match cancelled.' });
  } catch (err) {
    sendDbError(res, err, 'CancelMatch');
  }
}

module.exports = { listMine, getOne, cancel };