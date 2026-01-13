import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaCheckCircle, 
  FaClock, 
  FaUser, 
  FaCalendarAlt,
  FaSpinner,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const CashPaymentManager = () => {
  const [cashPayments, setCashPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, paid, all
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCashPayments();
  }, [filter]);

  const fetchCashPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/payments/cash-payments?status=${filter}`);
      setCashPayments(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching cash payments:', error);
      toast.error('Failed to load cash payments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !collectedAmount) {
      toast.error('Please enter the collected amount');
      return;
    }

    try {
      setConfirming(true);
      const response = await axios.post('/api/payments/confirm-cash-payment', {
        bookingId: selectedPayment._id,
        collectedAmount: parseFloat(collectedAmount),
        notes: notes
      });

      if (response.data.success) {
        toast.success('Cash payment confirmed successfully!');
        setShowConfirmModal(false);
        setSelectedPayment(null);
        setCollectedAmount('');
        setNotes('');
        fetchCashPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const openConfirmModal = (payment) => {
    setSelectedPayment(payment);
    setCollectedAmount(payment.estimatedCost.toString());
    setShowConfirmModal(true);
  };

  const filteredPayments = cashPayments.filter(payment => {
    const matchesSearch = payment.houseOwner?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'paid': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="w-4 h-4" />;
      case 'paid': return <FaCheckCircle className="w-4 h-4" />;
      default: return <FaMoneyBillWave className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading cash payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaMoneyBillWave className="mr-3 text-green-600" />
            Cash Payment Management
          </h2>
          <p className="text-gray-600 mt-1">Manage cash payments and collections</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <p className="text-sm text-green-600">Total Pending</p>
            <p className="text-lg font-semibold text-green-800">
              LKR {cashPayments.reduce((sum, p) => sum + (p.estimatedCost || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, service, or booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          {['pending', 'paid', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cash Payments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.houseOwner?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.houseOwner?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.service?.name || 'Unknown Service'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.service?.category || 'No category'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      LKR {payment.estimatedCost?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(payment.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.scheduledTime}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.paymentStatus)}`}>
                      {getStatusIcon(payment.paymentStatus)}
                      <span className="ml-1 capitalize">{payment.paymentStatus}</span>
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {payment.paymentStatus === 'pending' && (
                      <button
                        onClick={() => openConfirmModal(payment)}
                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        Confirm Payment
                      </button>
                    )}
                    {payment.paymentStatus === 'paid' && (
                      <span className="text-green-600 text-sm">
                        Collected on {new Date(payment.paymentCompletedAt).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <FaMoneyBillWave className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cash payments found</h3>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'No pending cash payments at the moment.'
                : 'No cash payments match your current filter.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Confirm Payment Modal */}
      {showConfirmModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Cash Payment
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <p className="text-sm text-gray-900">{selectedPayment.houseOwner?.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <p className="text-sm text-gray-900">{selectedPayment.service?.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Amount
                </label>
                <p className="text-sm text-gray-900">LKR {selectedPayment.estimatedCost?.toFixed(2)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collected Amount *
                </label>
                <input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter collected amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add any notes about the payment..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={confirming || !collectedAmount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {confirming && <FaSpinner className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashPaymentManager;














