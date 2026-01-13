const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');

// @route   GET /api/announcements
// @desc    Get announcements for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.getActiveForUser(req.user.role, req.user.id);
    
    // Add read status for each announcement
    const announcementsWithReadStatus = announcements.map(announcement => {
      const announcementObj = announcement.toObject();
      announcementObj.isRead = announcement.isReadBy(req.user.id);
      return announcementObj;
    });

    res.json({
      success: true,
      announcements: announcementsWithReadStatus
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error while fetching announcements' });
  }
});

// @route   GET /api/announcements/admin
// @desc    Get all announcements (admin only)
// @access  Private (Admin)
router.get('/admin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { page = 1, limit = 10, type, targetAudience, isActive } = req.query;
    const query = {};

    if (type) query.type = type;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'username email')
      .populate('relatedFeedback')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Announcement.countDocuments(query);

    res.json({
      success: true,
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get admin announcements error:', error);
    res.status(500).json({ message: 'Server error while fetching announcements' });
  }
});

// @route   GET /api/announcements/stats
// @desc    Get announcement statistics (admin only)
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const stats = await Announcement.getStats();
    const totalAnnouncements = await Announcement.countDocuments();
    const activeAnnouncements = await Announcement.countDocuments({
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: new Date() } }
      ]
    });

    res.json({
      success: true,
      stats: {
        total: totalAnnouncements,
        active: activeAnnouncements,
        inactive: totalAnnouncements - activeAnnouncements
      }
    });
  } catch (error) {
    console.error('Get announcement stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

// @route   POST /api/announcements
// @desc    Create new announcement (admin only)
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      title,
      content,
      type,
      targetAudience,
      priority,
      startDate,
      endDate,
      relatedFeedback,
      offerDetails
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      type: type || 'general',
      targetAudience: targetAudience || 'all',
      priority: priority || 'normal',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: req.user.id,
      relatedFeedback,
      offerDetails
    });

    await announcement.save();

    // Populate the created announcement
    await announcement.populate([
      { path: 'createdBy', select: 'username email' },
      { path: 'relatedFeedback' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ 
      message: 'Server error while creating announcement'
    });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement (admin only)
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      title,
      content,
      type,
      targetAudience,
      priority,
      isActive,
      startDate,
      endDate,
      offerDetails
    } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Update fields
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (type !== undefined) announcement.type = type;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (priority !== undefined) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (startDate !== undefined) announcement.startDate = new Date(startDate);
    if (endDate !== undefined) announcement.endDate = endDate ? new Date(endDate) : undefined;
    if (offerDetails !== undefined) announcement.offerDetails = offerDetails;

    await announcement.save();

    // Populate the updated announcement
    await announcement.populate([
      { path: 'createdBy', select: 'username email' },
      { path: 'relatedFeedback' }
    ]);

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error while updating announcement' });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement (admin only)
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error while deleting announcement' });
  }
});

// @route   POST /api/announcements/:id/read
// @desc    Mark announcement as read
// @access  Private
router.post('/:id/read', protect, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.markAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Mark announcement as read error:', error);
    res.status(500).json({ message: 'Server error while marking announcement as read' });
  }
});

// @route   POST /api/announcements/read-all
// @desc    Mark all announcements as read for current user
// @access  Private
router.post('/read-all', protect, async (req, res) => {
  try {
    const announcements = await Announcement.getActiveForUser(req.user.role, req.user.id);
    
    // Mark all unread announcements as read
    const unreadAnnouncements = announcements.filter(announcement => !announcement.isReadBy(req.user.id));
    
    for (const announcement of unreadAnnouncements) {
      await announcement.markAsRead(req.user.id);
    }

    res.json({
      success: true,
      message: `Marked ${unreadAnnouncements.length} announcements as read`
    });
  } catch (error) {
    console.error('Mark all announcements as read error:', error);
    res.status(500).json({ message: 'Server error while marking announcements as read' });
  }
});

// @route   POST /api/announcements/feedback/:feedbackId
// @desc    Create announcement for feedback (admin only)
// @access  Private (Admin)
router.post('/feedback/:feedbackId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { feedbackId } = req.params;
    const { title, content, targetAudience = 'technicians' } = req.body;

    // Check if feedback exists
    const Feedback = require('../models/Feedback');
    const feedback = await Feedback.findById(feedbackId)
      .populate('technician', 'username email')
      .populate('houseOwner', 'username email')
      .populate('service', 'name');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Create announcement for the feedback
    const announcement = new Announcement({
      title: title || `New Feedback Received - ${feedback.service?.name || 'Service'}`,
      content: content || `Feedback received from ${feedback.houseOwner?.username || 'Customer'} for ${feedback.service?.name || 'service'}. Rating: ${feedback.rating}/5`,
      type: 'feedback',
      targetAudience,
      priority: feedback.rating <= 2 ? 'high' : 'normal',
      createdBy: req.user.id,
      relatedFeedback: feedbackId
    });

    await announcement.save();

    // Populate the created announcement
    await announcement.populate([
      { path: 'createdBy', select: 'username email' },
      { path: 'relatedFeedback' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Feedback announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create feedback announcement error:', error);
    res.status(500).json({ message: 'Server error while creating feedback announcement' });
  }
});

module.exports = router;