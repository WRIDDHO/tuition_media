const { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../models/notification.model');

async function listMine(req, res) {
  try {
    const notifications = await getMyNotifications(req.user.userId);
    res.status(200).json({ notifications });
  } catch (err) {
    console.error('ListNotifications error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function unreadCount(req, res) {
  try {
    const result = await getUnreadCount(req.user.userId);
    res.status(200).json(result);
  } catch (err) {
    console.error('UnreadCount error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function markOneRead(req, res) {
  try {
    const updated = await markAsRead(req.params.id, req.user.userId);
    if (!updated) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.status(200).json({ message: 'Marked as read', notification: updated });
  } catch (err) {
    console.error('MarkOneRead error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

async function markAllRead(req, res) {
  try {
    const count = await markAllAsRead(req.user.userId);
    res.status(200).json({ message: `${count} notifications marked as read` });
  } catch (err) {
    console.error('MarkAllRead error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

module.exports = { listMine, unreadCount, markOneRead, markAllRead };