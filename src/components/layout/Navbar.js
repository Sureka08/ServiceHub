import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../NotificationBell';
import { 
  FaBars, 
  FaTimes, 
  FaUser, 
  FaCog, 
  FaSignOutAlt,
  FaHome,
  FaTools,
  FaClipboardList,
  FaBell
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMenus}>
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <FaTools className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gradient">ServiceHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
            >
              <FaHome className="text-sm" />
              <span>Home</span>
            </Link>
            
            <Link 
              to="/services" 
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
            >
              <FaTools className="text-sm" />
              <span>Services</span>
            </Link>

            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                >
                  <FaClipboardList className="text-sm" />
                  <span>Dashboard</span>
                </Link>

                {hasRole('house_owner') && (
                  <Link 
                    to="/book-service" 
                    className="text-gray-700 hover:text-primary-600 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <FaClipboardList className="text-sm" />
                    <span>Book Service</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu and Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative flex items-center space-x-3">
                {/* Notifications */}
                <NotificationBell />
                {/* User Menu Button */}
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <span className="hidden sm:block text-gray-700 font-medium">
                    {user.username}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]">
                    {/* Arrow indicator */}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                    
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      onClick={closeMenus}
                    >
                      <FaUser className="text-sm" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/notifications"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      onClick={closeMenus}
                    >
                      <FaBell className="text-sm" />
                      <span>Notifications</span>
                    </Link>

                    {hasRole('admin') && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={closeMenus}
                      >
                        <FaCog className="text-sm" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    {hasRole('technician') && (
                      <Link
                        to="/technician"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={closeMenus}
                      >
                        <FaCog className="text-sm" />
                        <span>Technician Panel</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <FaSignOutAlt className="text-sm" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}

                
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                onClick={closeMenus}
              >
                Home
              </Link>
              
              <Link
                to="/services"
                className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                onClick={closeMenus}
              >
                Services
              </Link>

              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                    onClick={closeMenus}
                  >
                    Dashboard
                  </Link>

                  {hasRole('house_owner') && (
                    <Link
                      to="/book-service"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={closeMenus}
                    >
                      Book Service
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                    onClick={closeMenus}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/notifications"
                    className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                    onClick={closeMenus}
                  >
                    Notifications
                  </Link>

                  {hasRole('admin') && (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={closeMenus}
                    >
                      Admin Panel
                    </Link>
                  )}

                  {hasRole('technician') && (
                    <Link
                      to="/technician"
                      className="text-gray-700 hover:text-primary-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={closeMenus}
                    >
                      Technician Panel
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(isMenuOpen || isUserMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeMenus}
        />
      )}
    </nav>
  );
};

export default Navbar;
