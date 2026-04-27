const Notification = require('../models/Notification');

// backend/controllers/notificationController.js

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'name avatar')
            .populate('post', 'title')
            .sort({ createdAt: -1 });

        // Calculate unread count for the badge
        const unreadCount = notifications.filter(n => !n.isRead).length;

        // CRITICAL: Send as an object, not just the array
        res.json({
            notifications: notifications,
            unreadCount: unreadCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        // Tweak: Only target notifications that aren't read yet
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false }, 
            { isRead: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};