const pool = require('../config/db');

async function getMyNotifications(userId) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*)::INTEGER AS unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0];
}

async function markAsRead(notificationId, userId) {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE notification_id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

async function markAllAsRead(userId) {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rowCount;
}

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };