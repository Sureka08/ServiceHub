import React from 'react';
import BackButton from '../components/BackButton';
import { 
  FaTools, 
  FaUsers, 
  FaShieldAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaCheckCircle
} from 'react-icons/fa';

const About = () => {
  const features = [
    {
      icon: FaTools,
      title: 'Professional Services',
      description: 'Connect with verified and skilled technicians for all your home service needs.'
    },
    {
      icon: FaShieldAlt,
      title: 'Quality Guaranteed',
      description: 'All our services come with quality assurance and customer satisfaction guarantee.'
    },
    {
      icon: FaClock,
      title: '24/7 Availability',
      description: 'Emergency services available round the clock to address urgent home issues.'
    },
    {
      icon: FaUsers,
      title: 'Expert Technicians',
      description: 'Our team consists of licensed and experienced professionals in their respective fields.'
    }
  ];

  const services = [
    'Plumbing & Water Systems',
    'Electrical Repairs & Installation',
    'Home Cleaning & Maintenance',
    'Carpentry & Woodwork',
    'Interior & Exterior Painting',
    'Garden & Landscape Services',
    'HVAC & Air Conditioning',
    'Appliance Repair & Maintenance'
  ];

  const stats = [
    { number: '500+', label: 'Happy Customers' },
    { number: '50+', label: 'Expert Technicians' },
    { number: '1000+', label: 'Services Completed' },
    { number: '4.9', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <BackButton fallbackPath="/" />
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FaTools className="text-white text-xl" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">About ServiceHub</h1>
            </div>
            <p className="text-xl md:text-2xl text-white text-opacity-90 max-w-3xl mx-auto">
              Your trusted partner for professional home services in Sri Lanka. 
              Connecting homeowners with verified technicians for quality service delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              To revolutionize home services in Sri Lanka by providing a seamless platform 
              that connects homeowners with skilled, verified technicians, ensuring quality, 
              reliability, and customer satisfaction in every service delivered.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ServiceHub?
            </h2>
            <p className="text-lg text-gray-600">
              We're committed to providing exceptional home services with unmatched quality and reliability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="text-primary-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive home services to meet all your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                <span className="text-gray-700 font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-white text-opacity-90">
              Numbers that speak for our commitment to excellence
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-white text-opacity-90">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Serving Sri Lanka
            </h2>
            <p className="text-lg text-gray-600">
              Based in Jaffna, we provide services across Sri Lanka
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FaMapMarkerAlt className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Our Location</h3>
                <p className="text-gray-600">Jaffna, Sri Lanka</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaPhone className="text-primary-600" />
                <span className="text-gray-700">+94 76 461 7927</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaEnvelope className="text-primary-600" />
                <span className="text-gray-700">support@servicehub.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust ServiceHub for their home service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/services"
              className="btn-primary inline-flex items-center justify-center px-8 py-3"
            >
              <FaTools className="mr-2" />
              Browse Services
            </a>
            <a
              href="/contact"
              className="btn-secondary inline-flex items-center justify-center px-8 py-3"
            >
              <FaEnvelope className="mr-2" />
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
