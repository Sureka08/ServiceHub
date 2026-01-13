import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import { 
  FaClipboardList, 
  FaClock, 
  FaCheckCircle, 
  FaTimes,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaDollarSign,
  FaExclamationTriangle,
  FaSpinner,
  FaEye,
  FaSave,
  FaTimes as FaClose,
  FaPlus,
  FaSearch,
  FaFilter,
  FaCreditCard,
  FaUniversity,
  FaMoneyBillWave,
  FaStar,
  FaComments
} from 'react-icons/fa';
import FeedbackForm from '../components/FeedbackForm';
import QuickFeedbackWidget from '../components/QuickFeedbackWidget';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState(null);
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);
  const [selectedBookingForQuickFeedback, setSelectedBookingForQuickFeedback] = useState(null);
  const [editFormData, setEditFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    address: '',
    description: '',
    urgency: 'normal'
  });

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

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setEditFormData({
      scheduledDate: new Date(booking.scheduledDate).toISOString().split('T')[0],
      scheduledTime: booking.scheduledTime,
      address: booking.address,
      description: booking.description || '',
      urgency: booking.urgency
    });
    setShowEditForm(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/bookings/${editingBooking._id}`, editFormData);
      toast.success('Booking updated successfully');
      setShowEditForm(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await axios.post('/api/feedback', feedbackData);
      setShowFeedbackForm(false);
      setSelectedBookingForFeedback(null);
      fetchBookings();
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const handleGiveFeedback = (booking) => {
    setSelectedBookingForFeedback(booking);
    setShowFeedbackForm(true);
  };

  const handleQuickFeedback = (booking) => {
    setSelectedBookingForQuickFeedback(booking);
    setShowQuickFeedback(true);
  };

  const handleQuickFeedbackSubmitted = (feedback) => {
    setShowQuickFeedback(false);
    setSelectedBookingForQuickFeedback(null);
    fetchBookings();
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card': return <FaCreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <FaUniversity className="w-4 h-4" />;
      case 'cash': return <FaMoneyBillWave className="w-4 h-4" />;
      default: return <FaDollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'credit_card': return 'Credit/Debit Card';
      case 'bank_transfer': return 'Bank Transfer';
      case 'cash': return 'Cash on Service';
      default: return 'Unknown';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'refunded': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyClasses = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      normal: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${urgencyClasses[urgency] || 'bg-green-100 text-green-800'}`}>
        {urgency}
      </span>
    );
  };

  const canEditBooking = (booking) => {
    return ['pending', 'accepted'].includes(booking.status);
  };

  const canCancelBooking = (booking) => {
    return ['pending', 'accepted'].includes(booking.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

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
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage and track all your service requests</p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="flex items-center text-sm text-gray-600">
              <FaClipboardList className="mr-2" />
              {getFilteredBookings().length} booking(s) found
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {getFilteredBookings().length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaClipboardList className="text-4xl text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {bookings.length === 0 ? 'No Bookings Yet' : 'No Bookings Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {bookings.length === 0 
                ? 'You haven\'t made any service bookings yet. Start by booking a service!'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {bookings.length === 0 && (
              <a href="/book-service" className="btn-primary">
                Book a Service
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredBookings().map((booking) => (
              <div key={booking._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                        <FaCalendarAlt className="text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.service?.name || 'Service'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-1 font-medium">
                          {new Date(booking.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaClock className="text-gray-400 mr-2" />
                        <span className="text-gray-600">Time:</span>
                        <span className="ml-1 font-medium">{booking.scheduledTime}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaDollarSign className="text-gray-400 mr-2" />
                        <span className="text-gray-600">Cost:</span>
                        <span className="ml-1 font-medium">LKR {booking.estimatedCost}</span>
                      </div>
                      {booking.paymentMethod && (
                        <div className="flex items-center text-sm">
                          {getPaymentMethodIcon(booking.paymentMethod)}
                          <span className="text-gray-600 ml-2">Payment:</span>
                          <span className="ml-1 font-medium">{getPaymentMethodName(booking.paymentMethod)}</span>
                        </div>
                      )}
                      {booking.paymentStatus && (
                        <div className="flex items-center text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            Payment: {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start text-sm mb-3">
                      <FaMapMarkerAlt className="text-gray-400 mr-2 mt-0.5" />
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-1">{booking.address}</span>
                    </div>

                    {booking.description && (
                      <div className="text-sm mb-3">
                        <span className="text-gray-600">Description:</span>
                        <p className="mt-1 text-gray-800">{booking.description}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(booking.status)}
                      {getUrgencyBadge(booking.urgency)}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleEditBooking(booking)}
                      disabled={!canEditBooking(booking)}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        canEditBooking(booking)
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={canEditBooking(booking) ? 'Edit Booking' : 'Cannot edit this booking'}
                    >
                      <FaEdit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={!canCancelBooking(booking)}
                      className={`flex items-center px-3 py-2 text-sm rounded-md ${
                        canCancelBooking(booking)
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={canCancelBooking(booking) ? 'Cancel Booking' : 'Cannot cancel this booking'}
                    >
                      <FaTrash className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGiveFeedback(booking)}
                        className="flex items-center px-3 py-2 text-sm rounded-md text-green-600 hover:bg-green-50"
                        title="Give Feedback"
                      >
                        <FaStar className="w-4 h-4 mr-1" />
                        Give Feedback
                      </button>
                      {booking.status === 'completed' && (
                        <button
                          onClick={() => handleQuickFeedback(booking)}
                          className="flex items-center px-3 py-2 text-sm rounded-md text-blue-600 hover:bg-blue-50"
                          title="Quick Feedback"
                        >
                          <FaComments className="w-4 h-4 mr-1" />
                          Quick
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Booking Modal */}
        {showEditForm && editingBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Booking</h2>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingBooking(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaClose className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateBooking} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label htmlFor="scheduledDate" className="form-label">
                        <FaCalendarAlt className="mr-2" />
                        Scheduled Date
                      </label>
                      <input
                        type="date"
                        id="scheduledDate"
                        name="scheduledDate"
                        value={editFormData.scheduledDate}
                        onChange={handleEditFormChange}
                        className="input"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="scheduledTime" className="form-label">
                        <FaClock className="mr-2" />
                        Scheduled Time
                      </label>
                      <select
                        id="scheduledTime"
                        name="scheduledTime"
                        value={editFormData.scheduledTime}
                        onChange={handleEditFormChange}
                        className="input"
                        required
                      >
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address" className="form-label">
                      <FaMapMarkerAlt className="mr-2" />
                      Service Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditFormChange}
                      className="input"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description" className="form-label">Service Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditFormChange}
                      className="input"
                      rows="3"
                      placeholder="Describe the service you need"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label htmlFor="urgency" className="form-label">
                        <FaExclamationTriangle className="mr-2" />
                        Urgency Level
                      </label>
                      <select
                        id="urgency"
                        name="urgency"
                        value={editFormData.urgency}
                        onChange={handleEditFormChange}
                        className="input"
                      >
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="high">High (Emergency)</option>
                      </select>
                    </div>

                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingBooking(null);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex items-center"
                    >
                      <FaSave className="w-4 h-4 mr-2" />
                      Update Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedBookingForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              booking={selectedBookingForFeedback}
              onSubmit={handleFeedbackSubmit}
              onCancel={() => {
                setShowFeedbackForm(false);
                setSelectedBookingForFeedback(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Feedback Widget */}
      {showQuickFeedback && selectedBookingForQuickFeedback && (
        <QuickFeedbackWidget
          booking={selectedBookingForQuickFeedback}
          onFeedbackSubmitted={handleQuickFeedbackSubmitted}
          onClose={() => {
            setShowQuickFeedback(false);
            setSelectedBookingForQuickFeedback(null);
          }}
        />
      )}
      </div>
    </div>
  );
};

export default MyBookings;
