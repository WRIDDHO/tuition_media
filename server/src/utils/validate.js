// URL params are always strings; reject anything that is not a positive
// integer before it ever reaches a SQL query. Shared across controllers
// so each one doesn't redefine its own copy.
function isValidId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

module.exports = { isValidId };
