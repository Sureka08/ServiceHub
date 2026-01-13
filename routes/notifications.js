const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');

// @route   GET /api/notifications
// @desc    Get notifications for the authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = { recipient: req.user.id };
    
    // Admin gets all notifications
    if (req.user.role === 'admin') {
      query = {};
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { recipient, type, title, message, bookingId, relatedEntity, entityId, priority, actionRequired, actionUrl } = req.body;

    const notification = new Notification({
      sender: req.user.id,
      recipient: recipient || req.user.id,
      type: type || 'announcement',
      title: title || 'New Notification',
      message: message || '',
      relatedEntity: relatedEntity || 'user',
      entityId: entityId || req.user.id,
      booking: bookingId || null,
      priority: priority || 'medium',
      actionRequired: actionRequired || false,
      actionUrl: actionUrl || null,
      isRead: false
    });

    await notification.save();

    // Emit real-time notification if socket.io is available
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(recipient?.toString() || req.user.id.toString()).emit('newNotification', {
        notification
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error during notification creation' });
  }
});


// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user can delete this notification
    if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    let query = { recipient: req.user.id, isRead: false };
    
    // Admin gets count of all unread notifications
    if (req.user.role === 'admin') {
      query = { isRead: false };
    }

    const count = await Notification.countDocuments(query);

    res.json({
      success: true,
      unreadCount: count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

module.exports = router;
