import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications and announcements
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch both notifications and announcements
      const [notificationsResponse, announcementsResponse] = await Promise.all([
        axios.get('/api/notifications'),
        axios.get('/api/announcements')
      ]);
      
      const notifications = notificationsResponse.data.notifications || [];
      const announcements = announcementsResponse.data.announcements || [];
      
      // Convert announcements to notification format
      const announcementNotifications = announcements.map(announcement => ({
        _id: `announcement_${announcement._id}`,
        title: announcement.title,
        message: announcement.content,
        type: 'announcement',
        priority: announcement.priority,
        isRead: announcement.isRead || false,
        createdAt: announcement.createdAt,
        announcementId: announcement._id,
        isAnnouncement: true,
        fullContent: announcement.content,
        announcementType: announcement.type,
        targetAudience: announcement.targetAudience
      }));
      
      // Combine notifications and announcements
      const allNotifications = [...notifications, ...announcementNotifications];
      
      // Sort by creation date (newest first)
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotifications(allNotifications);
      
      // Count unread notifications
      const unreadNotifications = allNotifications.filter(n => !n.isRead);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Check if it's an announcement
      const notification = notifications.find(n => n._id === notificationId);
      
      if (notification && notification.isAnnouncement) {
        // Mark announcement as read
        await axios.post(`/api/announcements/${notification.announcementId}/read`);
      } else {
        // Mark regular notification as read
        await axios.put(`/api/notifications/${notificationId}/read`);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Mark all regular notifications as read
      await axios.put('/api/notifications/read-all');
      
      // Mark all announcements as read
      await axios.post('/api/announcements/read-all');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      toast.success('All notifications and announcements marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);

      if (notification && notification.isAnnouncement) {
        // Announcements are not deleted by users, only marked as read.
        // If the user wants to "dismiss" an announcement, it should be marked as read.
        await markAsRead(notificationId);
        toast('Announcements can only be marked as read, not deleted.');
        return;
      } else {
        await axios.delete(`/api/notifications/${notificationId}`);
      }
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Add new notification (for real-time updates)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Show toast for new notifications based on priority
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      toast.error(notification.message, { duration: 5000 });
    } else if (notification.priority === 'medium') {
      toast(notification.message, { 
        icon: '⚠️',
        duration: 4000 
      });
    } else {
      toast.success(notification.message, { duration: 3000 });
    }
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Set up polling for notifications (every 30 seconds)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
