const { findBookmark, addBookmark, removeBookmark, getMyBookmarks } = require('../models/bookmark.model');

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
    console.error('ToggleBookmark error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function listMine(req, res) {
  try {
    const bookmarks = await getMyBookmarks(req.studentId);
    res.status(200).json({ bookmarks });
  } catch (err) {
    console.error('ListBookmarks error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { toggle, listMine };