const { findBookmark, addBookmark, removeBookmark, getMyBookmarks } = require('../models/bookmark.model');
const { sendDbError } = require('../utils/dbErrors');

async function toggle(req, res) {
  try {
    const { resourceId } = req.params;
    const existing = await findBookmark(req.studentId, resourceId);

    if (existing) {
      await removeBookmark(req.studentId, resourceId);
      return res.status(200).json({ message: 'Bookmark removed', bookmarked: false });
    } else {
      await addBookmark(req.studentId, resourceId);
      return res.status(201).json({ message: 'Bookmark added', bookmarked: true });
    }
  } catch (err) {
    // resource_bookmarks has a composite PRIMARY KEY (student_id,
    // resource_id) -- if two toggle requests race between the check above
    // and the insert, the second one lands here instead of creating a
    // duplicate row. Treat it the same as "already bookmarked".
    if (err.code === '23505') {
      return res.status(200).json({ message: 'Already bookmarked', bookmarked: true });
    }
    sendDbError(res, err, 'ToggleBookmark');
  }
}

async function listMine(req, res) {
  try {
    const bookmarks = await getMyBookmarks(req.studentId);
    res.status(200).json({ bookmarks });
  } catch (err) {
    sendDbError(res, err, 'ListBookmarks');
  }
}

module.exports = { toggle, listMine };