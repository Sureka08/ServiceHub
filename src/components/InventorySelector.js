import React, { useState, useEffect, useCallback } from 'react';
import { FaBox, FaSearch, FaExclamationTriangle, FaCheckCircle, FaSignInAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const InventorySelector = ({ serviceCategory, onInventorySelect, selectedItems = [], onError }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSelector, setShowSelector] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [authError, setAuthError] = useState(false);

  const fetchInventory = useCallback(async () => {
    // Check if user is authenticated
    if (!user || !token) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setAuthError(false);
      setLoadError(false);
      const response = await axios.get('/api/inventory');
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
        toast.error('Please login to view inventory');
      } else {
        setLoadError(true);
        toast.error('Failed to load inventory items');
      }
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [user, token, onError]);

  const filterInventory = useCallback(() => {
    let filtered = [...inventory];

    // Filter by category if service category is specified
    if (serviceCategory && serviceCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category === serviceCategory || 
        item.category === 'general'
      );
    }

    // Filter by selected category
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

    // Only show available items
    filtered = filtered.filter(item => item.isActive && item.quantity > 0);

    setFilteredInventory(filtered);
  }, [inventory, serviceCategory, selectedCategory, searchTerm]);

  useEffect(() => {
    if (showSelector) {
      fetchInventory();
    }
  }, [showSelector, user, token, fetchInventory]);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, selectedCategory, filterInventory]);

  const handleItemSelect = (item) => {
    const existingItem = selectedItems.find(selected => selected._id === item._id);
    
    if (existingItem) {
      // Remove item if already selected
      onInventorySelect(selectedItems.filter(selected => selected._id !== item._id));
    } else {
      // Check if item is in stock before adding
      if (item.quantity === 0) {
        toast.error('Item is out of stock');
        return;
      }
      
      // Check if there's enough stock for at least 1 piece
      if (item.quantity < 1) {
        toast.error('Insufficient stock available');
        return;
      }
      
      // Add item with quantity 1
      onInventorySelect([...selectedItems, { ...item, selectedQuantity: 1 }]);
    }
    
    // Refresh inventory data to get updated quantities
    if (showSelector) {
      fetchInventory();
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    // Find the current inventory item to get the latest quantity
    const currentInventoryItem = inventory.find(inv => inv._id === itemId);
    const maxQuantity = currentInventoryItem ? currentInventoryItem.quantity : 0;
    
    const updatedItems = selectedItems.map(item => 
      item._id === itemId 
        ? { ...item, selectedQuantity: Math.max(1, Math.min(quantity, maxQuantity)) }
        : item
    );
    onInventorySelect(updatedItems);
    
    // Refresh inventory data to get updated quantities
    if (showSelector) {
      fetchInventory();
    }
  };

  const removeItem = (itemId) => {
    onInventorySelect(selectedItems.filter(item => item._id !== itemId));
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


  const totalCost = selectedItems.reduce((sum, item) => 
    sum + (item.price * item.selectedQuantity), 0
  );


  // Show login prompt if not authenticated
  if (authError || !user) {
    return (
      <div className="space-y-4">
        <div className="card text-center py-8">
          <FaSignInAlt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Login Required
          </h4>
          <p className="text-gray-600 mb-4 text-sm">
            Please login to select materials for your service
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-primary text-sm px-4 py-2"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBox className="mr-2 text-primary-600" />
            Selected Materials ({selectedItems.length})
          </h4>
          
          <div className="space-y-3">
            {selectedItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  )}
                  <div>
                    <h5 className="font-medium text-gray-900">{item.name}</h5>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Price: LKR {item.price}</span>
                      <span>Available: {item.quantity} {item.unit}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={item.selectedQuantity}
                      onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Cost:</span>
                <span className="text-lg font-semibold text-green-600">LKR {totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Selector Button */}
      <button
        type="button"
        onClick={() => setShowSelector(!showSelector)}
        className="btn-secondary w-full flex items-center justify-center"
      >
        <FaBox className="mr-2" />
        {selectedItems.length > 0 ? 'Modify Materials' : 'Select Required Materials'}
      </button>

      {/* Error Message */}
      {loadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <FaExclamationTriangle className="mr-2 text-red-600" />
            <span className="text-sm font-medium">Failed to load materials</span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            Please try again or contact support if the problem persists.
          </p>
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              fetchInventory();
            }}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Inventory Selection Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Select Materials for {serviceCategory ? serviceCategory.charAt(0).toUpperCase() + serviceCategory.slice(1) : 'Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSelector(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid md:grid-cols-3 gap-4">
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
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="painting">Painting</option>
                    <option value="garden">Garden</option>
                    <option value="appliance">Appliance</option>
                    <option value="hvac">HVAC</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory List */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading materials...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredInventory.map((item) => {
                    const isSelected = selectedItems.some(selected => selected._id === item._id);
                    const stockStatus = getStockStatus(item);
                    
                    return (
                      <div
                        key={item._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleItemSelect(item)}
                      >
                        <div className="flex items-start space-x-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-600 font-medium">LKR {item.price}</span>
                              <span className="text-gray-500">Available: {item.quantity} {item.unit}</span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${stockStatus.bg}`}>
                                {getStockIcon(stockStatus.status)}
                                <span className={stockStatus.color}>
                                  {stockStatus.status === 'out_of_stock' ? 'Out of Stock' :
                                   stockStatus.status === 'low_stock' ? 'Low Stock' : 'In Stock'}
                                </span>
                              </div>
                              
                              {isSelected && (
                                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                                  <FaCheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {selectedItems.length} material(s) selected
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSelector(false)}
                  className="btn-secondary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySelector;
