import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { FaBell, FaCheck, FaTimes, FaEye, FaGift, FaExclamationTriangle, FaInfoCircle, FaList } from 'react-icons/fa';

const NotificationBell = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  // Add error handling for the context
  let notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification;
  
  try {
    const context = useNotifications();
    notifications = context.notifications;
    unreadCount = context.unreadCount;
    markAsRead = context.markAsRead;
    markAllAsRead = context.markAllAsRead;
    deleteNotification = context.deleteNotification;
  } catch (error) {
    console.error('NotificationContext error:', error);
    notifications = [];
    unreadCount = 0;
    markAsRead = () => {};
    markAllAsRead = () => {};
    deleteNotification = () => {};
  }


  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created': return '📅';
      case 'booking_assigned': return '👤';
      case 'booking_started': return '🚀';
      case 'booking_completed': return '✅';
      case 'feedback_received': return '💬';
      case 'feedback_reply': return '💬';
      case 'announcement': return '📢';
      case 'inventory_alert': return '⚠️';
      case 'payment_reminder': return '💰';
      default: return '📢';
    }
  };

  const getAnnouncementTypeIcon = (announcementType) => {
    switch (announcementType) {
      case 'offer':
      case 'festival':
        return <FaGift className="text-purple-500" />;
      case 'urgent':
      case 'maintenance':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'feedback':
        return <FaBell className="text-blue-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const handleAnnouncementClick = (notification) => {
    if (notification.isAnnouncement) {
      setSelectedAnnouncement(notification);
      setShowDropdown(false);
    }
  };


  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    
    // Mark all announcements as read when bell is clicked (only if there are unread items)
    if (!showDropdown && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none cursor-pointer"
        title={unreadCount > 0 ? `Click to view notifications and mark all as read (${unreadCount} unread)` : 'Notifications'}
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-[9999] border border-gray-200 max-h-96 overflow-y-auto">
          <div className="py-2">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Link
                  to="/notifications"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => setShowDropdown(false)}
                >
                  <FaList className="mr-1" />
                  View All
                </Link>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                <div>No notifications</div>
                <div className="text-xs text-gray-400 mt-1">
                  Total notifications: {notifications.length}
                </div>
              </div>
            ) : (
              <div>
                {/* Separate announcements and regular notifications */}
                {(() => {
                  const announcements = notifications.filter(n => n.isAnnouncement);
                  const regularNotifications = notifications.filter(n => !n.isAnnouncement);
                  
                  return (
                    <>
                      {/* Announcements Section */}
                      {announcements.length > 0 && (
                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                            📢 Announcements ({announcements.length})
                          </h4>
                        </div>
                      )}
                      
                      {announcements.map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          } cursor-pointer`}
                          onClick={() => handleAnnouncementClick(notification)}
                        >
                          <div className="flex items-start">
                            <span className="text-lg mr-3">
                              {getAnnouncementTypeIcon(notification.announcementType)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                  <span className="ml-2 text-xs text-blue-600">📢 Announcement</span>
                                </p>
                                <span className="text-xs text-gray-400 ml-2">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)} bg-gray-100`}>
                                  {notification.priority}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                  {notification.announcementType}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                                  {notification.targetAudience}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-end mt-2 space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnnouncementClick(notification);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                              title="View announcement"
                            >
                              <FaEye className="w-3 h-3 mr-1" />
                              View
                            </button>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="text-xs text-green-600 hover:text-green-800 flex items-center"
                                title="Mark as read"
                              >
                                <FaCheck className="w-3 h-3 mr-1" />
                                Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Regular Notifications Section */}
                      {regularNotifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            🔔 Notifications ({regularNotifications.length})
                          </h4>
                        </div>
                      )}
                      
                      {regularNotifications.map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <span className="text-lg mr-3">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-400 ml-2">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)} bg-gray-100`}>
                                  {notification.priority}
                                </span>
                                {notification.actionRequired && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                                    Action Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center justify-end mt-2 space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="text-xs text-green-600 hover:text-green-800 flex items-center"
                                title="Mark as read"
                              >
                                <FaCheck className="w-3 h-3 mr-1" />
                                Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Announcement Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 relative">
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
            
            <div className="flex items-start mb-4">
              <div className="mr-3 mt-1">
                {getAnnouncementTypeIcon(selectedAnnouncement.announcementType)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {selectedAnnouncement.title}
                </h3>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedAnnouncement.priority)} bg-gray-100`}>
                    {selectedAnnouncement.priority}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                    {selectedAnnouncement.announcementType}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                    {selectedAnnouncement.targetAudience}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Content:</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedAnnouncement.fullContent || selectedAnnouncement.message}
                </p>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-4">
              <p>Posted: {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              {!selectedAnnouncement.isRead && (
                <button
                  onClick={() => {
                    markAsRead(selectedAnnouncement._id);
                    setSelectedAnnouncement(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <FaCheck className="inline mr-1" />
                  Mark as Read
                </button>
              )}
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationBell;
