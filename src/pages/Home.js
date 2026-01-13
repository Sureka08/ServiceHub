import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaTools,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaArrowRight,
  FaWrench,
  FaBolt,
  FaBroom,
  FaHammer,
  FaPaintBrush,
  FaSeedling
} from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();

  const services = [
    {
      icon: <FaWrench className="text-4xl text-blue-600" />,
      title: 'Plumbing',
      description: 'Expert plumbing services for all your home needs',
      category: 'plumbing'
    },
    {
      icon: <FaBolt className="text-4xl text-yellow-600" />,
      title: 'Electrical',
      description: 'Professional electrical work and repairs',
      category: 'electrician'
    },
    {
      icon: <FaBroom className="text-4xl text-green-600" />,
      title: 'Cleaning',
      description: 'Thorough cleaning services for your home',
      category: 'cleaning'
    },
    {
      icon: <FaHammer className="text-4xl text-orange-600" />,
      title: 'Carpentry',
      description: 'Quality carpentry and woodwork services',
      category: 'carpentry'
    },
    {
      icon: <FaPaintBrush className="text-4xl text-purple-600" />,
      title: 'Painting',
      description: 'Professional painting and finishing work',
      category: 'painting'
    },
    {
      icon: <FaSeedling className="text-4xl text-emerald-600" />,
      title: 'Gardening',
      description: 'Landscaping and garden maintenance',
      category: 'gardening'
    }
  ];

  const features = [
    {
      icon: <FaClock className="text-3xl text-primary-600" />,
      title: 'Quick Service',
      description: 'Fast response times and efficient service delivery'
    },
    {
      icon: <FaShieldAlt className="text-3xl text-primary-600" />,
      title: 'Verified Technicians',
      description: 'All technicians are background checked and certified'
    },
    {
      icon: <FaStar className="text-3xl text-primary-600" />,
      title: 'Quality Guarantee',
      description: 'Satisfaction guaranteed or we\'ll make it right'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Professional Home
              <span className="block">Services at Your</span>
              <span className="block">Fingertips</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Connect with verified technicians for all your home service needs. 
              From plumbing to electrical, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/book-service"
                  className="btn-hero-primary"
                >
                  Book a Service
                  <FaArrowRight className="ml-2" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-hero-primary"
                  >
                    Get Started
                    <FaArrowRight className="ml-2" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn-hero-secondary"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-10 rounded-full"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ServiceHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide reliable, professional home services with a focus on quality and customer satisfaction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  {feature.icon}
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
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional services for every corner of your home. Quality workmanship guaranteed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="card-hover group">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-50 transition-colors duration-200">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>
                  <Link
                    to={user ? `/book-service?category=${service.category}` : '/register'}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group-hover:translate-x-1 transition-transform duration-200"
                  >
                    Learn More
                    <FaArrowRight className="ml-2 text-sm" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/services"
              className="btn-services"
            >
              View All Services
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of satisfied customers who trust ServiceHub for their home service needs.
          </p>
          {user ? (
            <Link
              to="/book-service"
              className="btn-cta-primary"
            >
              Book Your First Service
              <FaArrowRight className="ml-2" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="btn-cta-primary"
            >
              Create Your Account
              <FaArrowRight className="ml-2" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
