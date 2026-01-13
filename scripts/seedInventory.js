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
      .replace(/[^a-z0-9]+/g, ' ') // non-alnum to space
      .trim()
      .replace(/\s+/g, ' '); // collapse spaces

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
  // Exact normalized match
  if (imagesMap.has(name)) return imagesMap.get(name);

  // Try partial matches by words (prefer longest filenames)
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
  // ========================================
  // COMPREHENSIVE INVENTORY FOR ALL SERVICES
  // ========================================
  // Total Items: 55+ inventory items
  // Categories: Plumbing, Electrical, Cleaning, Carpentry, 
  //            Painting, Garden, HVAC, Appliance, General
  // ========================================
  
  // Plumbing Materials
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
    image: '/images/PVC.jpg',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard plumbing pipe for residential use'
  },
 
  {
    name: 'Pipe Wrench 14-inch',
    description: 'Professional grade pipe wrench for plumbing work',
    category: 'plumbing',
    price: 29.99,
    cost: 15.00,
    quantity: 15,
    unit: 'piece',
    supplier: {
      name: 'ToolMaster Inc',
      contact: '+1-555-0456',
      email: 'orders@toolmaster.com'
    },
    reorderLevel: 3,
    location: 'Tool Storage',
    image: '\images\Pipe Wrench 14-inch.jpg',
    expiryDate: new Date('2026-12-31'),
    notes: 'Heavy-duty wrench for professional use'
  },

  // Electrical Materials
  {
    name: 'Electrical Wire 12-gauge',
    description: 'Copper electrical wire, 12-gauge, 100ft roll',
    category: 'electrical',
    price: 89.99,
    cost: 45.00,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 5,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Suitable for residential electrical work'
  },
  {
    name: 'Circuit Breaker 20A',
    description: '20-amp circuit breaker for electrical panel',
    category: 'electrical',
    price: 12.99,
    cost: 6.50,
    quantity: 40,
    unit: 'piece',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 8,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard residential circuit breaker'
  },
  {
    name: 'LED Light Bulbs Pack',
    description: 'Energy-efficient LED bulbs, pack of 4',
    category: 'electrical',
    price: 19.99,
    cost: 10.00,
    quantity: 50,
    unit: 'pack',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 12,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: '60W equivalent, 800 lumens each'
  },
  {
    name: 'Electrical Outlet GFCI',
    description: 'Ground fault circuit interrupter outlet',
    category: 'electrical',
    price: 24.99,
    cost: 12.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 8,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Safety outlet for bathrooms and kitchens'
  },
  {
    name: 'Wire Connectors Assorted',
    description: 'Assorted wire connectors, pack of 100',
    category: 'electrical',
    price: 8.99,
    cost: 4.50,
    quantity: 60,
    unit: 'pack',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 15,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Various sizes for different wire gauges'
  },

  // Cleaning Materials
  {
    name: 'Multi-Surface Cleaner',
    description: 'Professional grade cleaner for all surfaces',
    category: 'cleaning',
    price: 18.99,
    cost: 9.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 8,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2024-06-30'),
    notes: 'Concentrated formula, dilute before use'
  },
  {
    name: 'Microfiber Cloths',
    description: 'Professional microfiber cleaning cloths, pack of 10',
    category: 'cleaning',
    price: 24.99,
    cost: 12.00,
    quantity: 25,
    unit: 'pack',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 5,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Reusable and washable cloths'
  },
  {
    name: 'Glass Cleaner Professional',
    description: 'Streak-free glass cleaner, 32oz bottles',
    category: 'cleaning',
    price: 12.99,
    cost: 6.50,
    quantity: 40,
    unit: 'piece',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 10,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Ammonia-free, safe for all glass surfaces'
  },
  {
    name: 'Floor Cleaner Concentrate',
    description: 'Heavy-duty floor cleaner concentrate, 1-gallon',
    category: 'cleaning',
    price: 28.99,
    cost: 14.50,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 5,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Dilutes to 32 gallons, removes tough stains'
  },
  {
    name: 'Disinfectant Wipes',
    description: 'Antibacterial disinfectant wipes, pack of 80',
    category: 'cleaning',
    price: 15.99,
    cost: 8.00,
    quantity: 35,
    unit: 'pack',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 8,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-06-30'),
    notes: 'Kills 99.9% of germs, safe for most surfaces'
  },

  // Carpentry Materials
  {
    name: 'Plywood Sheet 4x8',
    description: 'High-quality plywood sheet, 4x8 feet, 3/4 inch thickness',
    category: 'carpentry',
    price: 45.99,
    cost: 28.00,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0789',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 5,
    location: 'Wood Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Suitable for furniture and cabinet making'
  },
  {
    name: 'Wood Screws Assorted',
    description: 'Assorted wood screws, various sizes, pack of 100',
    category: 'carpentry',
    price: 12.99,
    cost: 6.50,
    quantity: 30,
    unit: 'pack',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0789',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 8,
    location: 'Fastener Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Includes #6, #8, and #10 sizes'
  },
  {
    name: 'Wood Glue 16oz',
    description: 'Professional wood glue, 16-ounce bottles',
    category: 'carpentry',
    price: 8.99,
    cost: 4.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0789',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 5,
    location: 'Adhesive Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-06-30'),
    notes: 'Fast-drying formula for wood joints'
  },
  {
    name: 'Cabinet Hinges Set',
    description: 'Concealed cabinet hinges, pack of 10 pairs',
    category: 'carpentry',
    price: 24.99,
    cost: 12.50,
    quantity: 15,
    unit: 'set',
    supplier: {
      name: 'Hardware Plus',
      contact: '+1-555-0456',
      email: 'orders@hardwareplus.com'
    },
    reorderLevel: 3,
    location: 'Hardware Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Soft-close mechanism, adjustable'
  },

  // Painting Materials
  {
    name: 'Interior Paint White',
    description: 'Premium interior paint, white, 1-gallon cans',
    category: 'painting',
    price: 34.99,
    cost: 17.50,
    quantity: 35,
    unit: 'piece',
    supplier: {
      name: 'PaintWorld',
      contact: '+1-555-0654',
      email: 'orders@paintworld.com'
    },
    reorderLevel: 8,
    location: 'Paint Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2024-12-31'),
    notes: 'Low-VOC formula, covers 400 sq ft per gallon'
  },
  {
    name: 'Paint Brushes Set',
    description: 'Professional paint brush set, various sizes',
    category: 'painting',
    price: 39.99,
    cost: 20.00,
    quantity: 20,
    unit: 'set',
    supplier: {
      name: 'PaintWorld',
      contact: '+1-555-0654',
      email: 'orders@paintworld.com'
    },
    reorderLevel: 5,
    location: 'Paint Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Includes 1-inch, 2-inch, and 3-inch brushes'
  },

  // Garden & Landscaping Materials
  {
    name: 'Garden Soil Premium',
    description: 'Premium garden soil mix, 50kg bags',
    category: 'garden',
    price: 24.99,
    cost: 12.50,
    quantity: 40,
    unit: 'piece',
    supplier: {
      name: 'GardenPro',
      contact: '+1-555-0321',
      email: 'orders@gardenpro.com'
    },
    reorderLevel: 8,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Rich organic soil for plants and flowers'
  },
  {
    name: 'Fertilizer NPK 20-20-20',
    description: 'Balanced NPK fertilizer, 25kg bags',
    category: 'garden',
    price: 34.99,
    cost: 17.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'GardenPro',
      contact: '+1-555-0321',
      email: 'orders@gardenpro.com'
    },
    reorderLevel: 5,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-06-30'),
    notes: 'Balanced nutrients for all plants'
  },
  {
    name: 'Garden Hose 50ft',
    description: 'Heavy-duty garden hose, 50 feet length',
    category: 'garden',
    price: 39.99,
    cost: 20.00,
    quantity: 15,
    unit: 'piece',
    supplier: {
      name: 'GardenPro',
      contact: '+1-555-0321',
      email: 'orders@gardenpro.com'
    },
    reorderLevel: 3,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'UV resistant, kink-free design'
  },

  // HVAC Materials
  {
    name: 'Air Filter 16x20x1',
    description: 'High-efficiency air filter, 16x20x1 inch',
    category: 'hvac',
    price: 18.99,
    cost: 9.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'HVAC Supplies Co',
      contact: '+1-555-0456',
      email: 'sales@hvacsupplies.com'
    },
    reorderLevel: 8,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'MERV 13 rating, captures allergens'
  },
  {
    name: 'Refrigerant R-410A',
    description: 'R-410A refrigerant, 25lb cylinders',
    category: 'hvac',
    price: 89.99,
    cost: 45.00,
    quantity: 10,
    unit: 'piece',
    supplier: {
      name: 'HVAC Supplies Co',
      contact: '+1-555-0456',
      email: 'sales@hvacsupplies.com'
    },
    reorderLevel: 2,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Environmentally friendly refrigerant'
  },
  {
    name: 'Thermostat Digital',
    description: 'Programmable digital thermostat',
    category: 'hvac',
    price: 79.99,
    cost: 40.00,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'HVAC Supplies Co',
      contact: '+1-555-0456',
      email: 'sales@hvacsupplies.com'
    },
    reorderLevel: 5,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: '7-day programming, energy saving'
  },

  // Appliance Repair Materials
  {
    name: 'Washing Machine Belt',
    description: 'Universal washing machine drive belt',
    category: 'appliance',
    price: 12.99,
    cost: 6.50,
    quantity: 35,
    unit: 'piece',
    supplier: {
      name: 'Appliance Parts Plus',
      contact: '+1-555-0789',
      email: 'parts@applianceparts.com'
    },
    reorderLevel: 8,
    location: 'Appliance Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Fits most top-load washers'
  },
  {
    name: 'Refrigerator Door Seal',
    description: 'Universal refrigerator door gasket',
    category: 'appliance',
    price: 29.99,
    cost: 15.00,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'Appliance Parts Plus',
      contact: '+1-555-0789',
      email: 'parts@applianceparts.com'
    },
    reorderLevel: 5,
    location: 'Appliance Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Flexible magnetic seal, easy installation'
  },
  {
    name: 'Dishwasher Pump Motor',
    description: 'Universal dishwasher pump motor assembly',
    category: 'appliance',
    price: 89.99,
    cost: 45.00,
    quantity: 15,
    unit: 'piece',
    supplier: {
      name: 'Appliance Parts Plus',
      contact: '+1-555-0789',
      email: 'parts@applianceparts.com'
    },
    reorderLevel: 3,
    location: 'Appliance Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'High-quality replacement motor'
  },

  // General Tools & Safety
  {
    name: 'Safety Glasses',
    description: 'Professional safety glasses with UV protection',
    category: 'general',
    price: 14.99,
    cost: 7.50,
    quantity: 60,
    unit: 'pair',
    supplier: {
      name: 'SafetyFirst',
      contact: '+1-555-0987',
      email: 'sales@safetyfirst.com'
    },
    reorderLevel: 15,
    location: 'Safety Equipment',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'ANSI Z87.1 certified safety glasses'
  },
  {
    name: 'Work Gloves',
    description: 'Heavy-duty work gloves, size L',
    category: 'general',
    price: 19.99,
    cost: 10.00,
    quantity: 45,
    unit: 'pair',
    supplier: {
      name: 'SafetyFirst',
      contact: '+1-555-0987',
      email: 'sales@safetyfirst.com'
    },
    reorderLevel: 10,
    location: 'Safety Equipment',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Leather palms with reinforced stitching'
  },
  {
    name: 'Hard Hat',
    description: 'Industrial hard hat with chin strap',
    category: 'general',
    price: 24.99,
    cost: 12.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'SafetyFirst',
      contact: '+1-555-0987',
      email: 'sales@safetyfirst.com'
    },
    reorderLevel: 8,
    location: 'Safety Equipment',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'ANSI Z89.1 certified, adjustable fit'
  },
  {
    name: 'Measuring Tape 25ft',
    description: 'Professional 25-foot measuring tape',
    category: 'general',
    price: 16.99,
    cost: 8.50,
    quantity: 40,
    unit: 'piece',
    supplier: {
      name: 'ToolMaster Inc',
      contact: '+1-555-0456',
      email: 'orders@toolmaster.com'
    },
    reorderLevel: 10,
    location: 'Tool Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Durable case, easy-to-read markings'
  },

  // Additional Plumbing Materials
  {
    name: 'PEX Pipe 1/2-inch',
    description: 'Flexible PEX pipe, 1/2-inch diameter, 100ft roll',
    category: 'plumbing',
    price: 65.99,
    cost: 33.00,
    quantity: 15,
    unit: 'piece',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 3,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Flexible for tight spaces, easy installation'
  },
  {
    name: 'Silicone Sealant',
    description: 'Professional silicone sealant, 10.1oz tubes',
    category: 'plumbing',
    price: 8.99,
    cost: 4.50,
    quantity: 50,
    unit: 'piece',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 15,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Waterproof, mold-resistant formula'
  },

  // Additional Electrical Materials
  {
    name: 'Electrical Panel 100A',
    description: '100-amp electrical service panel with breakers',
    category: 'electrical',
    price: 199.99,
    cost: 100.00,
    quantity: 8,
    unit: 'piece',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 2,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Main service panel for residential use'
  },
  {
    name: 'LED Strip Lights',
    description: 'Flexible LED strip lights, 16.4ft, RGB',
    category: 'electrical',
    price: 34.99,
    cost: 17.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'ElectroSupply Co',
      contact: '+1-555-0789',
      email: 'info@electrosupply.com'
    },
    reorderLevel: 8,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Remote controlled, adhesive backing'
  },

  // Additional Cleaning Materials
  {
    name: 'Steam Cleaner',
    description: 'Professional steam cleaner, 1500W',
    category: 'cleaning',
    price: 89.99,
    cost: 45.00,
    quantity: 12,
    unit: 'piece',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 3,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Chemical-free cleaning, sanitizes surfaces'
  },
  {
    name: 'Carpet Cleaner Solution',
    description: 'Professional carpet cleaning solution, 1-gallon',
    category: 'cleaning',
    price: 22.99,
    cost: 11.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0321',
      email: 'sales@cleanpro.com'
    },
    reorderLevel: 8,
    location: 'Cleaning Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Deep cleaning formula, removes tough stains'
  },

  // Additional Carpentry Materials
  {
    name: 'Oak Wood Boards',
    description: 'Premium oak wood boards, 1x6x8ft, pack of 5',
    category: 'carpentry',
    price: 89.99,
    cost: 45.00,
    quantity: 15,
    unit: 'pack',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0789',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 3,
    location: 'Wood Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'High-quality hardwood for furniture making'
  },
  {
    name: 'Router Bits Set',
    description: 'Professional router bits set, 15 pieces',
    category: 'carpentry',
    price: 49.99,
    cost: 25.00,
    quantity: 20,
    unit: 'set',
    supplier: {
      name: 'ToolMaster Inc',
      contact: '+1-555-0456',
      email: 'orders@toolmaster.com'
    },
    reorderLevel: 5,
    location: 'Tool Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Carbide tipped, various profiles'
  },

  // Additional Painting Materials
  {
    name: 'Paint Roller Set',
    description: 'Professional paint roller set with covers',
    category: 'painting',
    price: 24.99,
    cost: 12.50,
    quantity: 30,
    unit: 'set',
    supplier: {
      name: 'PaintWorld',
      contact: '+1-555-0654',
      email: 'orders@paintworld.com'
    },
    reorderLevel: 8,
    location: 'Paint Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Includes 9-inch roller and 3 covers'
  },
  {
    name: 'Paint Thinner',
    description: 'Professional paint thinner, 1-gallon cans',
    category: 'painting',
    price: 18.99,
    cost: 9.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'PaintWorld',
      contact: '+1-555-0654',
      email: 'orders@paintworld.com'
    },
    reorderLevel: 8,
    location: 'Paint Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'For cleaning brushes and thinning paint'
  },

  // Additional Garden Materials
  {
    name: 'Garden Pruners',
    description: 'Professional bypass pruners, 8-inch',
    category: 'garden',
    price: 29.99,
    cost: 15.00,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'GardenPro',
      contact: '+1-555-0321',
      email: 'orders@gardenpro.com'
    },
    reorderLevel: 5,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Sharp blades, comfortable grip'
  },
  {
    name: 'Garden Mulch',
    description: 'Premium garden mulch, 2 cubic feet bags',
    category: 'garden',
    price: 12.99,
    cost: 6.50,
    quantity: 50,
    unit: 'piece',
    supplier: {
      name: 'GardenPro',
      contact: '+1-555-0321',
      email: 'orders@gardenpro.com'
    },
    reorderLevel: 15,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Natural wood mulch, retains moisture'
  },

  // Additional HVAC Materials
  {
    name: 'Duct Tape',
    description: 'Professional duct tape, 60 yards',
    category: 'hvac',
    price: 12.99,
    cost: 6.50,
    quantity: 40,
    unit: 'piece',
    supplier: {
      name: 'HVAC Supplies Co',
      contact: '+1-555-0456',
      email: 'sales@hvacsupplies.com'
    },
    reorderLevel: 10,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Heat-resistant, strong adhesive'
  },
  {
    name: 'Copper Pipe 1/2-inch',
    description: 'Copper pipe for HVAC, 1/2-inch, 20ft',
    category: 'hvac',
    price: 45.99,
    cost: 23.00,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'HVAC Supplies Co',
      contact: '+1-555-0456',
      email: 'sales@hvacsupplies.com'
    },
    reorderLevel: 5,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'For refrigerant lines and connections'
  },

  // Additional Appliance Materials
  {
    name: 'Oven Heating Element',
    description: 'Universal oven heating element, 240V',
    category: 'appliance',
    price: 45.99,
    cost: 23.00,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'Appliance Parts Plus',
      contact: '+1-555-0789',
      email: 'parts@applianceparts.com'
    },
    reorderLevel: 5,
    location: 'Appliance Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Fits most standard electric ovens'
  },
  {
    name: 'Microwave Turntable',
    description: 'Universal microwave turntable, 12-inch',
    category: 'appliance',
    price: 19.99,
    cost: 10.00,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'Appliance Parts Plus',
      contact: '+1-555-0789',
      email: 'parts@applianceparts.com'
    },
    reorderLevel: 8,
    location: 'Appliance Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Replacement turntable for microwaves'
  },

  // Sri Lankan Specific Materials
  {
    name: 'Water Tank Cleaning Chemicals',
    description: 'Safe chemicals for water tank cleaning and disinfection',
    category: 'cleaning',
    price: 25.99,
    cost: 13.00,
    quantity: 20,
    unit: 'bottle',
    supplier: {
      name: 'Sri Lankan Water Solutions',
      contact: '+94-11-234-5678',
      email: 'info@slwatersolutions.lk'
    },
    reorderLevel: 5,
    location: 'Water Treatment Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Safe for drinking water tanks, removes algae and bacteria'
  },
  {
    name: 'Generator Oil 15W-40',
    description: 'High-quality engine oil for generators, 4-liter bottles',
    category: 'appliance',
    price: 35.99,
    cost: 18.00,
    quantity: 25,
    unit: 'bottle',
    supplier: {
      name: 'Sri Lankan Power Solutions',
      contact: '+94-11-345-6789',
      email: 'sales@slpowersolutions.lk'
    },
    reorderLevel: 8,
    location: 'Generator Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Suitable for diesel generators, extends engine life'
  },
  {
    name: 'Roof Waterproofing Compound',
    description: 'Waterproofing compound for Sri Lankan monsoon protection',
    category: 'general',
    price: 45.99,
    cost: 23.00,
    quantity: 15,
    unit: 'gallon',
    supplier: {
      name: 'Sri Lankan Building Supplies',
      contact: '+94-11-456-7890',
      email: 'orders@slbuildingsupplies.lk'
    },
    reorderLevel: 3,
    location: 'Building Materials Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Protects roofs from heavy monsoon rains'
  },
  {
    name: 'Coconut Coir Rope',
    description: 'Traditional coconut coir rope for various uses',
    category: 'general',
    price: 8.99,
    cost: 4.50,
    quantity: 50,
    unit: 'meter',
    supplier: {
      name: 'Sri Lankan Traditional Supplies',
      contact: '+94-11-567-8901',
      email: 'info@sltraditional.lk'
    },
    reorderLevel: 15,
    location: 'Traditional Materials Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2026-12-31'),
    notes: 'Natural fiber rope, eco-friendly and durable'
  },

  // ========================================
  // ADDITIONAL COMPREHENSIVE MATERIALS
  // ========================================
  // More materials for all service categories
  // ========================================

  // Additional Plumbing Materials
  {
    name: 'PVC Pipe 4-inch',
    description: 'Large diameter PVC pipe for main water lines',
    category: 'plumbing',
    price: 28.99,
    cost: 15.00,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 8,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'For main water supply lines'
  },
  {
    name: 'Flexible Hose 1/2 inch',
    description: 'Flexible water hose for connections',
    category: 'plumbing',
    price: 12.99,
    cost: 6.50,
    quantity: 40,
    unit: 'meter',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 10,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Flexible connection hose'
  },
  {
    name: 'Pipe Insulation Foam',
    description: 'Foam insulation for pipes to prevent freezing',
    category: 'plumbing',
    price: 8.99,
    cost: 4.50,
    quantity: 60,
    unit: 'meter',
    supplier: {
      name: 'PlumbPro Supplies',
      contact: '+1-555-0123',
      email: 'sales@plumbpro.com'
    },
    reorderLevel: 15,
    location: 'Warehouse A',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Pipe protection and insulation'
  },
  {
    name: 'Drain Snake 25ft',
    description: 'Professional drain cleaning snake',
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
    notes: 'For clearing blocked drains'
  },

  // Additional Electrical Materials
  {
    name: 'Electrical Conduit 1/2 inch',
    description: 'PVC electrical conduit for wire protection',
    category: 'electrical',
    price: 4.99,
    cost: 2.50,
    quantity: 100,
    unit: 'meter',
    supplier: {
      name: 'ElectroMax Supplies',
      contact: '+1-555-0456',
      email: 'sales@electromax.com'
    },
    reorderLevel: 20,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Wire protection conduit'
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
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard circuit protection'
  },
  {
    name: 'GFCI Outlet',
    description: 'Ground Fault Circuit Interrupter outlet',
    category: 'electrical',
    price: 18.99,
    cost: 9.50,
    quantity: 25,
    unit: 'piece',
    supplier: {
      name: 'ElectroMax Supplies',
      contact: '+1-555-0456',
      email: 'sales@electromax.com'
    },
    reorderLevel: 6,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Safety outlet for wet areas'
  },
  {
    name: 'Electrical Tape Black',
    description: 'High-quality electrical insulating tape',
    category: 'electrical',
    price: 3.99,
    cost: 2.00,
    quantity: 50,
    unit: 'roll',
    supplier: {
      name: 'ElectroMax Supplies',
      contact: '+1-555-0456',
      email: 'sales@electromax.com'
    },
    reorderLevel: 12,
    location: 'Warehouse B',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Electrical insulation tape'
  },

  // Additional Cleaning Materials
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Streak-free window cleaning'
  },
  {
    name: 'Floor Polish',
    description: 'High-gloss floor polish for various surfaces',
    category: 'cleaning',
    price: 12.99,
    cost: 6.50,
    quantity: 25,
    unit: 'bottle',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0789',
      email: 'orders@cleanpro.com'
    },
    reorderLevel: 6,
    location: 'Warehouse C',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Multi-surface floor polish'
  },
  {
    name: 'Disinfectant Spray',
    description: 'Antibacterial disinfectant spray',
    category: 'cleaning',
    price: 6.99,
    cost: 3.50,
    quantity: 40,
    unit: 'bottle',
    supplier: {
      name: 'CleanPro Solutions',
      contact: '+1-555-0789',
      email: 'orders@cleanpro.com'
    },
    reorderLevel: 10,
    location: 'Warehouse C',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Kills 99.9% of bacteria and viruses'
  },

  // Additional Carpentry Materials
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Box of 100 assorted screws'
  },
  {
    name: 'Wood Glue',
    description: 'Professional wood adhesive',
    category: 'carpentry',
    price: 8.99,
    cost: 4.50,
    quantity: 25,
    unit: 'bottle',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0321',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 6,
    location: 'Warehouse D',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Strong wood bonding adhesive'
  },
  {
    name: 'Sandpaper Assorted',
    description: 'Assorted grit sandpaper sheets',
    category: 'carpentry',
    price: 9.99,
    cost: 5.00,
    quantity: 35,
    unit: 'pack',
    supplier: {
      name: 'WoodCraft Supplies',
      contact: '+1-555-0321',
      email: 'sales@woodcraft.com'
    },
    reorderLevel: 8,
    location: 'Warehouse D',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Pack of 20 assorted grit sheets'
  },

  // Additional Painting Materials
  {
    name: 'Paint Roller Set',
    description: 'Professional paint roller set with various sizes',
    category: 'painting',
    price: 18.99,
    cost: 9.50,
    quantity: 20,
    unit: 'set',
    supplier: {
      name: 'PaintPro Supplies',
      contact: '+1-555-0654',
      email: 'sales@paintpro.com'
    },
    reorderLevel: 5,
    location: 'Warehouse E',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Set of 3 different roller sizes'
  },
  {
    name: 'Paint Tray',
    description: 'Professional paint tray with liner',
    category: 'painting',
    price: 6.99,
    cost: 3.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'PaintPro Supplies',
      contact: '+1-555-0654',
      email: 'sales@paintpro.com'
    },
    reorderLevel: 8,
    location: 'Warehouse E',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Disposable paint tray with liner'
  },
  {
    name: 'Paint Thinner',
    description: 'Professional paint thinner for cleanup',
    category: 'painting',
    price: 12.99,
    cost: 6.50,
    quantity: 25,
    unit: 'gallon',
    supplier: {
      name: 'PaintPro Supplies',
      contact: '+1-555-0654',
      email: 'sales@paintpro.com'
    },
    reorderLevel: 6,
    location: 'Warehouse E',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'For cleaning brushes and tools'
  },
  {
    name: 'Drop Cloth Canvas',
    description: 'Heavy-duty canvas drop cloth',
    category: 'painting',
    price: 15.99,
    cost: 8.00,
    quantity: 20,
    unit: 'piece',
    supplier: {
      name: 'PaintPro Supplies',
      contact: '+1-555-0654',
      email: 'sales@paintpro.com'
    },
    reorderLevel: 5,
    location: 'Warehouse E',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Reusable canvas drop cloth'
  },

  // Additional Garden Materials
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Professional garden hose with nozzle'
  },
  {
    name: 'Potting Soil',
    description: 'Premium potting soil for plants',
    category: 'garden',
    price: 8.99,
    cost: 4.50,
    quantity: 40,
    unit: 'bag',
    supplier: {
      name: 'GardenMax Supplies',
      contact: '+1-555-0987',
      email: 'sales@gardenmax.com'
    },
    reorderLevel: 10,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Rich potting soil for container plants'
  },
  {
    name: 'Plant Fertilizer',
    description: 'All-purpose plant fertilizer',
    category: 'garden',
    price: 12.99,
    cost: 6.50,
    quantity: 25,
    unit: 'bag',
    supplier: {
      name: 'GardenMax Supplies',
      contact: '+1-555-0987',
      email: 'sales@gardenmax.com'
    },
    reorderLevel: 6,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Balanced NPK fertilizer'
  },
  {
    name: 'Garden Pruning Shears',
    description: 'Professional pruning shears for garden maintenance',
    category: 'garden',
    price: 22.99,
    cost: 11.50,
    quantity: 20,
    unit: 'pair',
    supplier: {
      name: 'GardenMax Supplies',
      contact: '+1-555-0987',
      email: 'sales@gardenmax.com'
    },
    reorderLevel: 5,
    location: 'Garden Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Sharp pruning shears for trimming'
  },

  // Additional HVAC Materials
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard AC filter size'
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Modern refrigerant for AC systems'
  },
  {
    name: 'Duct Tape Silver',
    description: 'Heavy-duty duct tape for HVAC repairs',
    category: 'hvac',
    price: 6.99,
    cost: 3.50,
    quantity: 40,
    unit: 'roll',
    supplier: {
      name: 'HVAC Pro Supplies',
      contact: '+1-555-0123',
      email: 'sales@hvacpro.com'
    },
    reorderLevel: 10,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Heavy-duty sealing tape'
  },
  {
    name: 'Thermostat Wire',
    description: 'Low voltage thermostat wire',
    category: 'hvac',
    price: 2.99,
    cost: 1.50,
    quantity: 100,
    unit: 'meter',
    supplier: {
      name: 'HVAC Pro Supplies',
      contact: '+1-555-0123',
      email: 'sales@hvacpro.com'
    },
    reorderLevel: 25,
    location: 'HVAC Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'For thermostat connections'
  },

  // Additional Appliance Materials
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Various sizes for different appliances'
  },
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Safe for all appliance surfaces'
  },
  {
    name: 'Power Cord 6ft',
    description: 'Replacement power cord for appliances',
    category: 'appliance',
    price: 8.99,
    cost: 4.50,
    quantity: 30,
    unit: 'piece',
    supplier: {
      name: 'ApplianceParts Direct',
      contact: '+1-555-0456',
      email: 'sales@applianceparts.com'
    },
    reorderLevel: 8,
    location: 'Appliance Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Standard 6-foot power cord'
  },

  // Additional General Materials
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
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
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: '25-foot professional measuring tape'
  },
  {
    name: 'Utility Knife',
    description: 'Retractable utility knife with blades',
    category: 'general',
    price: 6.99,
    cost: 3.50,
    quantity: 35,
    unit: 'piece',
    supplier: {
      name: 'ToolMaster Supplies',
      contact: '+1-555-0321',
      email: 'sales@toolmaster.com'
    },
    reorderLevel: 8,
    location: 'Tool Storage',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    expiryDate: new Date('2025-12-31'),
    notes: 'Includes 5 replacement blades'
  }
];

const seedInventory = async () => {
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

    // Attach local public images when available
    const imagesMap = loadPublicImagesMap();
    const inventoryWithImages = sampleInventory.map(item => {
      const best = pickBestImageForItem(item.name, imagesMap);
      const imagePath = best ? `/images/${best}` : item.image;
      return { ...item, image: imagePath && imagePath.replace(/\\/g, '/') };
    });

    // Add createdBy field to all inventory items
    const inventoryWithUser = inventoryWithImages.map(item => ({
      ...item,
      createdBy: adminUser._id
    }));

    // Insert sample inventory
    const result = await Inventory.insertMany(inventoryWithUser);
    console.log(`Successfully seeded ${result.length} inventory items`);

    // Display summary
    const categories = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    console.log('\nInventory Summary by Category:');
    categories.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} items`);
    });

    console.log('\nInventory seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding inventory:', error);
    process.exit(1);
  }
};

// Run the seed function
seedInventory();
