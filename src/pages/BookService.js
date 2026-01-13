import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaTools, 
  FaDollarSign,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
  FaSearch,
  FaMap,
  FaCrosshairs,
  FaTimes,
  FaPaintBrush,
  FaClipboardList
} from 'react-icons/fa';
import InventorySelector from '../components/InventorySelector';
import LocationMap from '../components/LocationMap';
import ErrorBoundary from '../components/ErrorBoundary';
import PaymentMethodSelector from '../components/PaymentMethodSelector';

const BookService = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [inventoryLoadFailed, setInventoryLoadFailed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  // Get initial category and service from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const serviceName = searchParams.get('service');
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (serviceName) {
      setSelectedServiceName(decodeURIComponent(serviceName));
    }
  }, [searchParams]);

  // Check authentication status
  useEffect(() => {
    if (user && token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user, token]);

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services?limit=100');
      setServices(response.data.services);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortServices = useCallback(() => {
    let filtered = [...services];

    // Filter by specific service name (highest priority)
    if (selectedServiceName) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase() === selectedServiceName.toLowerCase()
      );
    }
    // Filter by category (only if no specific service is selected)
    else if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => 
        service.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort services
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'basePrice') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredServices(filtered);
  }, [services, selectedServiceName, selectedCategory, searchTerm, sortBy, sortOrder]);

  // Filter and sort services when dependencies change
  useEffect(() => {
    filterAndSortServices();
  }, [services, searchTerm, selectedCategory, selectedServiceName, sortBy, sortOrder, filterAndSortServices]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowBookingForm(true);
    
    // Pre-fill form with service details
    setValue('serviceId', service._id);
    setValue('estimatedCost', service.basePrice);
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    setShowBookingForm(false);
  };

  const handleInventoryError = (error) => {
    console.error('Inventory selection error:', error);
    setInventoryLoadFailed(true);
    toast.error('Failed to load inventory. Please try again or contact support.');
  };

  const handleMapToggle = () => {
    setShowMap(!showMap);
    if (!showMap) {
      setMapLoading(true);
      // Simulate map loading
      setTimeout(() => setMapLoading(false), 1000);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    // Reverse geocode to get address
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const address = data.display_name;
        setValue('address', address);
        toast.success('Address updated from map selection!');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast.error('Failed to get address from coordinates');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setMapLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
          setMapLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get current location');
          setMapLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Please login to book a service');
      navigate('/login');
      return;
    }

    // Check if inventory is required but failed to load
    if (selectedService.requiresInventory && selectedInventory.length === 0) {
      toast.error('Please select required materials before booking this service');
      return;
    }

    // Check if payment method is selected
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);
      
      // Calculate total cost including materials
      const materialsCost = selectedInventory.reduce((sum, item) => 
        sum + (item.price * item.selectedQuantity), 0
      );
      const totalCost = selectedService.basePrice + materialsCost;
      
      const bookingData = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        estimatedCost: totalCost,
        paymentMethod: 'cash',
        selectedPaymentMethod: 'cash',
        urgency: 'normal', // Set default urgency since form field is removed
        selectedInventory: selectedInventory.map(item => ({
          itemId: item._id,
          name: item.name,
          unit: item.unit,
          image: item.image,
          quantity: item.selectedQuantity,
          price: item.price,
          totalPrice: item.price * item.selectedQuantity
        }))
      };

      console.log('🔧 Frontend: Sending booking data:', bookingData);
      console.log('📦 Frontend: Selected inventory:', bookingData.selectedInventory);

      await axios.post('/api/bookings', bookingData);
      
      toast.success('Service booked successfully! You will pay in cash when the service is completed.');
      navigate('/my-bookings');
      
    } catch (error) {
      console.error('❌ Booking error:', error);
      console.error('📊 Error response:', error.response?.data);
      
      const message = error.response?.data?.message || 'Failed to book service';
      toast.error(message);
      
      // Show detailed error for inventory issues
      if (error.response?.data?.failedItems) {
        console.error('📦 Failed inventory items:', error.response.data.failedItems);
        error.response.data.failedItems.forEach(item => {
          toast.error(`${item.itemName}: ${item.error}`);
        });
      }
    } finally {
      setSubmitting(false);
    }
  };


  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Please login to your account to book services and access our inventory system.
          </p>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Login Now
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="btn-outline"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  if (showBookingForm && selectedService) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={handleBackToServices}
                className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <FaArrowLeft className="mr-2" />
                Back to Services
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-3">
                Book Service
              </h1>
              <p className="text-gray-600 text-lg">Complete your service booking with ease</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Service Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center mr-4">
                    <FaTools className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Service Details</h3>
                </div>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{selectedService.name}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{selectedService.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Category:</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                        {selectedService.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Base Price:</span>
                      <span className="text-green-600 font-bold text-lg">LKR {selectedService.basePrice}</span>
                    </div>
                    
                    {selectedInventory.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Materials Cost:</span>
                        <span className="text-blue-600 font-bold">
                          LKR {selectedInventory.reduce((sum, item) => sum + (item.price * item.selectedQuantity), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                      <span className="text-gray-700 font-bold">Total Cost:</span>
                      <span className="text-green-600 font-bold text-xl">
                        LKR {(selectedService.basePrice + selectedInventory.reduce((sum, item) => sum + (item.price * item.selectedQuantity), 0)).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Duration:</span>
                      <span className="text-gray-900 font-semibold">{selectedService.estimatedDuration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <FaClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Booking Information</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <input type="hidden" {...register('serviceId')} />
                  <input type="hidden" {...register('estimatedCost')} />

                  {/* Date and Time */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <FaCalendarAlt className="mr-3 text-blue-600" />
                      Schedule Your Service
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label htmlFor="scheduledDate" className="block text-sm font-semibold text-gray-700 mb-2">
                          Preferred Date
                        </label>
                        <input
                          id="scheduledDate"
                          type="date"
                          {...register('scheduledDate', {
                            required: 'Date is required',
                            validate: value => {
                              const selectedDate = new Date(value);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return selectedDate >= today || 'Date must be today or in the future';
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {errors.scheduledDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="scheduledTime" className="block text-sm font-semibold text-gray-700 mb-2">
                          Preferred Time
                        </label>
                       <select
                            id="scheduledTime"
                            {...register('scheduledTime', {
                              required: 'Time is required',
                              validate: (value) => {
                                if (!value) return 'Please select a time';
                                const [hour, minute] = value.split(':').map(Number);
                                if (hour < 9 || hour > 17) {
                                  return 'Please choose a time between 9 AM and 5 PM';
                                }
                                return true;
                              },
                            })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select time</option>
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

                      {/* ✅ show validation error message */}
                      {errors.scheduledTime && (
                        <p className="text-red-500 text-sm mt-1">{errors.scheduledTime.message}</p>
                      )}

                        {errors.scheduledTime && (
                          <p className="text-red-500 text-sm mt-1">{errors.scheduledTime.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="form-group">
                    <label htmlFor="address" className="form-label">
                      <FaMapMarkerAlt className="mr-2" />
                      Service Address
                    </label>
                    
                    {/* Map Controls */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={handleMapToggle}
                        className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <FaMap className="mr-2" />
                        Select Location on Map
                      </button>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={mapLoading}
                        className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        <FaCrosshairs className="mr-2" />
                        {mapLoading ? 'Getting Location...' : 'Use My Location'}
                      </button>
                    </div>

                    {/* Map Display */}
                    {showMap && (
                      <div className="mb-4">
                        <div className="relative w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          {mapLoading ? (
                            <div className="text-center">
                              <FaSpinner className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                              <p className="text-gray-600">Loading map...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FaMap className="w-16 h-16 text-gray-400 mb-4" />
                              <p className="text-gray-600 mb-2">Interactive Map</p>
                              <p className="text-sm text-gray-500 mb-4">
                                Click on the map to select your location
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleLocationSelect(6.9271, 79.8612)} // Colombo, Sri Lanka
                                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                  Colombo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLocationSelect(7.8731, 80.7718)} // Kandy, Sri Lanka
                                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                  Kandy
                                </button>
                              </div>
                              {selectedLocation && (
                                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                  Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected Location Display */}
                    {selectedLocation && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Selected Location</p>
                            <p className="text-xs text-blue-700">
                              Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedLocation(null)}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      id="address"
                      {...register('address', {
                        required: 'Address is required',
                        minLength: {
                          value: 10,
                          message: 'Address must be at least 10 characters'
                        }
                      })}
                      className="input"
                      rows="3"
                      placeholder="Enter your complete address or use the map above to select location"
                    />
                    {errors.address && (
                      <p className="form-error">{errors.address.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label htmlFor="description" className="form-label">
                      <FaTools className="mr-2" />
                      Service Description
                    </label>
                    <textarea
                      id="description"
                      {...register('description')}
                      className="input"
                      rows="4"
                      placeholder="Describe the service you need in detail"
                    />
                  </div>

                  {/* Inventory Selection */}
                  <div className="form-group">
                    <label className="form-label">
                      <FaTools className="mr-2" />
                      Required Materials
                    </label>
                    <InventorySelector
                      serviceCategory={selectedService.category}
                      onInventorySelect={setSelectedInventory}
                      selectedItems={selectedInventory}
                      onError={handleInventoryError}
                    />
                  </div>


                  {/* Payment Method */}
                  <div className="form-group">
                    <label className="form-label">
                      <FaDollarSign className="mr-2" />
                      Payment Method *
                    </label>
                    <PaymentMethodSelector
                      selectedMethod={selectedPaymentMethod}
                      onMethodSelect={setSelectedPaymentMethod}
                      totalAmount={selectedService.basePrice + selectedInventory.reduce((sum, item) => sum + (item.price * item.selectedQuantity), 0)}
                    />
                    {!selectedPaymentMethod && (
                      <p className="form-error">Please select a payment method</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting || inventoryLoadFailed}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="w-5 h-5 mr-3 animate-spin" />
                          <span className="text-lg">Booking Service...</span>
                        </>
                      ) : inventoryLoadFailed ? (
                        <span className="text-lg">Cannot Book - Materials Loading Failed</span>
                      ) : (
                        <>
                          <FaCheckCircle className="w-5 h-5 mr-3" />
                          <span className="text-lg">Book Service Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Location Map Modal */}
        {showMap && (
          <ErrorBoundary>
            <LocationMap
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              onClose={() => setShowMap(false)}
            />
          </ErrorBoundary>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <BackButton fallbackPath="/services" />
        </div>
      </div>
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Service
          </h1>
          {selectedServiceName ? (
            <div className="mb-4">
              <div className="inline-flex items-center space-x-3 bg-blue-50 px-6 py-3 rounded-full mb-4">
                <FaPaintBrush className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-blue-800">{selectedServiceName}</h2>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Book this specific service for your home
              </p>
            </div>
          ) : (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our wide range of professional services and book your appointment today
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-600" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="basePrice-asc">Price Low-High</option>
                <option value="basePrice-desc">Price High-Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <FaTools className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service._id} className="card-hover group">
                <div className="text-center">
                  {/* Service Icon */}
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                    <FaTools className="w-10 h-10 text-primary-600" />
                  </div>

                  {/* Service Info */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Service Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-primary-600 font-medium capitalize">
                        {service.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-green-600 font-semibold">
                        LKR {service.basePrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="text-gray-700">
                        {service.estimatedDuration}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  {service.features && service.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    type="button"
                    onClick={() => handleServiceSelect(service)}
                    className="btn-primary w-full group-hover:scale-105 transition-transform duration-200"
                  >
                    Book This Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="text-center mt-8 text-gray-600">
          {selectedServiceName ? (
            <span>
              Showing {filteredServices.length} service: <span className="font-semibold text-primary-600">{selectedServiceName}</span>
            </span>
          ) : (
            <span>
              Showing {filteredServices.length} of {services.length} services
              {selectedCategory !== 'all' && (
                <span className="ml-2 text-primary-600 font-medium">
                  ({selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} category)
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default BookService;
