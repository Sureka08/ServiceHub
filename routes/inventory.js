const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @route   GET /api/inventory
// @desc    Get all inventory items with filtering
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      category, 
      search, 
      inStock, 
      lowStock, 
      page = 1, 
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
    }
    
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [inventory, total] = await Promise.all([
      Inventory.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Inventory.countDocuments(query)
    ]);

    // Get categories for filtering
    const categories = await Inventory.distinct('category');

    res.json({
      success: true,
      inventory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      categories,
      filters: {
        category,
        search,
        inStock,
        lowStock
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error while fetching inventory' });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get inventory item by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({
      success: true,
      inventory
    });

  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ message: 'Server error while fetching inventory item' });
  }
});

// @route   POST /api/inventory
// @desc    Create new inventory item
// @access  Private (Admin only)
router.post('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      name,
      description,
      category,
      quantity,
      unit,
      price,
      cost,
      supplier,
      location,
      reorderLevel,
      expiryDate,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !quantity || !unit || !price || !cost || !expiryDate) {
      return res.status(400).json({
        message: 'Name, description, category, quantity, unit, price, cost, and expiry date are required'
      });
    }

    // Check if item already exists
    const existingItem = await Inventory.findOne({ 
      name: { $regex: new RegExp(name, 'i') },
      category 
    });

    if (existingItem) {
      return res.status(400).json({
        message: 'An item with this name already exists in this category'
      });
    }

    // Create inventory item
    const inventory = new Inventory({
      name,
      description,
      category,
      quantity: parseInt(quantity),
      unit,
      price: parseFloat(price),
      cost: parseFloat(cost),
      supplier,
      location: location || 'Main Storage',
      reorderLevel: parseInt(reorderLevel) || 10,
      expiryDate: new Date(expiryDate),
      notes
    });

    await inventory.save();

    // Create notification for low stock if applicable
    if (inventory.quantity <= inventory.reorderLevel) {
      try {
        const adminUsers = await User.find({ role: 'admin' });
        
        for (const admin of adminUsers) {
          const notification = new Notification({
            recipient: admin._id,
            type: 'inventory_alert',
            title: 'Low Stock Alert',
            message: `Inventory item "${inventory.name}" is running low. Current stock: ${inventory.quantity} ${inventory.unit}`,
            relatedEntity: 'inventory',
            entityId: inventory._id,
            priority: 'medium',
            actionRequired: true
          });
          
          await notification.save();
        }
      } catch (notificationError) {
        console.error('Error creating low stock notification:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      inventory
    });

  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ message: 'Server error during inventory creation' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Update fields
    const updateFields = ['name', 'description', 'category', 'quantity', 'unit', 'price', 'supplier', 'location', 'minimumStock', 'specifications', 'notes'];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        inventory[field] = req.body[field];
      }
    });

    // Update last restocked date if quantity increased
    if (req.body.quantity && req.body.quantity > inventory.quantity) {
      inventory.lastRestocked = new Date();
    }

    await inventory.save();

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      inventory
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error during inventory update' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if item is being used in active bookings
    // You can add this check if you have a booking-inventory relationship

    await Inventory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });

  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ message: 'Server error during inventory deletion' });
  }
});

// @route   POST /api/inventory/:id/restock
// @desc    Restock inventory item
// @access  Private (Admin only)
router.post('/:id/restock', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { quantity, cost } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Update quantity and last restocked date
    inventory.quantity += parseInt(quantity);
    inventory.lastRestocked = new Date();

    await inventory.save();

    res.json({
      success: true,
      message: `Restocked ${quantity} ${inventory.unit} of ${inventory.name}`,
      inventory
    });

  } catch (error) {
    console.error('Restock inventory error:', error);
    res.status(500).json({ message: 'Server error during inventory restock' });
  }
});

// @route   GET /api/inventory/categories/all
// @desc    Get all inventory categories
// @access  Private
router.get('/categories/all', protect, async (req, res) => {
  try {
    const categories = await Inventory.distinct('category');
    
    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/inventory/stats/overview
// @desc    Get inventory statistics
// @access  Private (Admin only)
router.get('/stats/overview', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minimumStock'] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      },
      categoryStats
    });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ message: 'Server error while fetching inventory statistics' });
  }
});


module.exports = router;
