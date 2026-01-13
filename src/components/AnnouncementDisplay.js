import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  FaBell,
  FaGift,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaCheck
} from 'react-icons/fa';

const AnnouncementDisplay = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/announcements');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId) => {
    try {
      await axios.post(`/api/announcements/${announcementId}/read`);
      // Update local state to mark as read
      setAnnouncements(prev => 
        prev.map(ann => 
          ann._id === announcementId 
            ? { ...ann, isRead: true }
            : ann
        )
      );
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const toggleExpanded = (announcementId) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(announcementId)) {
      newExpanded.delete(announcementId);
    } else {
      newExpanded.add(announcementId);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const getTypeIcon = (type) => {
    switch (type) {
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'offer':
      case 'festival':
        return 'border-purple-500 bg-purple-50';
      case 'urgent':
      case 'maintenance':
        return 'border-red-500 bg-red-50';
      case 'feedback':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <FaSpinner className="animate-spin text-3xl text-primary-500" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return null; // Don't display the component if there are no announcements
  }

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <FaBell className="mr-2 text-primary-500" /> Latest Announcements
      </h3>
      <div className="space-y-4">
        {announcements.map((announcement) => {
          const isExpanded = expandedAnnouncements.has(announcement._id);
          const isRead = announcement.isRead;
          
          return (
            <div
              key={announcement._id}
              className={`border-l-4 ${getTypeColor(announcement.type)} rounded-lg shadow-sm ${
                !isRead ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(announcement.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-semibold ${isRead ? 'text-gray-700' : 'text-blue-800'}`}>
                          {announcement.title}
                        </span>
                        {announcement.priority === 'urgent' && (
                          <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">URGENT</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Posted: {new Date(announcement.createdAt).toLocaleDateString()}
                        {announcement.endDate && ` | Expires: ${new Date(announcement.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                    {!isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(announcement._id); }}
                        className="text-xs text-green-600 hover:text-green-800 flex items-center"
                        title="Mark as read"
                      >
                        <FaCheck className="w-3 h-3 mr-1" />
                        Read
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpanded(announcement._id); }}
                      className="text-gray-500 hover:text-gray-700"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 text-gray-700 border-t border-gray-200 pt-3">
                    <p className="mb-2">{announcement.content}</p>
                    {announcement.type === 'offer' && announcement.offerDetails && (
                      <div className="bg-white p-3 rounded-md border border-dashed border-purple-300 mt-2">
                        <p className="font-medium text-purple-700">Special Offer!</p>
                        {announcement.offerDetails.discountPercentage && (
                          <p>Discount: {announcement.offerDetails.discountPercentage}%</p>
                        )}
                        {announcement.offerDetails.discountAmount && (
                          <p>Amount Off: LKR {announcement.offerDetails.discountAmount}</p>
                        )}
                        {announcement.offerDetails.promoCode && (
                          <p>Promo Code: <span className="font-bold text-purple-900">{announcement.offerDetails.promoCode}</span></p>
                        )}
                        {announcement.offerDetails.validServices?.length > 0 && (
                          <p>Valid on: {announcement.offerDetails.validServices.map(s => s.name || s).join(', ')}</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Posted by {announcement.createdBy?.username || 'Admin'} on {new Date(announcement.createdAt).toLocaleDateString()}
                      {announcement.endDate && ` | Expires: ${new Date(announcement.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementDisplay;

