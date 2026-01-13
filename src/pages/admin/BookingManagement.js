import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaUser, 
  FaTools, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaBox,
  FaDollarSign
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import MaterialUsage from '../../components/MaterialUsage';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [bookingTechnicians, setBookingTechnicians] = useState({});

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  // Load available technicians for all pending bookings
  useEffect(() => {
    if (bookings.length > 0) {
      bookings.forEach(booking => {
        if (!booking.technician && !bookingTechnicians[booking._id]) {
          fetchAvailableTechnicians(booking);
        }
      });
    }
  }, [bookings]);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings/admin/pending');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      toast.error('Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTechnicians = async (booking) => {
    try {
      setLoadingTechnicians(true);
      const response = await axios.get('/api/bookings/technicians/available', {
        params: {
          date: booking.scheduledDate,
          time: booking.scheduledTime
        }
      });
      setAvailableTechnicians(response.data.technicians);
      
      // Store technicians for this booking for quick access
      setBookingTechnicians(prev => ({
        ...prev,
        [booking._id]: response.data.technicians
      }));
    } catch (error) {
      console.error('Error fetching available technicians:', error);
      toast.error('Failed to load available technicians');
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleAssignTechnician = async (booking, technicianId) => {
    try {
      setAssigning(true);
      await axios.put(`/api/bookings/${booking._id}/assign-technician`, {
        technicianId
      });
      
      toast.success('Technician assigned successfully!');
      setShowTechnicianModal(false);
      setSelectedBooking(null);
      setSelectedTechnicianId('');
      fetchPendingBookings(); // Refresh the list
    } catch (error) {
      console.error('Error assigning technician:', error);
      const message = error.response?.data?.message || 'Failed to assign technician';
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleQuickAssign = async (booking) => {
    if (!selectedTechnicianId) {
      toast.error('Please select a technician first');
      return;
    }
    await handleAssignTechnician(booking, selectedTechnicianId);
  };

  const handleAcceptBooking = async (booking) => {
    try {
      await axios.put(`/api/bookings/${booking._id}/status`, {
        status: 'accepted'
      });
      
      toast.success('Booking accepted successfully!');
      fetchPendingBookings(); // Refresh the list
    } catch (error) {
      console.error('Error accepting booking:', error);
      const message = error.response?.data?.message || 'Failed to accept booking';
      toast.error(message);
    }
  };

  const handleRejectBooking = async (booking) => {
    try {
      await axios.put(`/api/bookings/${booking._id}/status`, {
        status: 'rejected'
      });
      
      toast.success('Booking rejected');
      fetchPendingBookings(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting booking:', error);
      const message = error.response?.data?.message || 'Failed to reject booking';
      toast.error(message);
    }
  };

  const openTechnicianModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedTechnicianId('');
    setShowTechnicianModal(true);
    fetchAvailableTechnicians(booking);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return <FaExclamationTriangle className="text-red-500" />;
      case 'medium': return <FaExclamationTriangle className="text-orange-500" />;
      default: return <FaCheckCircle className="text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mr-3" />
        <span className="text-gray-600">Loading pending bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaClipboardList className="mr-3 text-primary-600" />
            Pending Bookings
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and assign technicians to service bookings
          </p>
        </div>
        <button
          onClick={fetchPendingBookings}
          className="btn-outline flex items-center"
        >
          <FaSpinner className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="card text-center py-12">
          <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending bookings</h3>
          <p className="text-gray-600">All bookings have been processed</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {booking.service.name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {booking.service.category}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(booking.urgency)}`}>
                      <div className="flex items-center">
                        {getUrgencyIcon(booking.urgency)}
                        <span className="ml-1 capitalize">{booking.urgency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaUser className="mr-2 text-primary-600" />
                        <span className="font-medium">{booking.houseOwner.username}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaEnvelope className="mr-2 text-primary-600" />
                        <span>{booking.houseOwner.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaPhone className="mr-2 text-primary-600" />
                        <span>{booking.houseOwner.mobile}</span>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendarAlt className="mr-2 text-primary-600" />
                        <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="mr-2 text-primary-600" />
                        <span>{booking.scheduledTime}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaDollarSign className="mr-2 text-primary-600" />
                        <span className="font-semibold">LKR {booking.estimatedCost}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start text-sm text-gray-600 mb-4">
                    <FaMapMarkerAlt className="mr-2 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>{booking.address}</span>
                  </div>

                {/* Selected Materials and Technician */}
                <div className="mb-4">
                  <MaterialUsage booking={booking} />
                </div>

                  {/* Description */}
                  {booking.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {booking.description}
                      </p>
                    </div>
                  )}

                  {/* Assigned Technician */}
                  {booking.technician ? (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-sm text-green-800">
                        <FaUserTie className="mr-2" />
                        <span className="font-medium">Assigned Technician:</span>
                      </div>
                      <div className="mt-1 ml-6">
                        <p className="font-medium text-green-900">{booking.technician.username}</p>
                        <p className="text-green-700">{booking.technician.email}</p>
                        <p className="text-green-700">{booking.technician.mobile}</p>
                        {booking.technician.rating && (
                          <div className="flex items-center mt-1">
                            <FaStar className="text-yellow-400 mr-1" />
                            <span className="text-green-700">{booking.technician.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm text-yellow-800 mb-3">
                        <div className="flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          <span className="font-medium">No technician assigned</span>
                        </div>
                        <button
                          onClick={() => openTechnicianModal(booking)}
                          className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded transition-colors"
                        >
                          Select Technician
                        </button>
                      </div>
                      {booking.selectedInventory && booking.selectedInventory.length > 0 && (
                        <div className="text-xs text-yellow-900 ml-0">
                          The assigned technician will bring the listed materials.
                        </div>
                      )}
                      
                      {/* Quick Technician Selection */}
                      {bookingTechnicians[booking._id] && bookingTechnicians[booking._id].length > 0 && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-yellow-800 mb-1">
                            Quick Assign:
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={selectedTechnicianId}
                              onChange={(e) => setSelectedTechnicianId(e.target.value)}
                              className="flex-1 text-xs p-2 border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                            >
                              <option value="">Choose technician...</option>
                              {bookingTechnicians[booking._id].map((technician) => (
                                <option key={technician._id} value={technician._id}>
                                  {technician.username} {technician.rating ? `(${technician.rating.toFixed(1)}⭐)` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleQuickAssign(booking)}
                              disabled={!selectedTechnicianId || assigning}
                              className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded transition-colors"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 lg:ml-6">
                  {!booking.technician ? (
                    <button
                      onClick={() => openTechnicianModal(booking)}
                      className="btn-primary flex items-center justify-center"
                    >
                      <FaUserTie className="mr-2" />
                      Assign Technician
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAcceptBooking(booking)}
                      className="btn-primary flex items-center justify-center"
                    >
                      <FaCheckCircle className="mr-2" />
                      Accept Booking
                    </button>
                  )}
                  
                  <button
                    onClick={() => openTechnicianModal(booking)}
                    className="btn-outline flex items-center justify-center"
                  >
                    <FaUserTie className="mr-2" />
                    {booking.technician ? 'Reassign' : 'Assign'} Technician
                  </button>
                  
                  <button
                    onClick={() => handleRejectBooking(booking)}
                    className="btn-danger flex items-center justify-center"
                  >
                    <FaTimes className="mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technician Assignment Modal */}
      {showTechnicianModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Assign Technician
                </h3>
                <button
                  onClick={() => setShowTechnicianModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Booking Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
                <p className="text-sm text-gray-600">
                  <strong>Service:</strong> {selectedBooking.service.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {new Date(selectedBooking.scheduledDate).toLocaleDateString()} at {selectedBooking.scheduledTime}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Customer:</strong> {selectedBooking.houseOwner.username}
                </p>
              </div>

              {/* Available Technicians */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Available Technicians</h4>
                
                {loadingTechnicians ? (
                  <div className="flex items-center justify-center py-8">
                    <FaSpinner className="w-6 h-6 text-primary-600 animate-spin mr-3" />
                    <span className="text-gray-600">Loading technicians...</span>
                  </div>
                ) : availableTechnicians.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUserTie className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No technicians available for this time slot</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Quick Selection Dropdown */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Select Technician:
                      </label>
                      <select
                        value={selectedTechnicianId}
                        onChange={(e) => setSelectedTechnicianId(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select a technician...</option>
                        {availableTechnicians.map((technician) => (
                          <option key={technician._id} value={technician._id}>
                            {technician.username} - {technician.email} {technician.rating ? `(${technician.rating.toFixed(1)}⭐)` : ''}
                          </option>
                        ))}
                      </select>
                      {selectedTechnicianId && (
                        <button
                          onClick={() => handleQuickAssign(selectedBooking)}
                          disabled={assigning}
                          className="mt-3 w-full btn-primary flex items-center justify-center"
                        >
                          {assigning ? (
                            <FaSpinner className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <FaUserTie className="w-4 h-4 mr-2" />
                          )}
                          Assign Selected Technician
                        </button>
                      )}
                    </div>

                    {/* Detailed Technician Cards */}
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Or select from detailed view:</h5>
                      <div className="space-y-3">
                        {availableTechnicians.map((technician) => (
                          <div
                            key={technician._id}
                            className={`border rounded-lg p-4 transition-colors ${
                              selectedTechnicianId === technician._id 
                                ? 'border-primary-500 bg-primary-50' 
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <h5 className="font-medium text-gray-900 mr-3">{technician.username}</h5>
                                  {technician.rating && (
                                    <div className="flex items-center">
                                      <FaStar className="text-yellow-400 mr-1" />
                                      <span className="text-sm text-gray-600">{technician.rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <FaEnvelope className="mr-2" />
                                  <span className="mr-4">{technician.email}</span>
                                  <FaPhone className="mr-2" />
                                  <span>{technician.mobile}</span>
                                </div>
                                {technician.specialties && technician.specialties.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {technician.specialties.map((specialty, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                                      >
                                        {specialty}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleAssignTechnician(selectedBooking, technician._id)}
                                disabled={assigning}
                                className="btn-primary ml-4 flex items-center"
                              >
                                {assigning ? (
                                  <FaSpinner className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Assign'
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
