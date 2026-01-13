import React, { useState, useEffect } from 'react';
import { FaUserTie, FaClipboardList, FaTools, FaStar, FaBox, FaUsers, FaChartBar, FaComments, FaCheckCircle, FaClock, FaBell, FaMoneyBillWave } from 'react-icons/fa';
import BackButton from '../../components/BackButton';
import InventoryManagement from './InventoryManagement';
import FeedbackManagement from './FeedbackManagement';
import AnnouncementManagement from './AnnouncementManagement';
import BookingManagement from './BookingManagement';
import Materials from './Materials';
import UserManagement from './UserManagement';
import CashPaymentManager from '../../components/CashPaymentManager';
import FeedbackTestHelper from '../../components/FeedbackTestHelper';
import axios from 'axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    try {
      const response = await axios.get('/api/feedback/stats');
      setFeedbackStats(response.data.stats || feedbackStats);
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage your service booking platform
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
            Bookings
          </button>
          <button
            onClick={() => handleTabChange('materials')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'materials'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaBox className="inline mr-2" />
            Materials
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
            Inventory
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaUsers className="inline mr-2" />
            Users
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
            Feedback
          </button>
          <button
            onClick={() => handleTabChange('announcements')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'announcements'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaBell className="inline mr-2" />
            Announcements
          </button>
          <button
            onClick={() => handleTabChange('cash-payments')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'cash-payments'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaMoneyBillWave className="inline mr-2" />
            Cash Payments
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'analytics'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Welcome Section */}
            <div className="card text-center mb-8">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUserTie className="text-4xl text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Admin Panel
              </h2>
              <p className="text-gray-600 mb-6">
                Manage your service booking platform efficiently
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaComments className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{feedbackStats.total}</h3>
                <p className="text-gray-600">Total Feedback</p>
              </div>
              
              <div className="card text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClock className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{feedbackStats.pending}</h3>
                <p className="text-gray-600">Pending Review</p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{feedbackStats.approved}</h3>
                <p className="text-gray-600">Approved</p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaStar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{feedbackStats.averageRating.toFixed(1)}</h3>
                <p className="text-gray-600">Avg Rating</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaUserTie className="text-2xl text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manage Users</h3>
                <p className="text-sm text-gray-600">Control user accounts and roles</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClipboardList className="text-2xl text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Bookings</h3>
                <p className="text-sm text-gray-600">Monitor all service requests</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaTools className="text-2xl text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manage Services</h3>
                <p className="text-sm text-gray-600">Add and edit service offerings</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaComments className="text-2xl text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Review Feedback</h3>
                <p className="text-sm text-gray-600">Monitor customer satisfaction</p>
              </div>
            </div>
            
            {/* Test Helper - Remove in production */}
            <FeedbackTestHelper />
          </div>
        )}

        {activeTab === 'bookings' && (
          <BookingManagement />
        )}

        {activeTab === 'materials' && (
          <Materials />
        )}

        {activeTab === 'inventory' && (
          <InventoryManagement />
        )}

        {activeTab === 'feedback' && (
          <FeedbackManagement />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementManagement />
        )}

        {activeTab === 'cash-payments' && (
          <CashPaymentManager />
        )}

        {activeTab === 'users' && (
          <UserManagement />
        )}

        {activeTab === 'analytics' && (
          <div className="card text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaChartBar className="text-4xl text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600">
              Analytics and reporting features coming soon...
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
