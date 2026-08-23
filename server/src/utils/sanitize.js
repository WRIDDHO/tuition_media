// server/src/utils/sanitize.js
//
// HTML forms never send NULL — an untouched input arrives as "".
// Postgres accepts '' for TEXT/VARCHAR but rejects it for
// DATE, TIME, INTEGER and NUMERIC columns (error 22007 / 22P02).
// These helpers sit between req.body and the model layer.

/**
 * Convert undefined, null, and empty/whitespace-only strings into null.
 * Any other value is returned unchanged.
 */
function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

/**
 * Return a shallow copy of obj with emptyToNull applied to the
 * listed fields only. The original object is never mutated.
 */
/**
 * Return a shallow copy of obj with emptyToNull applied to the
 * listed fields. Fields absent from obj are left absent — this
 * keeps partial updates safe. The original object is not mutated.
 */
function cleanBody(obj, fields) {
  const cleaned = { ...obj };
  for (const field of fields) {
    if (!(field in cleaned)) continue;
    cleaned[field] = emptyToNull(cleaned[field]);
  }
  return cleaned;
}

/**
 * Convert a value to a Number, or null if it is empty or not numeric.
 * Use for columns declared INTEGER or NUMERIC.
 */
function toNumberOrNull(value) {
  const v = emptyToNull(value);
  if (v === null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

module.exports = { emptyToNull, cleanBody, toNumberOrNull };