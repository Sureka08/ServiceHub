const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Service = require('../models/Service');

// Sample services data
const sampleServices = [
  {
    name: 'Plumbing Repair',
    category: 'plumbing',
    description: 'Professional plumbing repair services including leak fixes, pipe repairs, faucet installation, and drain cleaning.',
    basePrice: 2500,
    estimatedDuration: '2-4 hours',
    features: ['24/7 Emergency Service', 'Licensed Plumbers', 'Warranty Included'],
    requirements: ['Access to water shut-off', 'Clear work area']
  },
  {
    name: 'Electrical Installation',
    category: 'electrician',
    description: 'Complete electrical services including wiring, outlet installation, lighting setup, and electrical troubleshooting.',
    basePrice: 3000,
    estimatedDuration: '3-5 hours',
    features: ['Certified Electricians', 'Safety Compliant', 'Code Adherence'],
    requirements: ['Power access', 'Clear work area']
  },
  {
    name: 'House Cleaning',
    category: 'cleaning',
    description: 'Comprehensive house cleaning services including deep cleaning, regular maintenance, and post-construction cleanup.',
    basePrice: 4000,
    estimatedDuration: '4-6 hours',
    features: ['Eco-friendly Products', 'Professional Equipment', 'Satisfaction Guaranteed'],
    requirements: ['Access to all rooms', 'Cleaning supplies provided']
  },
  {
    name: 'Carpentry Work',
    category: 'carpentry',
    description: 'Custom carpentry services including furniture repair, cabinet installation, door fitting, and woodwork.',
    basePrice: 2800,
    estimatedDuration: '3-6 hours',
    features: ['Custom Design', 'Quality Materials', 'Expert Craftsmanship'],
    requirements: ['Work space access', 'Material specifications']
  },
  {
    name: 'Interior Painting',
    category: 'painting',
    description: 'Professional interior painting services with color consultation, surface preparation, and clean application.',
    basePrice: 5000,
    estimatedDuration: '6-8 hours',
    features: ['Color Consultation', 'Surface Prep', 'Clean Application'],
    requirements: ['Furniture moved', 'Ventilation access']
  },
  {
    name: 'Garden Maintenance',
    category: 'gardening',
    description: 'Complete garden care including landscaping, plant maintenance, irrigation, and seasonal cleanup.',
    basePrice: 2200,
    estimatedDuration: '2-3 hours',
    features: ['Seasonal Care', 'Plant Health', 'Landscape Design'],
    requirements: ['Garden access', 'Water source']
  },
  {
    name: 'Appliance Repair',
    category: 'appliance_repair',
    description: 'Expert appliance repair services for refrigerators, washing machines, dishwashers, and other home appliances.',
    basePrice: 3200,
    estimatedDuration: '2-4 hours',
    features: ['Same Day Service', 'Parts Warranty', 'Expert Technicians'],
    requirements: ['Appliance access', 'Model information']
  },
  {
    name: 'HVAC Service',
    category: 'other',
    description: 'Heating, ventilation, and air conditioning services including installation, repair, and maintenance.',
    basePrice: 3700,
    estimatedDuration: '3-5 hours',
    features: ['24/7 Emergency', 'Energy Efficient', 'Professional Installation'],
    requirements: ['System access', 'Clear work area']
  },
  {
    name: 'Sri Lankan Home Maintenance',
    category: 'other',
    description: 'Complete home maintenance services tailored for Sri Lankan homes including roof repairs, water tank cleaning, and monsoon preparation.',
    basePrice: 2700,
    estimatedDuration: '4-6 hours',
    features: ['Monsoon Preparation', 'Local Expertise', 'Affordable Rates'],
    requirements: ['Home access', 'Clear work area']
  },
  {
    name: 'Water Tank Cleaning',
    category: 'cleaning',
    description: 'Professional water tank cleaning and maintenance services to ensure clean drinking water for your family.',
    basePrice: 2000,
    estimatedDuration: '2-3 hours',
    features: ['Safe Chemicals', 'Thorough Cleaning', 'Water Quality Check'],
    requirements: ['Tank access', 'Water shut-off']
  },
  {
    name: 'Generator Maintenance',
    category: 'appliance_repair',
    description: 'Generator servicing and maintenance for reliable power backup during Sri Lankan power cuts.',
    basePrice: 3400,
    estimatedDuration: '2-4 hours',
    features: ['Power Cut Ready', 'Fuel Efficiency', 'Regular Maintenance'],
    requirements: ['Generator access', 'Clear work area']
  },
  {
    name: 'AC Service & Repair',
    category: 'hvac',
    description: 'Professional air conditioning service and repair experts for all AC units including installation, maintenance, and emergency repairs.',
    basePrice: 4000,
    estimatedDuration: '2-4 hours',
    features: ['Expert Technicians', 'All AC Brands', 'Emergency Service', 'Warranty Included'],
    requirements: ['AC unit access', 'Clear work area']
  },
  {
    name: 'Bedroom Wall Painting',
    category: 'painting',
    description: 'Professional bedroom wall painting services with color consultation and premium quality paints for a perfect finish.',
    basePrice: 2700,
    estimatedDuration: '4-6 hours',
    features: ['Color Consultation', 'Premium Paints', 'Clean Application', 'Furniture Protection'],
    requirements: ['Furniture moved', 'Ventilation access']
  },
  {
    name: 'Kitchen Wall Painting',
    category: 'painting',
    description: 'Specialized kitchen wall painting with heat and moisture resistant paints for durability and easy cleaning.',
    basePrice: 3000,
    estimatedDuration: '4-6 hours',
    features: ['Heat Resistant Paint', 'Moisture Protection', 'Easy Clean Finish', 'Food Safe Materials'],
    requirements: ['Kitchen access', 'Appliance protection']
  },
  {
    name: 'Professional Carpenter',
    category: 'carpentry',
    description: 'Expert carpenter services for custom furniture, repairs, installations, and all woodworking needs.',
    basePrice: 3200,
    estimatedDuration: '3-8 hours',
    features: ['Custom Designs', 'Quality Materials', 'Expert Craftsmanship', 'Precision Work'],
    requirements: ['Work space access', 'Material specifications']
  },
  {
    name: 'Full Home Cleaning',
    category: 'cleaning',
    description: 'Comprehensive full home cleaning service including all rooms, deep cleaning, and move-in/move-out cleaning.',
    basePrice: 5000,
    estimatedDuration: '6-8 hours',
    features: ['Deep Cleaning', 'All Rooms Included', 'Eco-friendly Products', 'Move-in/Move-out Service'],
    requirements: ['Access to all rooms', 'Clear work area']
  },
  {
    name: 'Move-in Cleaning',
    category: 'cleaning',
    description: 'Complete move-in cleaning service to prepare your new home for a fresh start with thorough sanitization.',
    basePrice: 6000,
    estimatedDuration: '8-10 hours',
    features: ['Complete Sanitization', 'All Surfaces Cleaned', 'Fresh Start Guarantee', 'Professional Equipment'],
    requirements: ['Empty home access', 'All rooms available']
  },
  {
    name: 'Washing Machine Repair',
    category: 'appliance_repair',
    description: 'Expert washing machine repair services for all brands including front load, top load, and semi-automatic machines.',
    basePrice: 2900,
    estimatedDuration: '2-3 hours',
    features: ['All Brands Serviced', 'Same Day Repair', 'Parts Warranty', 'Expert Diagnosis'],
    requirements: ['Machine access', 'Model information']
  },
  {
    name: 'Sofa Cleaning',
    category: 'furniture_cleaning',
    description: 'Professional sofa cleaning service using advanced techniques to remove stains, odors, and deep-seated dirt.',
    basePrice: 2400,
    estimatedDuration: '2-3 hours',
    features: ['Deep Stain Removal', 'Odor Elimination', 'Fabric Protection', 'Professional Equipment'],
    requirements: ['Sofa access', 'Clear surrounding area']
  },
  {
    name: 'Carpet Cleaning',
    category: 'furniture_cleaning',
    description: 'Expert carpet cleaning service with steam cleaning and stain removal for all carpet types.',
    basePrice: 2000,
    estimatedDuration: '2-4 hours',
    features: ['Steam Cleaning', 'Stain Removal', 'All Carpet Types', 'Quick Drying'],
    requirements: ['Carpet access', 'Furniture moved']
  },
  {
    name: 'Full Home Painting',
    category: 'painting',
    description: 'Complete home painting service including interior and exterior painting with color consultation and premium materials.',
    basePrice: 10000,
    estimatedDuration: '2-3 days',
    features: ['Interior & Exterior', 'Color Consultation', 'Premium Materials', 'Complete Protection'],
    requirements: ['Home access', 'Furniture moved', 'Weather consideration']
  },
  {
    name: 'Bathroom Cleaning',
    category: 'cleaning',
    description: 'Deep bathroom cleaning service including tile scrubbing, grout cleaning, and sanitization for a hygienic space.',
    basePrice: 1700,
    estimatedDuration: '1-2 hours',
    features: ['Deep Sanitization', 'Grout Cleaning', 'Tile Scrubbing', 'Mold Prevention'],
    requirements: ['Bathroom access', 'Water supply']
  },
  {
    name: 'Furniture Deep Cleaning',
    category: 'furniture_cleaning',
    description: 'Comprehensive furniture deep cleaning service for all types of furniture including upholstery, wood, and leather.',
    basePrice: 3400,
    estimatedDuration: '3-4 hours',
    features: ['All Furniture Types', 'Deep Cleaning', 'Fabric Protection', 'Wood Treatment'],
    requirements: ['Furniture access', 'Clear work area']
  },
  {
    name: 'Exterior Wall Painting',
    category: 'painting',
    description: 'Professional exterior wall painting with weather-resistant paints for long-lasting protection against Sri Lankan climate.',
    basePrice: 4500,
    estimatedDuration: '6-8 hours',
    features: ['Weather Resistant Paint', 'UV Protection', 'Mold Prevention', 'Long Lasting Finish'],
    requirements: ['Exterior access', 'Weather consideration', 'Ladder access']
  },
  {
    name: 'Ceiling Painting',
    category: 'painting',
    description: 'Expert ceiling painting service including popcorn ceiling removal and smooth finish application.',
    basePrice: 2200,
    estimatedDuration: '3-4 hours',
    features: ['Popcorn Removal', 'Smooth Finish', 'Stain Coverage', 'Professional Tools'],
    requirements: ['Ceiling access', 'Furniture protection', 'Ventilation']
  },
  {
    name: 'Wood Painting & Varnishing',
    category: 'painting',
    description: 'Specialized wood painting and varnishing service for furniture, doors, windows, and wooden structures.',
    basePrice: 3500,
    estimatedDuration: '4-6 hours',
    features: ['Wood Preparation', 'Quality Varnish', 'Multiple Coats', 'Wood Protection'],
    requirements: ['Wood surface access', 'Clear work area', 'Ventilation']
  },
  {
    name: 'Metal Painting & Rust Protection',
    category: 'painting',
    description: 'Professional metal painting service with rust prevention and protection for gates, railings, and metal structures.',
    basePrice: 2800,
    estimatedDuration: '3-5 hours',
    features: ['Rust Prevention', 'Metal Primer', 'Durable Finish', 'Corrosion Protection'],
    requirements: ['Metal surface access', 'Clear work area', 'Weather consideration']
  },
  {
    name: 'Texture Painting',
    category: 'painting',
    description: 'Creative texture painting service including stucco, sponge, and decorative wall textures.',
    basePrice: 4000,
    estimatedDuration: '5-7 hours',
    features: ['Multiple Textures', 'Custom Designs', 'Professional Application', 'Unique Finishes'],
    requirements: ['Wall access', 'Design consultation', 'Clear work area']
  },
  {
    name: 'Waterproof Painting',
    category: 'painting',
    description: 'Specialized waterproof painting service for bathrooms, kitchens, and areas prone to moisture.',
    basePrice: 3200,
    estimatedDuration: '4-6 hours',
    features: ['Waterproof Coating', 'Mold Prevention', 'Moisture Protection', 'Long Lasting'],
    requirements: ['Area access', 'Water shut-off', 'Ventilation']
  },
  {
    name: 'Office & Commercial Painting',
    category: 'painting',
    description: 'Professional office and commercial space painting with business-appropriate colors and finishes.',
    basePrice: 6000,
    estimatedDuration: '8-12 hours',
    features: ['Business Colors', 'Professional Finish', 'Minimal Disruption', 'Quick Drying'],
    requirements: ['Office access', 'After hours work', 'Clear work area']
  },
  {
    name: 'Artistic & Mural Painting',
    category: 'painting',
    description: 'Creative artistic painting and mural services for decorative walls, children rooms, and custom designs.',
    basePrice: 8000,
    estimatedDuration: '2-3 days',
    features: ['Custom Designs', 'Artistic Skills', 'Color Consultation', 'Unique Artwork'],
    requirements: ['Wall access', 'Design approval', 'Extended time']
  },
  {
    name: 'Living Room Painting',
    category: 'painting',
    description: 'Specialized living room painting service with color consultation and premium finishes for the main gathering area.',
    basePrice: 3800,
    estimatedDuration: '5-7 hours',
    features: ['Color Consultation', 'Premium Paints', 'Furniture Protection', 'Family-Friendly'],
    requirements: ['Living room access', 'Furniture moved', 'Ventilation']
  },
  {
    name: 'Bathroom Painting',
    category: 'painting',
    description: 'Specialized bathroom painting with moisture-resistant paints and mold prevention for humid environments.',
    basePrice: 2500,
    estimatedDuration: '3-4 hours',
    features: ['Moisture Resistant', 'Mold Prevention', 'Quick Drying', 'Easy Clean'],
    requirements: ['Bathroom access', 'Water shut-off', 'Ventilation']
  },
  {
    name: 'Balcony & Terrace Painting',
    category: 'painting',
    description: 'Outdoor balcony and terrace painting with weather-resistant paints for outdoor living spaces.',
    basePrice: 3000,
    estimatedDuration: '4-5 hours',
    features: ['Weather Resistant', 'UV Protection', 'Outdoor Durability', 'Slip Resistant'],
    requirements: ['Balcony access', 'Weather consideration', 'Safety measures']
  }
];

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/service-booking-app';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedServices();
  })
  .then(() => {
    console.log('Services seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding services:', error);
    process.exit(1);
  });

async function seedServices() {
  try {
    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');

    // Insert sample services
    const insertedServices = await Service.insertMany(sampleServices);
    console.log(`Inserted ${insertedServices.length} services`);

    // Display inserted services
    insertedServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}): $${service.basePrice}`);
    });

  } catch (error) {
    console.error('Error in seedServices:', error);
    throw error;
  }
}













