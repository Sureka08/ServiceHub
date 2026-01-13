const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'cleaning', 'carpentry', 'painting', 'garden', 'hvac', 'appliance', 'general']
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['piece', 'meter', 'liter', 'kg', 'box', 'set', 'sheet', 'bottle', 'gallon', 'pack', 'pair', 'bag', 'cylinder', 'panel', 'tube', 'roll']
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  location: {
    type: String,
    default: 'Main Storage'
  },
  image: {
    type: String,
    default: ''
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inventorySchema.index({ category: 1, isActive: 1 });
inventorySchema.index({ name: 'text', description: 'text' });
inventorySchema.index({ quantity: 1, reorderLevel: 1 });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

// Virtual for profit margin
inventorySchema.virtual('profitMargin').get(function() {
  if (this.cost === 0) return 0;
  return ((this.price - this.cost) / this.cost * 100).toFixed(2);
});

// Method to check if item needs reordering
inventorySchema.methods.needsReorder = function() {
  return this.quantity <= this.reorderLevel;
};

// Method to update quantity
inventorySchema.methods.updateQuantity = function(change, type = 'add') {
  if (type === 'add') {
    this.quantity += change;
  } else if (type === 'subtract') {
    this.quantity = Math.max(0, this.quantity - change);
  }
  
  if (change > 0) {
    this.lastRestocked = new Date();
  }
  
  return this.quantity;
};

module.exports = mongoose.model('Inventory', inventorySchema);
