// In-memory fallback stores
const inMemoryNotifications = [];
const inMemoryActivityLogs = [];

class NotificationService {
  constructor(db) {
    this.db = db;
  }

  async logActivity(userId, action, tableName, recordId, data = {}) {
    try {
      if (this.db && this.db.query) {
        await this.db.query(
          "INSERT INTO activity_log (user_id, action, table_name, record_id, old_values) VALUES (?, ?, ?, ?, ?)",
          [userId, action, tableName, recordId, JSON.stringify(data)]
        );
        return;
      }
    } catch (err) {
      console.warn("[NotificationService] DB logActivity failed, falling back to memory:", err.message);
    }
    inMemoryActivityLogs.push({
      id: inMemoryActivityLogs.length + 1,
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: data,
      created_at: new Date().toISOString()
    });
  }

  async createNotification(userId, actorId, leaveId, type, title, message, actionUrl = "") {
    try {
      if (this.db && this.db.query) {
        await this.db.query(
          "INSERT INTO notifications (user_id, actor_id, leave_id, notification_type, title, message, action_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [userId, actorId, leaveId, type, title, message, actionUrl]
        );
        return;
      }
    } catch (err) {
      console.warn("[NotificationService] DB createNotification failed, falling back to memory:", err.message);
    }
    inMemoryNotifications.push({
      id: inMemoryNotifications.length + 1,
      user_id: userId,
      actor_id: actorId,
      leave_id: leaveId,
      notification_type: type,
      title,
      message,
      action_url: actionUrl,
      is_read: false,
      status: 'unread',
      created_at: new Date().toISOString()
    });
  }

  async getUserNotifications(userId, limit = 20) {
    let list = [];
    try {
      if (this.db && this.db.query) {
        const [rows] = await this.db.query(
          "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
          [userId, parseInt(limit, 10)]
        );
        list = rows;
      }
    } catch (err) {
      console.warn("[NotificationService] DB getUserNotifications failed, falling back to memory:", err.message);
    }
    if (!list || list.length === 0) {
      list = inMemoryNotifications
        .filter(n => n.user_id === userId)
        .slice(0, parseInt(limit, 10));
    }
    return list.map(n => ({
      ...n,
      is_read: Boolean(n.is_read),
      status: n.status || (n.is_read ? 'read' : 'unread')
    }));
  }

  async getUnreadCount(userId) {
    try {
      if (this.db && this.db.query) {
        const [rows] = await this.db.query(
          "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
          [userId]
        );
        return rows[0]?.count || 0;
      }
    } catch (err) {
      console.warn("[NotificationService] DB getUnreadCount failed, falling back to memory:", err.message);
    }
    return inMemoryNotifications.filter(n => n.user_id === userId && !n.is_read).length;
  }

  async markAsRead(id) {
    try {
      if (this.db && this.db.query) {
        await this.db.query(
          "UPDATE notifications SET is_read = TRUE WHERE id = ?",
          [id]
        );
        return;
      }
    } catch (err) {
      console.warn("[NotificationService] DB markAsRead failed, falling back to memory:", err.message);
    }
    const item = inMemoryNotifications.find(n => n.id === parseInt(id, 10));
    if (item) {
      item.is_read = true;
      item.status = 'read';
    }
  }

  async getActivityLog(filters = {}, limit = 50, offset = 0) {
    try {
      if (this.db && this.db.query) {
        const [rows] = await this.db.query(
          "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ? OFFSET ?",
          [parseInt(limit, 10), parseInt(offset, 10)]
        );
        return rows;
      }
    } catch (err) {
      console.warn("[NotificationService] DB getActivityLog failed, falling back to memory:", err.message);
    }
    return inMemoryActivityLogs.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));
  }

  async notifyLeaveRejected(leaveId, studentId, studentUsername, fromDate, toDate, rejectorName, studentEmail, reason, rejectionReason) {
    await this.createNotification(
      studentId,
      null,
      leaveId,
      "LEAVE_REJECTED",
      "❌ Leave Request Rejected",
      `Your leave request from ${fromDate} to ${toDate} was rejected by ${rejectorName}. Reason: ${rejectionReason || "Not specified"}`,
      `/dashboard?leave=${leaveId}`
    );
  }

  async notifyLeaveForwarded(leaveId, studentId, studentUsername, fromDate, toDate, forwarderName, forwardToRole, studentEmail, reason) {
    await this.createNotification(
      studentId,
      null,
      leaveId,
      "LEAVE_FORWARDED",
      "↗️ Leave Request Forwarded",
      `Your leave request from ${fromDate} to ${toDate} was forwarded by ${forwarderName} to ${forwardToRole} for further review.`,
      `/dashboard?leave=${leaveId}`
    );
  }
}

module.exports = NotificationService;
