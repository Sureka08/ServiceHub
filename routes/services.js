const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Service = require('../models/Service');

// @route   GET /api/services
// @desc    Get all services with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }

    // Filter by active status - only show active services to house owners
    // Admins can see all services (active and inactive)
    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
    }

    // Sorting
    let sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const services = await Service.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);

    // Get unique categories for filtering
    // For house owners, only show categories from active services
    let categoryQuery = {};
    if (!req.user || req.user.role !== 'admin') {
      categoryQuery.isActive = true;
    }
    const categories = await Service.distinct('category', categoryQuery);

    res.json({
      success: true,
      services,
      categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalServices: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error while fetching services' });
  }
});

// @route   GET /api/services/:id
// @desc    Get a specific service by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if service is active - house owners cannot access inactive services
    if (!service.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      success: true,
      service
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error while fetching service' });
  }
});

// @route   POST /api/services
// @desc    Create a new service (Admin only)
// @access  Private (Admin only)
router.post('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      name,
      category,
      description,
      basePrice,
      estimatedDuration,
      features,
      requirements,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!name || !category || !description || !basePrice) {
      return res.status(400).json({
        message: 'Name, category, description, and base price are required'
      });
    }

    // Check if service with same name already exists
    const existingService = await Service.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingService) {
      return res.status(400).json({
        message: 'Service with this name already exists'
      });
    }

    const service = new Service({
      name,
      category,
      description,
      basePrice: parseFloat(basePrice),
      estimatedDuration: estimatedDuration || '2-4 hours',
      features: features || [],
      requirements: requirements || [],
      imageUrl: imageUrl || '',
      isActive: true
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error during service creation' });
  }
});

// @route   PUT /api/services/:id
// @desc    Update a service (Admin only)
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const {
      name,
      category,
      description,
      basePrice,
      estimatedDuration,
      features,
      requirements,
      imageUrl,
      isActive
    } = req.body;

    // Update fields
    if (name) service.name = name;
    if (category) service.category = category;
    if (description) service.description = description;
    if (basePrice !== undefined) service.basePrice = parseFloat(basePrice);
    if (estimatedDuration) service.estimatedDuration = estimatedDuration;
    if (features) service.features = features;
    if (requirements) service.requirements = requirements;
    if (imageUrl !== undefined) service.imageUrl = imageUrl;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error while updating service' });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete a service (Admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if service has active bookings
    const activeBookings = await require('../models/Booking').find({
      service: req.params.id,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete service with active bookings'
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error while deleting service' });
  }
});

// @route   GET /api/services/categories/all
// @desc    Get all service categories
// @access  Public
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    
    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/services/category/:category
// @desc    Get services by specific category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { category } = req.params;

    const skip = (page - 1) * limit;

    const services = await Service.find({ 
      category: { $regex: new RegExp(category, 'i') },
      isActive: true
    })
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Service.countDocuments({ 
      category: { $regex: new RegExp(category, 'i') },
      isActive: true
    });

    res.json({
      success: true,
      category,
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalServices: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ message: 'Server error while fetching services by category' });
  }
});

// @route   GET /api/services/search
// @desc    Search services by keyword
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const skip = (page - 1) * limit;

    const services = await Service.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Service.countDocuments({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    });

    res.json({
      success: true,
      query: q,
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalServices: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({ message: 'Server error while searching services' });
  }
});

module.exports = router;
