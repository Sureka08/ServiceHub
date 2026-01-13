import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaStar, 
  FaFilter, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaReply, 
  FaSpinner,
  FaDownload,
  FaCalendarAlt,
  FaComments,
  FaExclamationTriangle,
  FaTrash
} from 'react-icons/fa';
import FeedbackDisplay from '../../components/FeedbackDisplay';

const FeedbackManagement = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    unassigned: 0,
    averageRating: 0
  });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
    fetchTechnicians();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/feedback');
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/feedback/stats');
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await axios.get('/api/feedback/technicians');
      setTechnicians(response.data.technicians || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      toast.error('Failed to load technicians');
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      toast.error('Please select a technician');
      return;
    }

    try {
      await axios.put(`/api/feedback/${selectedFeedback._id}/assign-technician`, {
        technicianId: selectedTechnician
      });
      
      toast.success('Feedback assigned to technician successfully');
      setShowAssignModal(false);
      setSelectedTechnician('');
      setSelectedFeedback(null);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Failed to assign feedback to technician');
    }
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      await axios.put(`/api/feedback/${feedbackId}/status`, { status: newStatus });
      toast.success(`Feedback ${newStatus} successfully`);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update feedback status');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedFeedbacks.length === 0) {
      toast.error('Please select feedbacks to perform bulk action');
      return;
    }

    try {
      const promises = selectedFeedbacks.map(feedbackId => {
        switch (action) {
          case 'approve':
            return axios.put(`/api/feedback/${feedbackId}/status`, { status: 'approved' });
          case 'reject':
            return axios.put(`/api/feedback/${feedbackId}/status`, { status: 'rejected' });
          case 'hide':
            return axios.put(`/api/feedback/${feedbackId}/status`, { status: 'hidden' });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${action} completed for ${selectedFeedbacks.length} feedback(s)`);
      setSelectedFeedbacks([]);
      setShowBulkActions(false);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await axios.post(`/api/feedback/${selectedFeedback._id}/reply`, {
        content: replyContent
      });
      toast.success('Reply sent successfully');
      setShowReplyModal(false);
      setSelectedFeedback(null);
      setReplyContent('');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };


  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/feedback/${feedbackId}`);
      toast.success('Feedback deleted successfully');
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/feedback/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `feedbacks-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Feedbacks exported successfully');
    } catch (error) {
      console.error('Error exporting feedbacks:', error);
      toast.error('Failed to export feedbacks');
    }
  };

  const getFilteredFeedbacks = () => {
    let filtered = [...feedbacks];

    if (searchTerm) {
      filtered = filtered.filter(feedback =>
        feedback.houseOwner?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.technician?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      if (ratingFilter === 'good') {
        filtered = filtered.filter(feedback => feedback.rating >= 4);
      } else if (ratingFilter === 'bad') {
        filtered = filtered.filter(feedback => feedback.rating < 4);
      } else {
        const rating = parseInt(ratingFilter);
        filtered = filtered.filter(feedback => feedback.rating === rating);
      }
    }

    return filtered;
  };

  const handleFeedbackSelect = (feedbackId) => {
    setSelectedFeedbacks(prev => 
      prev.includes(feedbackId) 
        ? prev.filter(id => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const handleSelectAll = () => {
    const filteredFeedbacks = getFilteredFeedbacks();
    if (selectedFeedbacks.length === filteredFeedbacks.length) {
      setSelectedFeedbacks([]);
    } else {
      setSelectedFeedbacks(filteredFeedbacks.map(f => f._id));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const filteredFeedbacks = getFilteredFeedbacks();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-2">Manage customer feedback and reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaComments className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600">Total Feedbacks</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{feedbacks.filter(f => f.rating >= 4).length}</h3>
            <p className="text-gray-600">Good Feedback</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStar className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{feedbacks.filter(f => f.rating < 4).length}</h3>
            <p className="text-gray-600">Bad Feedback</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</h3>
            <p className="text-gray-600">Avg Rating</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search feedbacks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-4 pr-12 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="input w-full sm:w-40"
              >
                <option value="all">All Feedback</option>
                <option value="good">Good Feedback (4-5★)</option>
                <option value="bad">Bad Feedback (1-3★)</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="btn-outline flex items-center space-x-2"
              >
                <FaDownload className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              {selectedFeedbacks.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaFilter className="w-4 h-4" />
                  <span>Bulk Actions ({selectedFeedbacks.length})</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  Actions for {selectedFeedbacks.length} selected feedback(s):
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBulkAction('hide')}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedbacks List */}
        {loading ? (
          <div className="text-center py-12">
            <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading feedbacks...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <FaComments className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedbacks found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Select All */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedFeedbacks.length === filteredFeedbacks.length && filteredFeedbacks.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Select all ({filteredFeedbacks.length} feedbacks)
              </span>
            </div>
            
            {/* Good Feedback Section */}
            {filteredFeedbacks.filter(f => f.rating >= 4).length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-green-700 flex items-center mb-4">
                  <FaStar className="mr-2 text-green-600" />
                  Good Feedback ({filteredFeedbacks.filter(f => f.rating >= 4).length})
                </h3>
                {filteredFeedbacks.filter(f => f.rating >= 4).map((feedback) => (
                  <div key={feedback._id} className={`relative mb-4 ${!feedback.technician ? 'border-l-4 border-orange-400 bg-orange-50' : 'border border-green-200 bg-green-50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedFeedbacks.includes(feedback._id)}
                      onChange={() => handleFeedbackSelect(feedback._id)}
                      className="absolute top-4 left-4 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="ml-8">
                      {!feedback.technician && (
                        <div className="mb-2 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                          ⚠️ This feedback needs to be assigned to a technician
                        </div>
                      )}
                      <FeedbackDisplay
                        feedback={feedback}
                        onHelpful={() => {}}
                        onReport={() => {}}
                        showActions={false}
                      />
                      
                      {/* Admin Actions */}
                      <div className="mt-4 flex items-center space-x-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setShowReplyModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center space-x-1"
                        >
                          <FaReply className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(feedback._id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center space-x-1"
                        >
                          <FaTrash className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bad Feedback Section */}
            {filteredFeedbacks.filter(f => f.rating < 4).length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-red-700 flex items-center mb-4">
                  <FaStar className="mr-2 text-red-600" />
                  Bad Feedback ({filteredFeedbacks.filter(f => f.rating < 4).length})
                </h3>
                {filteredFeedbacks.filter(f => f.rating < 4).map((feedback) => (
                  <div key={feedback._id} className={`relative mb-4 ${!feedback.technician ? 'border-l-4 border-orange-400 bg-orange-50' : 'border border-red-200 bg-red-50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedFeedbacks.includes(feedback._id)}
                      onChange={() => handleFeedbackSelect(feedback._id)}
                      className="absolute top-4 left-4 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="ml-8">
                      {!feedback.technician && (
                        <div className="mb-2 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                          ⚠️ This feedback needs to be assigned to a technician
                        </div>
                      )}
                      <FeedbackDisplay
                        feedback={feedback}
                        onHelpful={() => {}}
                        onReport={() => {}}
                        showActions={false}
                      />
                      
                      {/* Admin Actions */}
                      <div className="mt-4 flex items-center space-x-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setShowReplyModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center space-x-1"
                        >
                          <FaReply className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(feedback._id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center space-x-1"
                        >
                          <FaTrash className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reply Modal */}
        {showReplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to Feedback</h3>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="input w-full mb-4"
                rows="4"
                placeholder="Enter your reply..."
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedFeedback(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="btn-primary"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign to Technician Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Feedback to Technician</h3>
              
              {selectedFeedback && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 mb-1">Feedback Details:</p>
                  <p className="font-medium">Service: {selectedFeedback.service?.name}</p>
                  <p className="text-sm">Rating: {selectedFeedback.rating}/5</p>
                  <p className="text-sm">From: {selectedFeedback.houseOwner?.username}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Technician
                </label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a technician...</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.username} {tech.firstName && tech.lastName && `(${tech.firstName} ${tech.lastName})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedFeedback(null);
                    setSelectedTechnician('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTechnician}
                  className="btn-primary"
                >
                  Assign to Technician
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FeedbackManagement;








