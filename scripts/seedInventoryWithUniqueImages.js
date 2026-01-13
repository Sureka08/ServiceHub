const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load all public images and map them for best-match assignment to inventory items
function loadPublicImagesMap() {
  try {
    const imagesDir = path.resolve(__dirname, '../../client/public/images');
    if (!fs.existsSync(imagesDir)) return new Map();

    const validExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    const files = fs.readdirSync(imagesDir).filter(f => validExt.has(path.extname(f).toLowerCase()));

    const normalize = (s) => s
      .toLowerCase()
      .replace(/\.(jpg|jpeg|png|webp)$/i, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    const map = new Map();
    for (const file of files) {
      map.set(normalize(file), file);
    }
    return map;
  } catch (_) {
    return new Map();
  }
}

function pickBestImageForItem(itemName, imagesMap) {
  if (!imagesMap || imagesMap.size === 0) return null;
  const normalize = (s) => s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  const name = normalize(itemName);
  if (imagesMap.has(name)) return imagesMap.get(name);

  const words = name.split(' ').filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const [key, file] of imagesMap.entries()) {
    let score = 0;
    for (const w of words) {
      if (key.includes(w)) score += w.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }
  return best;
}

const sampleInventory = [
  // HVAC Materials with unique images
  {
    name: 'AC Filter 16x20',
    description: 'Standard air conditioner filter',
    category: 'hvac',
    price: 8.99,
    cost: 4.50,
    quantity: 50,
    unit: 'piece',
    supplier: {
      name: 'HVAC Pro Supplies',
      contact: '+1-555-0123',
      email: 'sales@hvacpro.com'
    },
    reorderLevel: 12,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard AC filter size'
  },
  {
    name: 'Air Filter 16x20x1',
    description: 'High-efficiency air filter, 16x20x1 inch',
    category: 'hvac',
    price: 18.99,
    cost: 9.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'HVAC Pro Supplies',
      contact: '+1-555-0123',
      email: 'sales@hvacpro.com'
    },
    reorderLevel: 8,
    location: 'HVAC Storage',
    image: '',
    expiryDate: new Date('2026-12-31'),
    notes: 'High-efficiency air filter'
  },
  {
    name: 'Refrigerant R-410A',
    description: 'Environmentally friendly refrigerant',
    category: 'hvac',
    price: 45.99,
    cost: 23.00,
    quantity: 15,
    unit: 'cylinder',
    supplier: {
      name: 'HVAC Pro Supplies',
      contact: '+1-555-0123',
      email: 'sales@hvacpro.com'
    },
    reorderLevel: 4,
    location: 'HVAC Storage',
    image: '\images\Refrigerant R-410A.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Modern refrigerant for AC systems'
  },

  // Appliance Materials with unique images
  {
    name: 'Appliance Cleaner',
    description: 'Professional appliance cleaning solution',
    category: 'appliance',
    price: 9.99,
    cost: 5.00,
    quantity: 35,
    unit: 'bottle',
    supplier: {
      name: 'ApplianceParts Direct',
      contact: '+1-555-0456',
      email: 'sales@applianceparts.com'
    },
    reorderLevel: 8,
    location: 'Appliance Storage',
    image: '\images\Appliance Cleaner.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Safe for all appliance surfaces'
  },
  {
    name: 'Appliance Fuse Set',
    description: 'Assorted fuses for various appliances',
    category: 'appliance',
    price: 12.99,
    cost: 6.50,
    quantity: 30,
    unit: 'set',
    supplier: {
      name: 'ApplianceParts Direct',
      contact: '+1-555-0456',
      email: 'sales@applianceparts.com'
    },
    reorderLevel: 8,
    location: 'Appliance Storage',
    image: 'images\Appliance Fuse Set.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Set of 20 assorted fuses'
  },
  {
    name: 'Rubber Gasket Set',
    description: 'Assorted rubber gaskets for appliances',
    category: 'appliance',
    price: 15.99,
    cost: 8.00,
    quantity: 25,
    unit: 'set',
    supplier: {
      name: 'ApplianceParts Direct',
      contact: '+1-555-0456',
      email: 'sales@applianceparts.com'
    },
    reorderLevel: 6,
    location: 'Appliance Storage',
    image: '\images\Rubber Gasket Set.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Various sizes for different appliances'
  },

  // Carpentry Materials with unique images
  {
    name: 'Cabinet Hinges Set',
    description: 'Concealed cabinet hinges, pack of 10 pairs',
    category: 'carpentry',
    price: 25.99,
    cost: 13.00,
    quantity: 20,
    unit: 'set',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0321',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 5,
    location: 'Warehouse D',
    image: '\images\Cabinet Hinges Set.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'High-quality concealed hinges'
  },
  {
    name: 'Plywood 1/2 inch',
    description: 'High-quality plywood sheet',
    category: 'carpentry',
    price: 45.99,
    cost: 23.00,
    quantity: 20,
    unit: 'sheet',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0321',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 5,
    location: 'Warehouse D',
    image: '\images\Plywood.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard construction plywood'
  },
  {
    name: 'Wood Screws Assorted',
    description: 'Assorted wood screws in various sizes',
    category: 'carpentry',
    price: 12.99,
    cost: 6.50,
    quantity: 30,
    unit: 'box',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0321',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 8,
    location: 'Warehouse D',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Box of 100 assorted screws'
  },

  // Cleaning Materials with unique images
  {
    name: 'Carpet Cleaner Solution',
    description: 'Professional carpet cleaning solution, 1-gallon',
    category: 'cleaning',
    price: 18.99,
    cost: 9.50,
    quantity: 25,
    unit: 'gallon',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0789',
      email: 'orders@cleanpro.com'
    },
    reorderLevel: 6,
    location: 'Warehouse C',
    image: '\images\Carpet Cleaner Solution.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Professional carpet cleaning solution'
  },
  {
    name: 'Microfiber Cloths Set',
    description: 'Professional microfiber cleaning cloths',
    category: 'cleaning',
    price: 15.99,
    cost: 8.00,
    quantity: 20,
    unit: 'set',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0789',
      email: 'orders@cleanpro.com'
    },
    reorderLevel: 5,
    location: 'Warehouse C',
    image: '\images\Microfiber Cloths Set.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Set of 12 microfiber cloths'
  },
  {
    name: 'Window Cleaning Solution',
    description: 'Professional window cleaning solution',
    category: 'cleaning',
    price: 8.99,
    cost: 4.50,
    quantity: 30,
    unit: 'bottle',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0789',
      email: 'orders@cleanpro.com'
    },
    reorderLevel: 8,
    location: 'Warehouse C',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Streak-free window cleaning'
  },

  // Electrical Materials with unique images
  {
    name: 'Electrical Wire 12-gauge',
    description: 'Copper electrical wire, 12-gauge',
    category: 'electrical',
    price: 2.99,
    cost: 1.50,
    quantity: 100,
    unit: 'meter',
    supplier: {
      name: 'ElectroMax Supplies',
      contact: '+1-555-0456',
      email: 'sales@electromax.com'
    },
    reorderLevel: 25,
    location: 'Warehouse B',
    image: 'images\Electrical Wire 12-gauge.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard electrical wire'
  },
  {
    name: 'Circuit Breaker 20A',
    description: '20 Amp circuit breaker for electrical panels',
    category: 'electrical',
    price: 25.99,
    cost: 13.00,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'ElectroMax Supplies',
      contact: '+1-555-0456',
      email: 'sales@electromax.com'
    },
    reorderLevel: 8,
    location: 'Warehouse B',
    image: '\images\Circuit Breaker 20A.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard circuit protection'
  },
  {
    name: 'LED Light Bulbs Pack',
    description: 'Energy-efficient LED light bulbs, pack of 4',
    category: 'electrical',
    price: 24.99,
    cost: 12.50,
    quantity: 20,
    unit: 'pack',
    supplier: {
      name: 'ElectroMax Supplies',
      contact: '+1-555-0456',
      email: 'sales@electromax.com'
    },
    reorderLevel: 5,
    location: 'Warehouse B',
    image: '\images\Electrical Wire 12-gauge.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Energy-efficient LED bulbs'
  },

  // Plumbing Materials with unique images
  {
    name: 'PVC Pipe 2-inch',
    description: 'High-quality PVC pipe for plumbing installations, 2-inch diameter',
    category: 'plumbing',
    price: 15.99,
    cost: 8.50,
    quantity: 50,
    unit: 'piece',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 10,
    location: 'Warehouse A',
    image: '\images\PVC.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard plumbing pipe for residential use'
  },
  {
    name: 'Copper Fittings Set',
    description: 'Complete set of copper fittings for plumbing connections',
    category: 'plumbing',
    price: 45.99,
    cost: 22.00,
    quantity: 25,
    unit: 'set',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 5,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Includes various sizes and types of fittings'
  },
  {
    name: 'Pipe Wrench 14-inch',
    description: 'Professional pipe wrench for plumbing work',
    category: 'plumbing',
    price: 35.99,
    cost: 18.00,
    quantity: 15,
    unit: 'piece',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 5,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Professional pipe wrench'
  },

  // Garden Materials with unique images
  {
    name: 'Garden Soil Premium',
    description: 'Premium garden soil for plants and vegetables',
    category: 'garden',
    price: 12.99,
    cost: 6.50,
    quantity: 40,
    unit: 'bag',
    supplier: {
      name: 'GardenMax Supplies',
      contact: '+1-555-0987',
      email: 'sales@gardenmax.com'
    },
    reorderLevel: 10,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Rich soil for gardening'
  },
  {
    name: 'Fertilizer NPK 20-20-20',
    description: 'Balanced NPK fertilizer for all plants',
    category: 'garden',
    price: 18.99,
    cost: 9.50,
    quantity: 25,
    unit: 'bag',
    supplier: {
      name: 'GardenMax Supplies',
      contact: '+1-555-0987',
      email: 'sales@gardenmax.com'
    },
    reorderLevel: 6,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Balanced NPK fertilizer'
  },
  {
    name: 'Garden Hose 50ft',
    description: 'Heavy-duty garden hose with spray nozzle',
    category: 'garden',
    price: 35.99,
    cost: 18.00,
    quantity: 15,
    unit: 'piece',
    supplier: {
      name: 'GardenMax Supplies',
      contact: '+1-555-0987',
      email: 'sales@gardenmax.com'
    },
    reorderLevel: 4,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Professional garden hose with nozzle'
  },

  // General Materials with unique images
  {
    name: 'Safety Glasses',
    description: 'Protective safety glasses for work',
    category: 'general',
    price: 5.99,
    cost: 3.00,
    quantity: 50,
    unit: 'pair',
    supplier: {
      name: 'SafetyFirst Supplies',
      contact: '+1-555-0789',
      email: 'sales@safetyfirst.com'
    },
    reorderLevel: 12,
    location: 'Safety Storage',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'ANSI approved safety glasses'
  },
  {
    name: 'Work Gloves',
    description: 'Heavy-duty work gloves',
    category: 'general',
    price: 8.99,
    cost: 4.50,
    quantity: 40,
    unit: 'pair',
    supplier: {
      name: 'SafetyFirst Supplies',
      contact: '+1-555-0789',
      email: 'sales@safetyfirst.com'
    },
    reorderLevel: 10,
    location: 'Safety Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Cut-resistant work gloves'
  },
  {
    name: 'Measuring Tape 25ft',
    description: 'Professional measuring tape',
    category: 'general',
    price: 12.99,
    cost: 6.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'ToolMaster Supplies',
      contact: '+1-555-0321',
      email: 'sales@toolmaster.com'
    },
    reorderLevel: 6,
    location: 'Tool Storage',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: '25-foot professional measuring tape'
  }
];

const seedInventoryWithUniqueImages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-booking-app');
    console.log('Connected to MongoDB');

    // Clear existing inventory
    await Inventory.deleteMany({});
    console.log('Cleared existing inventory');

    // Find an admin user to set as createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Add createdBy field to all inventory items
    // Prefer local public images when available
    const imagesMap = loadPublicImagesMap();
    const inventoryWithImages = sampleInventory.map(item => {
      const best = pickBestImageForItem(item.name, imagesMap);
      const imagePath = best ? `/images/${best}` : item.image;
      return { ...item, image: imagePath && imagePath.replace(/\\/g, '/') };
    });

    const inventoryWithUser = inventoryWithImages.map(item => ({
      ...item,
      createdBy: adminUser._id
    }));

    // Insert sample inventory
    const result = await Inventory.insertMany(inventoryWithUser);
    console.log(`Successfully seeded ${result.length} inventory items with unique images`);

    // Display summary
    const categories = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    console.log('\nInventory Summary by Category:');
    categories.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} items`);
    });

    console.log('\n✅ Inventory seeding with unique images completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding inventory:', error);
    process.exit(1);
  }
};

// Run the seed function
seedInventoryWithUniqueImages();








