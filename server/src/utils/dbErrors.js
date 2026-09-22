// Shared mapping from common Postgres error codes to proper HTTP
// responses, so controllers don't each repeat the same err.code checks
// (and so raw Postgres errors never reach the client).
function sendDbError(res, err, context) {
  console.error(`${context} error:`, err.message);

  if (err.code === '23505') {
    // unique_violation -- e.g. duplicate application, duplicate bookmark,
    // duplicate review for the same match
    return res.status(409).json({ error: 'This already exists.' });
  }
  if (err.code === '23503') {
    // foreign_key_violation -- the referenced post/request/subject/etc. doesn't exist
    return res.status(400).json({ error: 'One of the referenced items does not exist.' });
  }
  if (err.code === '23514' || err.code === '22007' || err.code === '22P02') {
    // check_violation / invalid datetime format / invalid text representation
    return res.status(400).json({ error: 'Invalid input.' });
  }
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { sendDbError };
