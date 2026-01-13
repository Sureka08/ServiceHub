import React, { useState, useEffect } from 'react';
import { FaEye, FaCheckCircle, FaStar } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedbackTestHelper = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const markBookingComplete = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, {
        status: 'completed',
        completionNotes: 'Test completion'
      });
      toast.success('Booking marked as completed');
      fetchAllBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  if (loading) {
    return <div className="p-4">Loading bookings...</div>;
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔧 Feedback System Test Helper
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        This helper shows all bookings and allows you to test the feedback system.
      </p>
      
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking._id} className="p-3 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium">{booking.service?.name || 'Service'}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                  {booking.feedback && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Has Feedback
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Customer: {booking.houseOwner?.username || 'N/A'} | 
                  Technician: {booking.technician?.username || 'N/A'} | 
                  Date: {new Date(booking.scheduledDate).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {booking.status !== 'completed' && (
                  <button
                    onClick={() => markBookingComplete(booking._id)}
                    className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <FaCheckCircle className="w-3 h-3 mr-1" />
                    Mark Complete
                  </button>
                )}
                
                {booking.status === 'completed' && !booking.feedback && (
                  <span className="flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    <FaStar className="w-3 h-3 mr-1" />
                    Ready for Feedback
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {bookings.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No bookings found. Create a booking first to test the feedback system.
        </div>
      )}
    </div>
  );
};

export default FeedbackTestHelper;
