import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import ChangePassword from '../components/ChangePassword';
import BackButton from '../components/BackButton';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaPlus,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaCamera,
  FaImage,
  FaLock,
  FaComments,
  FaStar,
  FaCheckCircle
} from 'react-icons/fa';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    bio: '',
    specialties: []
  });

  const [addressForm, setAddressForm] = useState({
    type: 'home', // home, work, other
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false,
    instructions: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        mobile: user.mobile || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
        specialties: user.specialties || []
      });
      fetchAddresses();
      
      // Fetch feedback data for house owners
      if (user.role === 'house_owner') {
        fetchFeedbackData();
      }
    }
  }, [user]);

  const fetchFeedbackData = async () => {
    try {
      // Fetch feedbacks
      const feedbacksResponse = await axios.get('/api/feedback/user');
      setFeedbacks(feedbacksResponse.data.feedbacks || []);
      
      // Fetch bookings
      const bookingsResponse = await axios.get('/api/bookings');
      setBookings(bookingsResponse.data.bookings || []);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get('/api/users/addresses');
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecialtyChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      specialties: checked 
        ? [...prev.specialties, value]
        : prev.specialties.filter(s => s !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put('/api/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAddress) {
        await axios.put(`/api/users/addresses/${editingAddress._id}`, addressForm);
        toast.success('Address updated successfully!');
      } else {
        await axios.post('/api/users/addresses', addressForm);
        toast.success('Address added successfully!');
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      instructions: address.instructions || ''
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await axios.delete(`/api/users/addresses/${addressId}`);
      toast.success('Address deleted successfully!');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: 'home',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: false,
      instructions: ''
    });
  };

  const availableSpecialties = [
    'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 
    'Gardening', 'Appliance Repair', 'HVAC', 'General Repair'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <BackButton fallbackPath="/dashboard" />
        </div>
      </div>
      
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Profile
          </h1>
          <p className="text-xl text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Information */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            <div className="flex space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="btn-secondary flex items-center"
                  >
                    <FaLock className="w-4 h-4 mr-2" />
                    Change Password
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary flex items-center"
                  >
                    <FaEdit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary flex items-center"
                  >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="input w-full bg-gray-100 cursor-not-allowed"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="input w-full"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {user?.role === 'technician' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSpecialties.map(specialty => (
                      <label key={specialty} className="flex items-center">
                        <input
                          type="checkbox"
                          value={specialty}
                          checked={formData.specialties.includes(specialty)}
                          onChange={handleSpecialtyChange}
                          className="rounded border-gray-300 mr-2"
                        />
                        <span className="text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <FaUser className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">{user?.username || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FaPhone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium">{user?.mobile || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FaUser className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
              {user?.bio && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Bio</p>
                  <p className="text-gray-700">{user.bio}</p>
                </div>
              )}
              {user?.specialties && user.specialties.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {user.specialties.map((specialty, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Section for House Owners */}
        {user?.role === 'house_owner' && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Feedback</h2>
              <a href="/my-bookings" className="btn-primary flex items-center">
                <FaComments className="w-4 h-4 mr-2" />
                Give Feedback
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaStar className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{feedbacks.length}</h3>
                <p className="text-gray-600 text-sm">Feedback Given</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {bookings.filter(b => b.houseOwner?.username === user?.username && b.status === 'completed').length}
                </h3>
                <p className="text-gray-600 text-sm">Completed Services</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaComments className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
                <p className="text-gray-600 text-sm">Pending Feedback</p>
              </div>
            </div>

            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FaComments className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Services Yet</h3>
              <p className="text-gray-600 mb-4">Feedback is automatically added when services are completed, or you can add/edit it now.</p>
              <a href="/my-bookings" className="btn-primary">
                Give Feedback
              </a>
            </div>
          </div>
        )}

        {/* Address Management */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Address Management</h2>
            <button
              onClick={() => {
                resetAddressForm();
                setEditingAddress(null);
                setShowAddressForm(true);
              }}
              className="btn-primary flex items-center"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add Address
            </button>
          </div>

          {showAddressForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Type
                    </label>
                    <select
                      name="type"
                      value={addressForm.type}
                      onChange={handleAddressInputChange}
                      className="input w-full"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressInputChange}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressInputChange}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={addressForm.zipCode}
                      onChange={handleAddressInputChange}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    name="address"
                    value={addressForm.address}
                    onChange={handleAddressInputChange}
                    rows={3}
                    className="input w-full"
                    placeholder="Enter complete address..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={addressForm.instructions}
                    onChange={handleAddressInputChange}
                    rows={2}
                    className="input w-full"
                    placeholder="Any special instructions for service delivery..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressInputChange}
                    className="rounded border-gray-300 mr-2"
                  />
                  <label className="text-sm text-gray-700">Set as default address</label>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      resetAddressForm();
                    }}
                    className="btn-secondary flex items-center"
                  >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <FaMapMarkerAlt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses added</h3>
                <p className="text-gray-600">Add your first address to get started</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div key={address._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mr-2">
                          {address.type}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{address.address}</p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zipCode}, {address.country}
                      </p>
                      {address.instructions && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Instructions:</strong> {address.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Address"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Address"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePassword onClose={() => setShowChangePassword(false)} />
        )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
