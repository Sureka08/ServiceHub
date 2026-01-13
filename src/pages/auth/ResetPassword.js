import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PasswordStrength from '../../components/PasswordStrength';
import { FaLock, FaSpinner, FaCheckCircle, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { email, code, user } = location.state || {};

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (!email || !code) {
      setMessage('Invalid reset session. Please request a new password reset.');
    }
  }, [email, code]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code, 
          password: data.password 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsSuccess(true);
        setMessage(result.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Password Reset Successfully!
            </h2>
            <p className="text-gray-600 mb-8">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to login page in 3 seconds...
            </p>
            <Link
              to="/login"
              className="btn-primary w-full flex items-center justify-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Get back into your account
          </h1>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-8">
            <span className="flex items-center">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-2">✓</span>
              verification step 1
            </span>
            <span className="text-gray-400"></span>
            <span className="text-primary-600 font-medium">choose a new password</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate('/verify-reset-code', { state: { email } })}
              className="flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Verification
            </button>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                * Enter new password:
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  validate: {
                    hasUppercase: (value) => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                    hasLowercase: (value) => /[a-z]/.test(value) || 'Password must contain at least one lowercase letter',
                    hasNumber: (value) => /\d/.test(value) || 'Password must contain at least one number',
                    hasSpecialChar: (value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value) || 'Password must contain at least one special character'
                  }
                })}
                className="input"
                placeholder="Enter new password"
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                * Confirm new password:
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className="input"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Error/Success Message */}
            {message && (
              <div className={`p-3 rounded-md ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading || !email || !code}
                className="btn-primary flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Resetting...
                  </>
                ) : (
                  'Finish'
                )}
              </button>
              
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


