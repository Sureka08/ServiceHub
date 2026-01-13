import React, { useState, useEffect } from 'react';
import { FaBox, FaSearch, FaFilter, FaExclamationTriangle, FaCheckCircle, FaSignInAlt, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const InventoryViewer = ({ userRole = 'user' }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showExpired, setShowExpired] = useState(false);
  const [authError, setAuthError] = useState(false);
  

  
  // Admin form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    unit: '',
    location: '',
    expiryDate: '',
    reorderLevel: '',
    notes: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    quantity: '',
    unit: '',
    location: '',
    expiryDate: '',
    reorderLevel: '',
    notes: ''
  });

  useEffect(() => {
    console.log('InventoryViewer useEffect - User:', user);
    console.log('InventoryViewer useEffect - Token:', token);
    console.log('InventoryViewer useEffect - Will fetch inventory:', !!user && !!token);
    fetchInventory();
  }, [user, token]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, selectedCategory, showExpired]);

  const fetchInventory = async () => {
    console.log('fetchInventory called - User:', user);
    console.log('fetchInventory called - Token:', token);
    
    // Check if user is authenticated
    if (!user || !token) {
      console.log('fetchInventory - User not authenticated, setting auth error');
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAuthError(false);
      const response = await axios.get('/api/inventory');
      console.log('Inventory API response:', response.data);
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
        toast.error('Please login to view inventory');
      } else {
        toast.error('Failed to load inventory items');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter expired items
    if (!showExpired) {
      filtered = filtered.filter(item => {
        if (!item.expiryDate) return true;
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        return expiryDate >= today;
      });
    }

    // Only show available items - temporarily show all for debugging
    // filtered = filtered.filter(item => item.isActive && item.quantity > 0);
    filtered = filtered.filter(item => true); // Show all items temporarily

    console.log('Original inventory count:', inventory.length);
    console.log('Filtered inventory count:', filtered.length);
    console.log('Sample inventory item:', inventory[0]);

    setFilteredInventory(filtered);
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { status: 'out_of_stock', color: 'text-red-600', bg: 'bg-red-50' };
    if (item.quantity <= item.reorderLevel) return { status: 'low_stock', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { status: 'in_stock', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'out_of_stock': return <FaExclamationTriangle className="text-red-500" />;
      case 'low_stock': return <FaExclamationTriangle className="text-orange-500" />;
      default: return <FaCheckCircle className="text-green-500" />;
    }
  };

  const formatExpiryDate = (date) => {
    if (!date) return 'Not set';
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    return expiryDate.toLocaleDateString();
  };

  const getExpiryColor = (date) => {
    if (!date) return 'text-gray-600';
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays <= 7) return 'text-orange-600';
    return 'text-gray-600';
  };

  const categories = [
    'plumbing', 'electrical', 'cleaning', 'carpentry', 'painting', 
    'garden', 'appliance', 'hvac', 'general'
  ];

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name || '',
      category: item.category || '',
      description: item.description || '',
      price: item.price || '',
      cost: item.cost || '',
      quantity: item.quantity || '',
      unit: item.unit || '',
      location: item.location || '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      reorderLevel: item.reorderLevel || '',
      notes: item.notes || ''
    });
    setShowEditForm(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/inventory/${itemId}`);
      toast.success('Item deleted successfully');
      fetchInventory(); // Refresh the inventory list
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/inventory/${editingItem._id}`, editFormData);
      toast.success('Item updated successfully');
      setShowEditForm(false);
      setEditingItem(null);
      fetchInventory(); // Refresh the inventory list
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetAddForm = () => {
    setAddFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      cost: '',
      quantity: '',
      unit: '',
      location: '',
      expiryDate: '',
      reorderLevel: '',
      notes: ''
    });
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/inventory', addFormData);
      toast.success('Material added successfully');
      setShowAddForm(false);
      resetAddForm();
      fetchInventory(); // Refresh the inventory list
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error(error.response?.data?.message || 'Failed to add material');
    }
  };



  // Show login prompt if not authenticated
  if (authError || !user) {
    return (
      <div className="space-y-6">
        <div className="card text-center py-12">
          <FaSignInAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Login Required
          </h3>
          <p className="text-gray-600 mb-6">
            Please login to view available materials and supplies
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaBox className="mr-2 text-primary-600" />
            Available Materials
          </h2>
          <p className="text-gray-600 mt-1">
            Browse available materials and supplies for your services
          </p>
        </div>
        
        {/* Admin Controls */}
        {userRole === 'admin' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Item
            </button>
          </div>
        )}
        

      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Show Expired
            </label>
          </div>
        </div>
      </div>



      {/* Inventory Grid */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading materials...</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="card text-center py-12">
          <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <div key={item._id} className="card-hover">
                <div className="p-6">
                  {/* Item Image */}
                  {item.image && (
                    <div className="text-center mb-4">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  )}

                  {/* Item Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  </div>

                  {/* Stock Status */}
                  <div className="flex justify-center mb-4">
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${stockStatus.bg}`}>
                      {getStockIcon(stockStatus.status)}
                      <span className={stockStatus.color}>
                        {stockStatus.status === 'out_of_stock' ? 'Out of Stock' :
                         stockStatus.status === 'low_stock' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-primary-600 font-medium capitalize">{item.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-green-600 font-semibold">LKR {item.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available:</span>
                      <span className="text-gray-900">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-900">{item.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expiry:</span>
                      <span className={`font-medium ${getExpiryColor(item.expiryDate)}`}>
                        {formatExpiryDate(item.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons (for admins) */}
                  {userRole === 'admin' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Item"
                        >
                          <FaEdit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Item"
                        >
                          <FaTrash className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Supplier Info (for technicians) */}
                  {userRole === 'technician' && item.supplier && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Supplier Information</div>
                      <div className="space-y-1 text-xs">
                        {item.supplier.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Name:</span>
                            <span className="text-gray-900">{item.supplier.name}</span>
                          </div>
                        )}
                        {item.supplier.contact && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Contact:</span>
                            <span className="text-gray-900">{item.supplier.contact}</span>
                          </div>
                        )}
                        {item.supplier.email && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span className="text-gray-900">{item.supplier.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-gray-600">
        Showing {filteredInventory.length} of {inventory.length} available materials
      </div>

      {/* Edit Form Modal */}
      {showEditForm && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Material</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditFormSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                      required
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditFormChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    required
                    rows={3}
                    className="input w-full"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (LKR) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={editFormData.price}
                      onChange={handleEditFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost (LKR) *
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={editFormData.cost}
                      onChange={handleEditFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={editFormData.quantity}
                      onChange={handleEditFormChange}
                      required
                      min="0"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={editFormData.unit}
                      onChange={handleEditFormChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Unit</option>
                      <option value="piece">Piece</option>
                      <option value="meter">Meter</option>
                      <option value="liter">Liter</option>
                      <option value="kg">Kilogram</option>
                      <option value="box">Box</option>
                      <option value="set">Set</option>
                      <option value="sheet">Sheet</option>
                      <option value="bottle">Bottle</option>
                      <option value="gallon">Gallon</option>
                      <option value="pack">Pack</option>
                      <option value="pair">Pair</option>
                      <option value="bag">Bag</option>
                      <option value="cylinder">Cylinder</option>
                      <option value="panel">Panel</option>
                      <option value="tube">Tube</option>
                      <option value="roll">Roll</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditFormChange}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={editFormData.expiryDate}
                      onChange={handleEditFormChange}
                      required
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={editFormData.reorderLevel}
                    onChange={handleEditFormChange}
                    min="0"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditFormChange}
                    rows={2}
                    className="input w-full"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingItem(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                  >
                    <FaEdit className="w-4 h-4 mr-2" />
                    Update Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Material</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetAddForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddFormSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={addFormData.name}
                      onChange={handleAddFormChange}
                      required
                      className="input w-full"
                      placeholder="Enter material name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={addFormData.category}
                      onChange={handleAddFormChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={addFormData.description}
                    onChange={handleAddFormChange}
                    required
                    rows={3}
                    className="input w-full"
                    placeholder="Enter material description"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (LKR) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={addFormData.price}
                      onChange={handleAddFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="input w-full"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost (LKR) *
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={addFormData.cost}
                      onChange={handleAddFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="input w-full"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={addFormData.quantity}
                      onChange={handleAddFormChange}
                      required
                      min="0"
                      className="input w-full"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={addFormData.unit}
                      onChange={handleAddFormChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Unit</option>
                      <option value="piece">Piece</option>
                      <option value="meter">Meter</option>
                      <option value="liter">Liter</option>
                      <option value="kg">Kilogram</option>
                      <option value="box">Box</option>
                      <option value="set">Set</option>
                      <option value="sheet">Sheet</option>
                      <option value="bottle">Bottle</option>
                      <option value="gallon">Gallon</option>
                      <option value="pack">Pack</option>
                      <option value="pair">Pair</option>
                      <option value="bag">Bag</option>
                      <option value="cylinder">Cylinder</option>
                      <option value="panel">Panel</option>
                      <option value="tube">Tube</option>
                      <option value="roll">Roll</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={addFormData.location}
                      onChange={handleAddFormChange}
                      className="input w-full"
                      placeholder="Main Storage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={addFormData.expiryDate}
                      onChange={handleAddFormChange}
                      required
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={addFormData.reorderLevel}
                    onChange={handleAddFormChange}
                    min="0"
                    className="input w-full"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={addFormData.notes}
                    onChange={handleAddFormChange}
                    rows={2}
                    className="input w-full"
                    placeholder="Additional notes (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetAddForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryViewer;

