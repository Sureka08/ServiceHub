import React, { useState, useEffect } from 'react';
import { FaTools, FaClipboardList, FaClock, FaStar, FaBox, FaCheckCircle, FaPlay, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaSpinner, FaComments } from 'react-icons/fa';
import BackButton from '../../components/BackButton';
import InventoryViewer from '../../components/InventoryViewer';
import axios from 'axios';
import toast from 'react-hot-toast';

const TechnicianDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setFeedbackLoading(true);
      console.log('Fetching feedbacks for technician...');
      const response = await axios.get('/api/feedback/technician');
      console.log('Feedback response:', response.data);
      setFeedbacks(response.data.feedbacks || []);
      
      if (response.data.feedbacks && response.data.feedbacks.length > 0) {
        toast.success(`Loaded ${response.data.feedbacks.length} feedback(s)`);
      } else {
        toast.info('No feedbacks assigned to you yet');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks: ' + (error.response?.data?.message || error.message));
    } finally {
      setFeedbackLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus, completionNotes = '') => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, {
        status: newStatus,
        completionNotes
      });
      toast.success(`Booking ${newStatus.replace('_', ' ')} successfully`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'feedback') {
      fetchFeedbacks();
    }
  };

  const handleReplyFeedback = async (feedbackId) => {
    try {
      const replyText = prompt('Enter your reply to this feedback:');
      if (replyText && replyText.trim()) {
        await axios.post(`/api/feedback/${feedbackId}/reply`, {
          reply: replyText.trim()
        });
        toast.success('Reply sent successfully');
        fetchFeedbacks(); // Refresh feedbacks
      }
    } catch (error) {
      console.error('Error replying to feedback:', error);
      toast.error('Failed to send reply: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.');
      if (confirmed) {
        await axios.delete(`/api/feedback/${feedbackId}`);
        toast.success('Feedback deleted successfully');
        fetchFeedbacks(); // Refresh feedbacks
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <BackButton fallbackPath="/dashboard" />
        </div>
      </div>
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Technician Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage your assigned tasks and service requests
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('bookings')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'bookings'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            My Bookings
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'inventory'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaBox className="inline mr-2" />
            Materials
          </button>
          <button
            onClick={() => handleTabChange('feedback')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'feedback'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaComments className="inline mr-2" />
            My Feedback
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="card text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTools className="text-4xl text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Technician Panel
            </h2>
            <p className="text-gray-600 mb-6">
              Manage your assigned tasks and service requests efficiently
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button 
                onClick={() => handleTabChange('bookings')}
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors w-full"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClipboardList className="text-2xl text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Tasks</h3>
                <p className="text-sm text-gray-600">See assigned service requests</p>
              </button>
              
              <button 
                onClick={() => handleTabChange('bookings')}
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors w-full"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaTools className="text-2xl text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Perform Service</h3>
                <p className="text-sm text-gray-600">Execute assigned tasks</p>
              </button>

              <button 
                onClick={() => handleTabChange('bookings')}
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors w-full"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClock className="text-2xl text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Update Status</h3>
                <p className="text-sm text-gray-600">Track task progress</p>
              </button>

              <button 
                onClick={() => handleTabChange('feedback')}
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors w-full"
              >
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaStar className="text-2xl text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Feedback</h3>
                <p className="text-sm text-gray-600">See customer reviews</p>
              </button>
            </div>

            <p className="text-gray-500">
              Use the tabs above to navigate to different sections
            </p>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">My Assigned Bookings</h3>
              <button
                onClick={fetchBookings}
                className="btn-outline flex items-center"
              >
                <FaSpinner className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Assigned</h3>
                <p className="text-gray-600">You don't have any assigned bookings yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div key={booking._id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {booking.service?.name || 'Service'}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <FaUser className="w-4 h-4 mr-2" />
                            <span>Customer: {booking.houseOwner?.username || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaCalendarAlt className="w-4 h-4 mr-2" />
                            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaClock className="w-4 h-4 mr-2" />
                            <span>{booking.scheduledTime}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                            <span>{booking.address}</span>
                          </div>
                        </div>

                        {booking.description && (
                          <p className="text-sm text-gray-700 mb-4">
                            <strong>Description:</strong> {booking.description}
                          </p>
                        )}

                        {booking.completionNotes && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <p className="text-sm text-green-800">
                              <strong>Completion Notes:</strong> {booking.completionNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        {booking.status === 'accepted' && (
                          <button
                            onClick={() => updateBookingStatus(booking._id, 'in_progress')}
                            className="flex items-center px-3 py-2 text-sm rounded-md text-blue-600 hover:bg-blue-50"
                          >
                            <FaPlay className="w-4 h-4 mr-1" />
                            Start Work
                          </button>
                        )}
                        
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => {
                              const notes = prompt('Add completion notes (optional):');
                              updateBookingStatus(booking._id, 'completed', notes || '');
                            }}
                            className="flex items-center px-3 py-2 text-sm rounded-md text-green-600 hover:bg-green-50"
                          >
                            <FaCheckCircle className="w-4 h-4 mr-1" />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryViewer userRole="technician" />
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaComments className="mr-3 text-blue-600" />
                  Feedback
                </h2>
                <button
                  onClick={fetchFeedbacks}
                  disabled={feedbackLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {feedbackLoading ? (
                    <FaSpinner className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FaComments className="w-4 h-4 mr-2" />
                  )}
                  View All Feedback
                </button>
              </div>
              
              {feedbackLoading ? (
                <div className="text-center py-8">
                  <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading feedback...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <FaComments className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Assigned</h3>
                  <p className="text-gray-600">You haven't been assigned any feedback yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Feedback Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Feedback Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{feedbacks.length}</div>
                        <div className="text-sm text-blue-700">Total Feedbacks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {feedbacks.filter(f => f.rating >= 4).length}
                        </div>
                        <div className="text-sm text-green-700">Good Feedback</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {feedbacks.filter(f => f.rating < 4).length}
                        </div>
                        <div className="text-sm text-red-700">Bad Feedback</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {feedbacks.filter(f => f.status === 'pending').length}
                        </div>
                        <div className="text-sm text-yellow-700">Pending</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-lg font-semibold text-blue-800">
                        Average Rating: {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}/5
                      </div>
                    </div>
                  </div>
                  {/* Good Feedback Section */}
                  {feedbacks.filter(f => f.rating >= 4).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-green-700 flex items-center">
                        <FaStar className="mr-2 text-green-600" />
                        Good Feedback ({feedbacks.filter(f => f.rating >= 4).length})
                      </h3>
                      {feedbacks.filter(f => f.rating >= 4).map((feedback) => (
                        <div key={feedback._id} className="border border-green-200 rounded-lg p-6 bg-green-50">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {feedback.service?.name || 'Service'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                From: {feedback.houseOwner?.username || 'Anonymous'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(feedback.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < feedback.rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                {feedback.rating}/5
                              </span>
                            </div>
                          </div>
                          
                          {feedback.comment && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Comment:</h4>
                              <p className="text-gray-700 bg-white p-3 rounded border">
                                {feedback.comment}
                              </p>
                            </div>
                          )}

                          {feedback.categories && feedback.categories.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Category Ratings:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {feedback.categories.map((category, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 capitalize">
                                      {category.category.replace('_', ' ')}:
                                    </span>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <FaStar
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < category.rating
                                              ? 'text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-green-200">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm text-gray-500">
                                Assigned: {new Date(feedback.updatedAt).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleReplyFeedback(feedback._id)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                                >
                                  <FaComments className="w-3 h-3 mr-1" />
                                  Reply
                                </button>
                                <button
                                  onClick={() => handleDeleteFeedback(feedback._id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                                >
                                  <FaCheckCircle className="w-3 h-3 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bad Feedback Section */}
                  {feedbacks.filter(f => f.rating < 4).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-red-700 flex items-center">
                        <FaStar className="mr-2 text-red-600" />
                        Bad Feedback ({feedbacks.filter(f => f.rating < 4).length})
                      </h3>
                      {feedbacks.filter(f => f.rating < 4).map((feedback) => (
                        <div key={feedback._id} className="border border-red-200 rounded-lg p-6 bg-red-50">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {feedback.service?.name || 'Service'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                From: {feedback.houseOwner?.username || 'Anonymous'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(feedback.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i < feedback.rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                {feedback.rating}/5
                              </span>
                            </div>
                          </div>
                          
                          {feedback.comment && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Comment:</h4>
                              <p className="text-gray-700 bg-white p-3 rounded border">
                                {feedback.comment}
                              </p>
                            </div>
                          )}

                          {feedback.categories && feedback.categories.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Category Ratings:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {feedback.categories.map((category, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 capitalize">
                                      {category.category.replace('_', ' ')}:
                                    </span>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <FaStar
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < category.rating
                                              ? 'text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-red-200">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm text-gray-500">
                                Assigned: {new Date(feedback.updatedAt).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleReplyFeedback(feedback._id)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                                >
                                  <FaComments className="w-3 h-3 mr-1" />
                                  Reply
                                </button>
                                <button
                                  onClick={() => handleDeleteFeedback(feedback._id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                                >
                                  <FaCheckCircle className="w-3 h-3 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
