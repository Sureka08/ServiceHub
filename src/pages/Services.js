import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  FaWrench, 
  FaBolt, 
  FaBroom, 
  FaHammer, 
  FaPaintBrush, 
  FaSeedling,
  FaArrowRight,
  FaStar,
  FaSnowflake,
  FaHome,
  FaCouch,
  FaShower,
  FaTools,
  FaSearch
} from 'react-icons/fa';

const Services = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/services');
        if (response.data.success) {
          setServices(response.data.services);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        // Fallback to hardcoded services if API fails
        setServices(fallbackServices);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Fallback services if API fails
  const fallbackServices = [
    // Other Services
    {
      id: 1,
      name: 'Plumbing Services',
      category: 'plumbing',
      description: 'Professional plumbing services including repairs, installations, and maintenance.',
      icon: FaWrench,
      price: 'From LKR 2,500',
      rating: 4.8,
      reviews: 124,
      features: ['24/7 Emergency Service', 'Licensed Technicians', 'Warranty Included']
    },
    {
      id: 2,
      name: 'Electrical Services',
      category: 'electrician',
      description: 'Expert electrical work for residential and commercial properties.',
      icon: FaBolt,
      price: 'From LKR 3,000',
      rating: 4.9,
      reviews: 98,
      features: ['Safety Certified', 'Code Compliant', 'Emergency Repairs']
    },
    {
      id: 3,
      name: 'AC Service & Repair',
      category: 'hvac',
      description: 'Professional air conditioning service and repair experts for all AC units.',
      icon: FaSnowflake,
      price: 'From LKR 4,000',
      rating: 4.8,
      reviews: 89,
      features: ['Expert Technicians', 'All AC Brands', 'Emergency Service', 'Warranty Included']
    },
    
    // PAINTING SERVICES SECTION - All painting services grouped together
    {
      id: 4,
      name: 'Full Home Painting',
      category: 'painting',
      description: 'Complete home painting service including interior and exterior painting.',
      icon: FaPaintBrush,
      price: 'From LKR 10,000',
      rating: 4.8,
      reviews: 112,
      features: ['Interior & Exterior', 'Color Consultation', 'Premium Materials', 'Complete Protection']
    },
    {
      id: 5,
      name: 'Interior Painting',
      category: 'painting',
      description: 'Professional interior painting services with color consultation, surface preparation, and clean application.',
      icon: FaPaintBrush,
      price: 'From LKR 5,000',
      rating: 4.8,
      reviews: 95,
      features: ['Color Consultation', 'Surface Prep', 'Clean Application', 'Premium Paints']
    },
    {
      id: 6,
      name: 'Exterior Wall Painting',
      category: 'painting',
      description: 'Professional exterior wall painting with weather-resistant paints for Sri Lankan climate.',
      icon: FaPaintBrush,
      price: 'From LKR 4,500',
      rating: 4.6,
      reviews: 89,
      features: ['Weather Resistant Paint', 'UV Protection', 'Mold Prevention', 'Long Lasting Finish']
    },
    {
      id: 7,
      name: 'Bedroom Wall Painting',
      category: 'painting',
      description: 'Professional bedroom wall painting with color consultation and premium paints.',
      icon: FaPaintBrush,
      price: 'From LKR 2,700',
      rating: 4.7,
      reviews: 76,
      features: ['Color Consultation', 'Premium Paints', 'Clean Application', 'Furniture Protection']
    },
    {
      id: 8,
      name: 'Kitchen Wall Painting',
      category: 'painting',
      description: 'Specialized kitchen wall painting with heat and moisture resistant paints.',
      icon: FaPaintBrush,
      price: 'From LKR 3,000',
      rating: 4.8,
      reviews: 65,
      features: ['Heat Resistant Paint', 'Moisture Protection', 'Easy Clean Finish', 'Food Safe Materials']
    },
    {
      id: 9,
      name: 'Living Room Painting',
      category: 'painting',
      description: 'Specialized living room painting with color consultation and premium finishes.',
      icon: FaPaintBrush,
      price: 'From LKR 3,800',
      rating: 4.7,
      reviews: 58,
      features: ['Color Consultation', 'Premium Paints', 'Furniture Protection', 'Family-Friendly']
    },
    {
      id: 10,
      name: 'Bathroom Painting',
      category: 'painting',
      description: 'Specialized bathroom painting with moisture-resistant paints and mold prevention.',
      icon: FaPaintBrush,
      price: 'From LKR 2,500',
      rating: 4.6,
      reviews: 81,
      features: ['Moisture Resistant', 'Mold Prevention', 'Quick Drying', 'Easy Clean']
    },
    {
      id: 11,
      name: 'Ceiling Painting',
      category: 'painting',
      description: 'Expert ceiling painting service including popcorn ceiling removal and smooth finish.',
      icon: FaPaintBrush,
      price: 'From LKR 2,200',
      rating: 4.5,
      reviews: 67,
      features: ['Popcorn Removal', 'Smooth Finish', 'Stain Coverage', 'Professional Tools']
    },
    {
      id: 12,
      name: 'Balcony & Terrace Painting',
      category: 'painting',
      description: 'Outdoor balcony and terrace painting with weather-resistant paints for outdoor spaces.',
      icon: FaPaintBrush,
      price: 'From LKR 3,000',
      rating: 4.5,
      reviews: 47,
      features: ['Weather Resistant', 'UV Protection', 'Outdoor Durability', 'Slip Resistant']
    },
    {
      id: 13,
      name: 'Wood Painting & Varnishing',
      category: 'painting',
      description: 'Specialized wood painting and varnishing for furniture, doors, and wooden structures.',
      icon: FaPaintBrush,
      price: 'From LKR 3,500',
      rating: 4.7,
      reviews: 54,
      features: ['Wood Preparation', 'Quality Varnish', 'Multiple Coats', 'Wood Protection']
    },
    {
      id: 14,
      name: 'Metal Painting & Rust Protection',
      category: 'painting',
      description: 'Professional metal painting with rust prevention for gates, railings, and metal structures.',
      icon: FaPaintBrush,
      price: 'From LKR 2,800',
      rating: 4.6,
      reviews: 43,
      features: ['Rust Prevention', 'Metal Primer', 'Durable Finish', 'Corrosion Protection']
    },
    {
      id: 15,
      name: 'Waterproof Painting',
      category: 'painting',
      description: 'Specialized waterproof painting for bathrooms, kitchens, and moisture-prone areas.',
      icon: FaPaintBrush,
      price: 'From LKR 3,200',
      rating: 4.7,
      reviews: 72,
      features: ['Waterproof Coating', 'Mold Prevention', 'Moisture Protection', 'Long Lasting']
    },
    {
      id: 16,
      name: 'Texture Painting',
      category: 'painting',
      description: 'Creative texture painting service with stucco, sponge, and decorative wall textures.',
      icon: FaPaintBrush,
      price: 'From LKR 4,000',
      rating: 4.8,
      reviews: 38,
      features: ['Multiple Textures', 'Custom Designs', 'Professional Application', 'Unique Finishes']
    },
    {
      id: 17,
      name: 'Office & Commercial Painting',
      category: 'painting',
      description: 'Professional office and commercial space painting with business-appropriate colors.',
      icon: FaPaintBrush,
      price: 'From LKR 6,000',
      rating: 4.6,
      reviews: 29,
      features: ['Business Colors', 'Professional Finish', 'Minimal Disruption', 'Quick Drying']
    },
    {
      id: 18,
      name: 'Artistic & Mural Painting',
      category: 'painting',
      description: 'Creative artistic painting and mural services for decorative walls and custom designs.',
      icon: FaPaintBrush,
      price: 'From LKR 8,000',
      rating: 4.9,
      reviews: 25,
      features: ['Custom Designs', 'Artistic Skills', 'Color Consultation', 'Unique Artwork']
    },
    // OTHER SERVICES CONTINUE
    {
      id: 19,
      name: 'Professional Carpenter',
      category: 'carpentry',
      description: 'Expert carpenter services for custom furniture, repairs, and installations.',
      icon: FaHammer,
      price: 'From LKR 3,200',
      rating: 4.6,
      reviews: 87,
      features: ['Custom Designs', 'Quality Materials', 'Expert Craftsmanship', 'Precision Work']
    },
    {
      id: 20,
      name: 'Full Home Cleaning',
      category: 'cleaning',
      description: 'Comprehensive full home cleaning including all rooms and deep cleaning.',
      icon: FaBroom,
      price: 'From LKR 5,000',
      rating: 4.7,
      reviews: 156,
      features: ['Deep Cleaning', 'All Rooms Included', 'Eco-friendly Products', 'Move-in/Move-out Service']
    },
    {
      id: 21,
      name: 'Move-in Cleaning',
      category: 'cleaning',
      description: 'Complete move-in cleaning service to prepare your new home for a fresh start.',
      icon: FaHome,
      price: 'From LKR 6,000',
      rating: 4.8,
      reviews: 92,
      features: ['Complete Sanitization', 'All Surfaces Cleaned', 'Fresh Start Guarantee', 'Professional Equipment']
    },
    {
      id: 22,
      name: 'Washing Machine Repair',
      category: 'appliance_repair',
      description: 'Expert washing machine repair services for all brands and types.',
      icon: FaTools,
      price: 'From LKR 2,900',
      rating: 4.7,
      reviews: 134,
      features: ['All Brands Serviced', 'Same Day Repair', 'Parts Warranty', 'Expert Diagnosis']
    },
    {
      id: 23,
      name: 'Sofa Cleaning',
      category: 'furniture_cleaning',
      description: 'Professional sofa cleaning service to remove stains, odors, and deep-seated dirt.',
      icon: FaCouch,
      price: 'From LKR 2,400',
      rating: 4.6,
      reviews: 78,
      features: ['Deep Stain Removal', 'Odor Elimination', 'Fabric Protection', 'Professional Equipment']
    },
    {
      id: 24,
      name: 'Carpet Cleaning',
      category: 'furniture_cleaning',
      description: 'Expert carpet cleaning service with steam cleaning and stain removal.',
      icon: FaCouch,
      price: 'From LKR 2,000',
      rating: 4.7,
      reviews: 95,
      features: ['Steam Cleaning', 'Stain Removal', 'All Carpet Types', 'Quick Drying']
    },
    {
      id: 25,
      name: 'Bathroom Cleaning',
      category: 'cleaning',
      description: 'Deep bathroom cleaning including tile scrubbing, grout cleaning, and sanitization.',
      icon: FaShower,
      price: 'From LKR 1,700',
      rating: 4.6,
      reviews: 143,
      features: ['Deep Sanitization', 'Grout Cleaning', 'Tile Scrubbing', 'Mold Prevention']
    },
    {
      id: 26,
      name: 'Furniture Deep Cleaning',
      category: 'furniture_cleaning',
      description: 'Comprehensive furniture deep cleaning for all types including upholstery, wood, and leather.',
      icon: FaCouch,
      price: 'From LKR 3,400',
      rating: 4.7,
      reviews: 67,
      features: ['All Furniture Types', 'Deep Cleaning', 'Fabric Protection', 'Wood Treatment']
    },
    {
      id: 27,
      name: 'Gardening Services',
      category: 'gardening',
      description: 'Landscaping and garden maintenance for beautiful outdoor spaces.',
      icon: FaSeedling,
      price: 'From LKR 2,200',
      rating: 4.7,
      reviews: 93,
      features: ['Seasonal Maintenance', 'Plant Care', 'Design Services']
    }
  ];

  // Filter services based on category and search term
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional home services delivered by verified technicians. 
            Quality workmanship guaranteed for every project.
          </p>
        </div>

        {/* Service Category Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setSelectedCategory('painting')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
              selectedCategory === 'painting'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <FaPaintBrush className="w-4 h-4" />
            <span>Painting Services</span>
          </button>
          <button
            onClick={() => setSelectedCategory('cleaning')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
              selectedCategory === 'cleaning'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:text-green-600'
            }`}
          >
            <FaBroom className="w-4 h-4" />
            <span>Cleaning Services</span>
          </button>
          <button
            onClick={() => setSelectedCategory('carpentry')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
              selectedCategory === 'carpentry'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300 hover:text-orange-600'
            }`}
          >
            <FaHammer className="w-4 h-4" />
            <span>Carpentry Services</span>
          </button>
          <button
            onClick={() => setSelectedCategory('hvac')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 ${
              selectedCategory === 'hvac'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300 hover:text-cyan-600'
            }`}
          >
            <FaSnowflake className="w-4 h-4" />
            <span>AC & HVAC Services</span>
          </button>
        </div>

        {/* Category Header */}
        {selectedCategory === 'painting' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-blue-50 px-6 py-3 rounded-full">
              <FaPaintBrush className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-blue-800">Professional Painting Services</h2>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Transform your space with our comprehensive painting services. From interior walls to exterior protection, 
              we offer specialized solutions for every painting need in Sri Lankan homes.
            </p>
          </div>
        )}

        {selectedCategory === 'cleaning' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-green-50 px-6 py-3 rounded-full">
              <FaBroom className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-green-800">Professional Cleaning Services</h2>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Keep your home spotless with our comprehensive cleaning services. From deep cleaning to specialized 
              furniture care, we ensure your space is always fresh and hygienic.
            </p>
          </div>
        )}

        {selectedCategory === 'carpentry' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-orange-50 px-6 py-3 rounded-full">
              <FaHammer className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-orange-800">Expert Carpentry Services</h2>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Custom woodwork and precision carpentry for all your home improvement needs. 
              From furniture repair to custom installations, our skilled craftsmen deliver quality workmanship.
            </p>
          </div>
        )}

        {selectedCategory === 'hvac' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 bg-cyan-50 px-6 py-3 rounded-full">
              <FaSnowflake className="w-6 h-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-cyan-800">AC & HVAC Services</h2>
            </div>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Stay comfortable year-round with our professional air conditioning and HVAC services. 
              Expert installation, maintenance, and repair for all AC brands and systems.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
            <div key={service._id || service.id} className="card-hover group">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                  {service.icon ? (
                    <service.icon className="text-3xl text-primary-600" />
                  ) : (
                    <FaTools className="text-3xl text-primary-600" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(service.rating || 4.5)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {service.rating || 4.5} ({service.reviews || 0} reviews)
                </span>
              </div>

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {(service.features || ['Professional Service', 'Quality Work', 'Affordable Price']).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-primary-600">
                  {service.price || `From LKR ${service.basePrice || '2,500'}`}
                </span>
                {user ? (
                  <Link
                    to={`/book-service?service=${encodeURIComponent(service.name)}`}
                    className="btn-primary flex items-center space-x-2 group-hover:scale-105 transition-transform duration-200"
                  >
                    <span>Book Now</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="btn-primary flex items-center space-x-2 group-hover:scale-105 transition-transform duration-200"
                  >
                    <span>Get Started</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                )}
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTools className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-center mt-8 text-gray-600">
          Showing {filteredServices.length} of {services.length} services
          {selectedCategory !== 'all' && (
            <span className="ml-2 text-primary-600 font-medium">
              ({selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} category)
            </span>
          )}
          {searchTerm && (
            <span className="ml-2 text-blue-600 font-medium">
              (search: "{searchTerm}")
            </span>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="card bg-gradient-to-r from-primary-600 to-accent-600 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-100 mb-6">
              Join thousands of satisfied customers who trust our professional services.
            </p>
            {user ? (
              <Link
                to="/book-service"
                className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Book Your Service
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Services;
