import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaTools, 
  FaUsers, 
  FaCalendarAlt, 
  FaDollarSign,
  FaSpinner,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaFilter,
  FaSave,
  FaChartBar,
  FaTimes as FaClose,
  FaClock,
  FaClipboardList,
  FaMapMarkerAlt,
  FaBox,
  FaComments,
  FaStar,
  FaBell
} from 'react-icons/fa';
import InventoryViewer from '../components/InventoryViewer';
import FeedbackManagement from './admin/FeedbackManagement';
import AnnouncementManagement from './admin/AnnouncementManagement';
import FeedbackForm from '../components/FeedbackForm';
import Materials from './admin/Materials';

const Dashboard = () => {
  const { user, token } = useAuth();
  
  // Debug authentication
  console.log('Dashboard - User:', user);
  console.log('Dashboard - Token:', token);
  console.log('Dashboard - User authenticated:', !!user && !!token);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbacks, setFeedbacks] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState({});
  
  // Service management states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    category: '',
    description: '',
    basePrice: '',
    estimatedDuration: '2-4 hours',
    features: [],
    requirements: [],
    imageUrl: '',
    isActive: true
  });
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [selectedServices, setSelectedServices] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [assigningTechnician, setAssigningTechnician] = useState(null);
  
  // Feedback modal states
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState(null);
  
  // Profile management states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileFormData, setProfileFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    role: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  // Load available technicians for all pending bookings when bookings change
  useEffect(() => {
    console.log('useEffect triggered - bookings:', bookings.length, 'user role:', user?.role);
    if (bookings.length > 0 && user?.role === 'admin') {
      bookings.forEach(booking => {
        if (!booking.technician && !availableTechnicians[booking._id]) {
          console.log('Loading technicians for booking:', booking._id);
          loadAvailableTechnicians(booking);
        }
      });
    }
  }, [bookings, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch services
      const servicesResponse = await axios.get('/api/services');
      setServices(servicesResponse.data.services || []);
      
      // Fetch users (if admin)
      if (user?.role === 'admin') {
        try {
          const usersResponse = await axios.get('/api/users');
          setUsers(usersResponse.data.users || []);
        } catch (error) {
          console.log('Users not accessible');
        }
      }
      
      // Fetch bookings
      try {
        const bookingsResponse = await axios.get('/api/bookings');
        setBookings(bookingsResponse.data.bookings || []);
        
      } catch (error) {
        console.log('Bookings not accessible');
      }
      
      // Fetch feedbacks (if house owner or technician)
      if (user?.role === 'house_owner') {
        try {
          const feedbacksResponse = await axios.get('/api/feedback/user');
          setFeedbacks(feedbacksResponse.data.feedbacks || []);
        } catch (error) {
          console.log('Feedbacks not accessible');
        }
      } else if (user?.role === 'technician') {
        try {
          const feedbacksResponse = await axios.get('/api/feedback/technician');
          setFeedbacks(feedbacksResponse.data.feedbacks || []);
        } catch (error) {
          console.log('Technician feedbacks not accessible');
        }
      }


      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadge = (status, hasFeedback = false) => {
    return (
      <div className="flex items-center space-x-1">
        <span className={`status-${status} capitalize`}>{status.replace('_', ' ')}</span>
        {status === 'completed' && (
          <span className={`text-xs px-1 py-0.5 rounded ${
            hasFeedback 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {hasFeedback ? '✓' : '!'}
          </span>
        )}
      </div>
    );
  };

  const getUrgencyBadge = (urgency) => {
    return <span className={`urgency-${urgency} capitalize`}>{urgency}</span>;
  };


  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await axios.put(`/api/bookings/${bookingId}/status`, { status: newStatus });
      
      let successMessage = `Booking status updated to ${newStatus}`;
      
      // If booking was accepted and technician was assigned, show additional info
      if (newStatus === 'accepted' && response.data.booking?.technician) {
        successMessage += ' and technician auto-assigned';
      } else if (newStatus === 'accepted') {
        successMessage += ' (no available technician found - manual assignment needed)';
      }
      
      toast.success(successMessage);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating booking status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update booking status';
      toast.error(errorMessage);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/bookings/${bookingId}`);
      toast.success('Booking deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  const handleAssignTechnician = async (bookingId, technicianId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/assign-technician`, {
        technicianId: technicianId
      });
      toast.success('Technician assigned successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error(error.response?.data?.message || 'Failed to assign technician');
    }
  };



  const handleTechnicianSelect = async (bookingId, technicianId) => {
    if (technicianId) {
      await handleAssignTechnician(bookingId, technicianId);
    }
    setAssigningTechnician(null);
    setAvailableTechnicians([]);
  };

  const loadAvailableTechnicians = async (booking) => {
    try {
      console.log('Loading technicians for booking:', booking._id, booking.scheduledDate, booking.scheduledTime);
      const response = await axios.get('/api/bookings/technicians/available', {
        params: {
          date: booking.scheduledDate,
          time: booking.scheduledTime
        }
      });
      console.log('Available technicians response:', response.data.technicians);
      setAvailableTechnicians(prev => ({
        ...prev,
        [booking._id]: response.data.technicians
      }));
    } catch (error) {
      console.error('Error loading available technicians:', error);
      toast.error('Failed to load available technicians');
    }
  };

  const handleQuickTechnicianAssign = async (bookingId, technicianId) => {
    if (technicianId) {
      await handleAssignTechnician(bookingId, technicianId);
    }
  };

  // Feedback handlers
  const handleGiveFeedback = (booking) => {
    setSelectedBookingForFeedback(booking);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await axios.post('/api/feedback', feedbackData);
      setShowFeedbackForm(false);
      setSelectedBookingForFeedback(null);
      fetchDashboardData(); // Refresh data to show updated feedback
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  // Profile management handlers
  const handleViewProfile = (userItem) => {
    setSelectedUser(userItem);
    setProfileFormData({
      username: userItem.username,
      email: userItem.email,
      mobile: userItem.mobile,
      role: userItem.role
    });
    setIsEditingProfile(false);
    setShowProfileModal(true);
  };

  const handleEditProfile = (userItem) => {
    setSelectedUser(userItem);
    setProfileFormData({
      username: userItem.username,
      email: userItem.email,
      mobile: userItem.mobile,
      role: userItem.role
    });
    setIsEditingProfile(true);
    setShowProfileModal(true);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/users/profile`, profileFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Profile updated successfully!');
      setShowProfileModal(false);
      setSelectedUser(null);
      setIsEditingProfile(false);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Service management functions
  const resetServiceForm = () => {
    setServiceFormData({
      name: '',
      category: '',
      description: '',
      basePrice: '',
      estimatedDuration: '2-4 hours',
      features: [],
      requirements: [],
      imageUrl: '',
      isActive: true
    });
    setEditingService(null);
  };

  const handleServiceFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setServiceFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...serviceFormData,
        basePrice: parseFloat(serviceFormData.basePrice),
        features: serviceFormData.features.filter(f => f.trim() !== ''),
        requirements: serviceFormData.requirements.filter(r => r.trim() !== '')
      };

      if (editingService) {
        await axios.put(`/api/services/${editingService._id}`, serviceData);
        toast.success('Service updated successfully');
      } else {
        await axios.post('/api/services', serviceData);
        toast.success('Service created successfully');
      }

      setShowServiceForm(false);
      resetServiceForm();
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(error.response?.data?.message || 'Failed to save service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      basePrice: service.basePrice.toString(),
      estimatedDuration: service.estimatedDuration,
      features: service.features || [],
      requirements: service.requirements || [],
      imageUrl: service.imageUrl || '',
      isActive: service.isActive
    });
    setShowServiceForm(true);
  };


  const handleToggleServiceStatus = async (serviceId, currentStatus) => {
    if (currentStatus) {
      // If service is active, delete it when "disabling"
      if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
        return;
      }
      
      try {
        await axios.delete(`/api/services/${serviceId}`);
        toast.success('Service deleted successfully');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting service:', error);
        toast.error(error.response?.data?.message || 'Failed to delete service');
      }
    } else {
      // If service is inactive, this shouldn't happen since deleted services won't show
      toast.error('Service not found');
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAllServices = () => {
    const filteredServices = getFilteredServices();
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map(s => s._id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedServices.length === 0) {
      toast.error('Please select services first');
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedServices.length} service(s)? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      const promises = selectedServices.map(serviceId => {
        switch (action) {
          case 'delete':
            return axios.delete(`/api/services/${serviceId}`);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${action} completed for ${selectedServices.length} service(s)`);
      setSelectedServices([]);
      setShowBulkActions(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const getFilteredServices = () => {
    let filtered = [...services];

    if (serviceSearchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(serviceSearchTerm.toLowerCase())
      );
    }

    if (serviceCategoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === serviceCategoryFilter);
    }

    return filtered;
  };

  const addFeature = () => {
    setServiceFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    setServiceFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index, value) => {
    setServiceFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const addRequirement = () => {
    setServiceFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index) => {
    setServiceFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index, value) => {
    setServiceFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((requirement, i) => i === index ? value : requirement)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
    <div className="min-h-screen bg-gray-50">
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {user?.username || 'User'}!</p>
          </div>
          
        </div>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTools className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{services.length}</h3>
            <p className="text-gray-600">Total Services</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{users.length}</h3>
            <p className="text-gray-600">Total Users</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{bookings.length}</h3>
            <p className="text-gray-600">Total Bookings</p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaDollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              LKR {services.reduce((sum, service) => sum + (service.basePrice || 0), 0)}
            </h3>
            <p className="text-gray-600">Total Value</p>
          </div>
        </div>

        {/* Quick Stats for Admin */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-800">
                    {bookings.filter(b => b.status === 'pending').length}
                  </h3>
                  <p className="text-yellow-700">Pending Bookings</p>
                </div>
              </div>
            </div>

            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-800">
                    {bookings.filter(b => b.urgency === 'high' && b.status === 'pending').length}
                  </h3>
                  <p className="text-red-700">High Urgency</p>
                </div>
              </div>
            </div>

            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <FaCalendarAlt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-800">
                    {bookings.filter(b => {
                      const today = new Date();
                      const bookingDate = new Date(b.scheduledDate);
                      return bookingDate.toDateString() === today.toDateString();
                    }).length}
                  </h3>
                  <p className="text-blue-700">Today's Bookings</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>
            )}
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bookings
            </button>
            {user?.role === 'house_owner' && (
              <button
                onClick={() => setActiveTab('my-bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-bookings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Bookings
              </button>
            )}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBox className="inline mr-1" />
              Materials
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('materials-usage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'materials-usage'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaClipboardList className="inline mr-1" />
                Materials Usage
              </button>
            )}
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feedback'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaComments className="inline mr-1" />
              Feedback
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBell className="inline mr-1" />
                Announcements
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FaCalendarAlt className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.service?.name || 'Service'} - {booking.houseOwner?.username || 'Customer'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(booking.status, booking.feedback)}
                      {getUrgencyBadge(booking.urgency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              {/* Services Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">All Services</h3>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      resetServiceForm();
                      setShowServiceForm(true);
                    }}
                    className="btn-primary flex items-center"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add New Service
                  </button>
                )}
              </div>

              {/* Info Note */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <FaBox className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Service Management</h4>
                    <p className="text-sm text-blue-700">
                      Services can be deleted using the delete button. Deleted services are permanently removed from the system. 
                      To add them back, use the "Add New Service" button above.
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Filters */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
                <select
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All Categories</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrician">Electrician</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="painting">Painting</option>
                  <option value="gardening">Gardening</option>
                  <option value="appliance_repair">Appliance Repair</option>
                  <option value="other">Other</option>
                </select>
                {user?.role === 'admin' && selectedServices.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="btn-secondary flex items-center"
                    >
                      <FaFilter className="w-4 h-4 mr-2" />
                      Bulk Actions ({selectedServices.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Actions */}
              {showBulkActions && selectedServices.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedServices.length} service(s) selected
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="btn-danger text-sm"
                      >
                        <FaTrash className="w-3 h-3 mr-1" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Services Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {user?.role === 'admin' && (
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedServices.length === getFilteredServices().length && getFilteredServices().length > 0}
                            onChange={handleSelectAllServices}
                            className="rounded border-gray-300"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredServices().map((service) => (
                      <tr key={service._id} className={!service.isActive ? 'bg-gray-50' : ''}>
                        {user?.role === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service._id)}
                              onChange={() => handleServiceSelect(service._id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">{service.description}</div>
                            {service.features && service.features.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {service.features.slice(0, 2).map((feature, index) => (
                                  <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    {feature}
                                  </span>
                                ))}
                                {service.features.length > 2 && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    +{service.features.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                            {service.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          LKR {service.basePrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {service.estimatedDuration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditService(service)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View/Edit Service"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            {user?.role === 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleServiceStatus(service._id, service.isActive)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Service"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No Services Message */}
              {getFilteredServices().length === 0 && (
                <div className="text-center py-12">
                  <FaTools className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-600">
                    {serviceSearchTerm || serviceCategoryFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'No services available yet'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && user?.role === 'admin' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem) => (
                      <tr key={userItem._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userItem.username}</div>
                            <div className="text-sm text-gray-500">{userItem.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                            userItem.role === 'technician' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {userItem.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userItem.mobile}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            onClick={() => handleViewProfile(userItem)}
                            title="View Profile"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          {userItem._id === user?._id && (
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => handleEditProfile(userItem)}
                              title="Edit My Profile"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Bookings</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className={`
                        ${booking.status === 'pending' ? 'bg-yellow-50' : ''}
                        ${booking.urgency === 'high' ? 'border-l-4 border-red-500' : ''}
                      `}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.service?.name || 'Service'}
                            </div>
                            <div className="text-sm text-gray-500">
                              LKR {booking.estimatedCost || 0}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.houseOwner?.username || 'Customer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.houseOwner?.email || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.scheduledTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.technician ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {booking.technician.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.technician.email}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className="text-sm text-yellow-600 font-medium">Not assigned</span>
                              {user?.role === 'admin' && (
                                <div className="flex flex-col space-y-1">
                                  <select
                                    className="text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    onChange={(e) => handleQuickTechnicianAssign(booking._id, e.target.value)}
                                    defaultValue=""
                                  >
                                    <option value="">
                                      {availableTechnicians[booking._id] ? 
                                        'Select technician...' : 
                                        'Loading technicians...'
                                      }
                                    </option>
                                    {availableTechnicians[booking._id]?.map((tech) => {
                                      console.log('Rendering technician option:', tech.username, tech._id);
                                      return (
                                        <option key={tech._id} value={tech._id}>
                                          {tech.username} {tech.rating ? `(${tech.rating.toFixed(1)}⭐)` : ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    onClick={() => loadAvailableTechnicians(booking)}
                                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                                  >
                                    {availableTechnicians[booking._id] ? 
                                      `Reload (${availableTechnicians[booking._id].length} found)` : 
                                      'Load Technicians'
                                    }
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking.status, booking.feedback)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getUrgencyBadge(booking.urgency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            
                            {user?.role === 'admin' && (
                              <>
                                {booking.status === 'pending' && (
                                  <>
                                    <button 
                                      onClick={() => updateBookingStatus(booking._id, 'accepted')}
                                      className="text-green-600 hover:text-green-900"
                                      title="Accept Booking"
                                    >
                                      <FaCheckCircle className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => updateBookingStatus(booking._id, 'rejected')}
                                      className="text-red-600 hover:text-red-900"
                                      title="Reject Booking"
                                    >
                                      <FaTimes className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                
                                {['pending', 'accepted'].includes(booking.status) && (
                                  <button 
                                    onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                    className="text-orange-600 hover:text-orange-900"
                                    title="Cancel Booking"
                                  >
                                    <FaClock className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {booking.status === 'accepted' && (
                                  <button 
                                    onClick={() => updateBookingStatus(booking._id, 'in_progress')}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Start Service"
                                  >
                                    <FaClock className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {booking.status === 'in_progress' && (
                                  <button 
                                    onClick={() => updateBookingStatus(booking._id, 'completed')}
                                    className="text-green-600 hover:text-green-900"
                                    title="Complete Service"
                                  >
                                    <FaCheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                
                                {/* Note: Technician assignment is now automatic when admin accepts booking */}
                                
                                {/* Delete Booking Button - Available for all bookings */}
                                <button 
                                  onClick={() => handleDeleteBooking(booking._id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Booking"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Technician Assignment Modal */}
          {assigningTechnician && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Technician</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Available Technician:
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onChange={(e) => handleTechnicianSelect(assigningTechnician, e.target.value)}
                    >
                      <option value="">Choose a technician...</option>
                      {availableTechnicians[assigningTechnician]?.map((tech) => (
                        <option key={tech._id} value={tech._id}>
                          {tech.username} - {tech.specialties?.join(', ') || 'General'}
                        </option>
                      )) || []}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setAssigningTechnician(null);
                        setAvailableTechnicians([]);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-bookings' && user?.role === 'house_owner' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
                <button 
                  onClick={() => {
                    // Find any booking for feedback
                    const anyBooking = bookings.find(b => 
                      b.houseOwner?.username === user?.username
                    );
                    if (anyBooking) {
                      handleGiveFeedback(anyBooking);
                    } else {
                      toast.error('No services available for feedback');
                    }
                  }}
                  className="btn-primary text-sm"
                >
                  Give Feedback
                </button>
              </div>

              {bookings.filter(booking => booking.houseOwner?.username === user?.username).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaClipboardList className="text-4xl text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bookings Yet</h2>
                  <p className="text-gray-600 mb-6">You haven't made any service bookings yet.</p>
                  <a href="/book-service" className="btn-primary">
                    Book a Service
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings
                    .filter(booking => booking.houseOwner?.username === user?.username)
                    .slice(0, 5) // Show only first 5 bookings
                    .map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <FaCalendarAlt className="text-primary-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {booking.service?.name || 'Service'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Booked on {new Date(booking.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
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
                          </div>

                          <div className="flex items-start text-sm mb-3">
                            <FaMapMarkerAlt className="text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">Address:</span>
                            <span className="ml-1 text-gray-800 line-clamp-1">{booking.address}</span>
                          </div>

                          {booking.description && (
                            <div className="text-sm mb-3">
                              <span className="text-gray-600">Description:</span>
                              <p className="mt-1 text-gray-800 line-clamp-2">{booking.description}</p>
                            </div>
                          )}

                          <div className="flex items-center space-x-3">
                            {getStatusBadge(booking.status, booking.feedback)}
                            {getUrgencyBadge(booking.urgency)}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => window.open('/my-bookings', '_blank')}
                            className="flex items-center px-3 py-2 text-sm rounded-md text-blue-600 hover:bg-blue-50"
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => window.open('/my-bookings', '_blank')}
                            className="flex items-center px-3 py-2 text-sm rounded-md text-blue-600 hover:bg-blue-50"
                            title="Edit Booking"
                          >
                            <FaEdit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {bookings.filter(booking => booking.houseOwner?.username === user?.username).length > 5 && (
                    <div className="text-center pt-4">
                      <a href="/my-bookings" className="btn-secondary">
                        View All {bookings.filter(booking => booking.houseOwner?.username === user?.username).length} Bookings
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryViewer userRole={user?.role} />
          )}

          {activeTab === 'materials-usage' && user?.role === 'admin' && (
            <Materials />
          )}


          {activeTab === 'feedback' && user?.role === 'admin' && (
            <FeedbackManagement />
          )}

          {activeTab === 'announcements' && user?.role === 'admin' && (
            <AnnouncementManagement />
          )}

          {activeTab === 'feedback' && user?.role === 'house_owner' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Feedback</h3>
                <button 
                  onClick={() => {
                    // Find any booking for feedback
                    const anyBooking = bookings.find(b => 
                      b.houseOwner?.username === user?.username
                    );
                    if (anyBooking) {
                      handleGiveFeedback(anyBooking);
                    } else {
                      toast.error('No services available for feedback');
                    }
                  }}
                  className="btn-primary text-sm"
                >
                  Give Feedback
                </button>
              </div>

              {/* Feedback Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaStar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {feedbacks.length}
                  </h3>
                  <p className="text-gray-600">Feedback Given</p>
                </div>

                <div className="card text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.houseOwner?.username === user?.username).length}
                  </h3>
                  <p className="text-gray-600">Total Services</p>
                </div>

                <div className="card text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaComments className="w-6 h-6 text-blue-600" />
                  </div>
                <h3 className="text-2xl font-bold text-gray-900">0</h3>
                <p className="text-gray-600">Pending Feedback</p>
                </div>
              </div>

              {/* Recent Feedback */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h4>
                {feedbacks.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaComments className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Yet</h3>
                    <p className="text-gray-600 mb-4">You can provide feedback for any of your services, regardless of completion status.</p>
                    <button 
                      onClick={() => {
                        // Find a completed booking for feedback
                        const completedBooking = bookings.find(b => 
                          b.houseOwner?.username === user?.username && 
                          true // Allow feedback for all bookings
                        );
                        if (completedBooking) {
                          handleGiveFeedback(completedBooking);
                        } else {
                          toast.error('No services available for feedback');
                        }
                      }}
                      className="btn-primary"
                    >
                      Give Feedback
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.slice(0, 3).map((feedback) => (
                      <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h5 className="font-semibold text-gray-900 mr-3">
                                {feedback.service?.name || 'Service'}
                              </h5>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < (feedback.rating || 0)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-gray-600">
                                  {feedback.rating}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Technician: {feedback.technician?.username || 'N/A'}
                            </p>
                            {feedback.comment && (
                              <p className="text-sm text-gray-700 line-clamp-2">
                                "{feedback.comment}"
                              </p>
                            )}
                            
                            {/* Admin Response */}
                            {feedback.adminResponse && (
                              <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs font-medium text-blue-900">
                                    Admin Response {feedback.adminResponse.respondedBy?.username && `by ${feedback.adminResponse.respondedBy.username}`}
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    {new Date(feedback.adminResponse.respondedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-blue-800 line-clamp-2">
                                  "{feedback.adminResponse.content}"
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  const updated = {
                                    rating: feedback.rating,
                                    comment: feedback.comment,
                                    categories: feedback.categories || [],
                                    isPublic: feedback.isPublic,
                                  };
                                  // Simple prompt-driven edit for now (can be replaced by modal)
                                  const newComment = window.prompt('Update comment', feedback.comment || '');
                                  if (newComment === null) return;
                                  updated.comment = newComment;
                                  await axios.put(`/api/feedback/${feedback._id}`, updated);
                                  toast.success('Feedback updated');
                                  fetchDashboardData();
                                } catch (e) {
                                  toast.error(e.response?.data?.message || 'Failed to update');
                                }
                              }}
                              className="btn-secondary btn-icon"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Delete this feedback?')) return;
                                try {
                                  await axios.delete(`/api/feedback/${feedback._id}`);
                                  toast.success('Feedback deleted');
                                  fetchDashboardData();
                                } catch (e) {
                                  toast.error(e.response?.data?.message || 'Failed to delete');
                                }
                              }}
                              className="btn-danger btn-icon"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {feedbacks.length > 3 && (
                      <div className="text-center pt-4">
                        <a href="/my-bookings" className="btn-secondary">
                          View All Feedback
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Services Pending Feedback */}
              {bookings.filter(b => b.houseOwner?.username === user?.username && !b.feedback).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Services Pending Feedback</h4>
                  <div className="space-y-4">
                    {bookings
                      .filter(b => b.houseOwner?.username === user?.username && !b.feedback)
                      .slice(0, 3)
                      .map((booking) => (
                      <div key={booking._id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {booking.service?.name || 'Service'}
                            </h5>
                            <p className="text-sm text-gray-600 mb-2">
                              Completed on {new Date(booking.updatedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700">
                              Technician: {booking.technician?.username || 'N/A'}
                            </p>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleGiveFeedback(booking)}
                              className="btn-primary text-sm"
                            >
                              Give Feedback
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {bookings.filter(b => b.houseOwner?.username === user?.username && !b.feedback).length > 3 && (
                      <div className="text-center pt-4">
                        <a href="/my-bookings" className="btn-secondary">
                          View All Pending Feedback
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && user?.role === 'technician' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Assigned Feedback</h3>
                <button 
                  onClick={() => {
                    // Refresh feedback data
                    fetchDashboardData();
                  }}
                  className="btn-secondary text-sm"
                >
                  Refresh
                </button>
              </div>

              {/* Feedback Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaComments className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {feedbacks.filter(f => f.technician?._id === user?._id || f.technician === user?._id).length}
                  </h3>
                  <p className="text-gray-600">Assigned Feedback</p>
                </div>

                <div className="card text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {bookings.filter(b => b.technician?._id === user?._id).length}
                  </h3>
                  <p className="text-gray-600">Total Bookings</p>
                </div>

                <div className="card text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaStar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {feedbacks.filter(f => f.technician?._id === user?._id || f.technician === user?._id).length > 0 
                      ? (feedbacks.filter(f => f.technician?._id === user?._id || f.technician === user?._id).reduce((sum, f) => sum + f.rating, 0) / 
                         feedbacks.filter(f => f.technician?._id === user?._id || f.technician === user?._id).length).toFixed(1)
                      : '0'
                    }
                  </h3>
                  <p className="text-gray-600">Average Rating</p>
                </div>
              </div>

              {/* Feedback */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h4>
                {feedbacks.filter(f => f.technician?._id === user?._id || f.technician === user?._id).length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaComments className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Assigned</h3>
                    <p className="text-gray-600 mb-4">You haven't been assigned any feedback yet. Admin will assign feedback to you when available.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Good Feedback Section */}
                    {feedbacks.filter(f => (f.technician?._id === user?._id || f.technician === user?._id) && f.rating >= 4).length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-lg font-semibold text-green-700 flex items-center">
                          <FaStar className="mr-2 text-green-600" />
                          Good Feedback ({feedbacks.filter(f => (f.technician?._id === user?._id || f.technician === user?._id) && f.rating >= 4).length})
                        </h5>
                        {feedbacks.filter(f => (f.technician?._id === user?._id || f.technician === user?._id) && f.rating >= 4).slice(0, 3).map((feedback) => (
                          <div key={feedback._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <h5 className="font-semibold text-gray-900 mr-3">
                                    {feedback.service?.name || 'Service'}
                                  </h5>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < (feedback.rating || 0)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600">
                                      {feedback.rating}/5
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  From: {feedback.houseOwner?.username || 'Anonymous'}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                  Date: {new Date(feedback.createdAt).toLocaleDateString()}
                                </p>
                                {feedback.comment && (
                                  <p className="text-sm text-gray-700 line-clamp-2">
                                    "{feedback.comment}"
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-xs text-gray-500">
                                    Assigned: {new Date(feedback.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bad Feedback Section */}
                    {feedbacks.filter(f => (f.technician?._id === user?._id || f.technician === user?._id) && f.rating < 4).length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-lg font-semibold text-red-700 flex items-center">
                          <FaStar className="mr-2 text-red-600" />
                          Bad Feedback ({feedbacks.filter(f => (f.technician?._id === user?._id || f.technician === user?._id) && f.rating < 4).length})
                        </h5>
                        {feedbacks.filter(f => (f.technician?._id === user?._id || f.technician === user?._id) && f.rating < 4).slice(0, 3).map((feedback) => (
                          <div key={feedback._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <h5 className="font-semibold text-gray-900 mr-3">
                                    {feedback.service?.name || 'Service'}
                                  </h5>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < (feedback.rating || 0)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600">
                                      {feedback.rating}/5
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  From: {feedback.houseOwner?.username || 'Anonymous'}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                  Date: {new Date(feedback.createdAt).toLocaleDateString()}
                                </p>
                                {feedback.comment && (
                                  <p className="text-sm text-gray-700 line-clamp-2">
                                    "{feedback.comment}"
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-xs text-gray-500">
                                    Assigned: {new Date(feedback.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {feedbacks.filter(f => f.technician?._id === user?._id || f.technician === user?._id).length > 6 && (
                      <div className="text-center pt-4">
                        <a href="/technician-dashboard" className="btn-secondary">
                          View All Feedback
                        </a>
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

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button
                  onClick={() => {
                    setShowServiceForm(false);
                    resetServiceForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaClose className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleServiceSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Service Name */}
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Service Name *</label>

                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={serviceFormData.name}
                      onChange={handleServiceFormChange}
                      className="input"
                      required
                      placeholder="Enter service name"
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label htmlFor="category" className="form-label">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={serviceFormData.category}
                      onChange={handleServiceFormChange}
                      className="input"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrician">Electrician</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="carpentry">Carpentry</option>
                      <option value="painting">Painting</option>
                      <option value="gardening">Gardening</option>
                      <option value="appliance_repair">Appliance Repair</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={serviceFormData.description}
                    onChange={handleServiceFormChange}
                    className="input"
                    rows="3"
                    required
                    placeholder="Describe the service in detail"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Base Price */}
                  <div className="form-group">
                    <label htmlFor="basePrice" className="form-label">Base Price (LKR) *</label>
                    <input
                      type="number"
                      id="basePrice"
                      name="basePrice"
                      value={serviceFormData.basePrice}
                      onChange={handleServiceFormChange}
                      className="input"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>

                  {/* Estimated Duration */}
                  <div className="form-group">
                    <label htmlFor="estimatedDuration" className="form-label">Estimated Duration</label>
                    <input
                      type="text"
                      id="estimatedDuration"
                      name="estimatedDuration"
                      value={serviceFormData.estimatedDuration}
                      onChange={handleServiceFormChange}
                      className="input"
                      placeholder="e.g., 2-4 hours"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="form-group">
                  <label htmlFor="imageUrl" className="form-label">Image URL</label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={serviceFormData.imageUrl}
                    onChange={handleServiceFormChange}
                    className="input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Features */}
                <div className="form-group">
                  <label className="form-label">Features</label>
                  <div className="space-y-2">
                    {serviceFormData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="input flex-1"
                          placeholder="Enter feature"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addFeature}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <FaPlus className="w-3 h-3 mr-1" />
                      Add Feature
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div className="form-group">
                  <label className="form-label">Requirements</label>
                  <div className="space-y-2">
                    {serviceFormData.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={requirement}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                          className="input flex-1"
                          placeholder="Enter requirement"
                        />
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <FaPlus className="w-3 h-3 mr-1" />
                      Add Requirement
                    </button>
                  </div>
                </div>

                {/* Active Status */}
                <div className="form-group">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={serviceFormData.isActive}
                      onChange={handleServiceFormChange}
                      className="rounded border-gray-300 mr-2"
                    />
                    <span className="text-sm text-gray-700">Service is active</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowServiceForm(false);
                      resetServiceForm();
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
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

      {/* Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditingProfile ? 'Edit Profile' : 'View Profile'}
                </h3>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setSelectedUser(null);
                    setIsEditingProfile(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaClose className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={profileFormData.username}
                      onChange={handleProfileFormChange}
                      disabled={!isEditingProfile}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileFormData.email}
                      onChange={handleProfileFormChange}
                      disabled={!isEditingProfile}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={profileFormData.mobile}
                      onChange={handleProfileFormChange}
                      disabled={!isEditingProfile}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={profileFormData.role}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      setSelectedUser(null);
                      setIsEditingProfile(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  {isEditingProfile && (
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <FaSave className="w-4 h-4 mr-2 inline" />
                      Save Changes
                    </button>
                  )}
                  {!isEditingProfile && selectedUser._id === user?._id && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <FaEdit className="w-4 h-4 mr-2 inline" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Dashboard;
