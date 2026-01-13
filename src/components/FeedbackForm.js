import React, { useState } from 'react';
import { 
  FaStar, 
  FaRegStar,
  FaClock, 
  FaComments, 
  FaBroom, 
  FaHandshake, 
  FaDollarSign,
  FaUserSecret,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCheckCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const FeedbackForm = ({ booking, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    categories: [
      { category: 'quality', rating: 0 },
      { category: 'punctuality', rating: 0 },
      { category: 'communication', rating: 0 },
      { category: 'cleanliness', rating: 0 },
      { category: 'professionalism', rating: 0 },
      { category: 'value_for_money', rating: 0 }
    ],
    isAnonymous: false,
    isPublic: true
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add null check for booking after hooks
  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">No booking information available for feedback.</p>
          <button
            onClick={onCancel}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const categoryLabels = {
    quality: { label: 'Service Quality', icon: FaCheckCircle, color: 'text-blue-600' },
    punctuality: { label: 'Punctuality', icon: FaClock, color: 'text-green-600' },
    communication: { label: 'Communication', icon: FaComments, color: 'text-purple-600' },
    cleanliness: { label: 'Cleanliness', icon: FaBroom, color: 'text-orange-600' },
    professionalism: { label: 'Professionalism', icon: FaHandshake, color: 'text-indigo-600' },
    value_for_money: { label: 'Value for Money', icon: FaDollarSign, color: 'text-yellow-600' }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCategoryRatingChange = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.category === category ? { ...cat, rating } : cat
      )
    }));
  };

  const validateComment = (comment) => {
    const errors = {};
    
    if (comment.length > 1000) {
      errors.comment = 'Comment cannot exceed 1000 characters';
    }
    
    // Check for potentially inappropriate content (basic validation)
    const inappropriateWords = ['spam', 'fake', 'scam']; // Add more as needed
    const lowerComment = comment.toLowerCase();
    const foundInappropriate = inappropriateWords.some(word => lowerComment.includes(word));
    
    if (foundInappropriate) {
      errors.comment = 'Please provide constructive feedback';
    }
    
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validate comment in real-time
    if (name === 'comment') {
      const commentErrors = validateComment(value);
      setErrors(prev => ({
        ...prev,
        comment: commentErrors.comment
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    // Clear previous errors
    setErrors({});
    
    if (formData.rating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    // Validate comment
    const commentErrors = validateComment(formData.comment);
    if (commentErrors.comment) {
      setErrors(commentErrors);
      toast.error(commentErrors.comment);
      return;
    }

    // Validate that comment is not just whitespace if provided
    if (formData.comment.trim().length > 0 && formData.comment.trim().length < 10) {
      setErrors({ comment: 'Please provide more detailed feedback (at least 10 characters)' });
      toast.error('Please provide more detailed feedback (at least 10 characters)');
      return;
    }

    // Validate booking data
    if (!booking._id) {
      toast.error('Invalid booking information');
      return;
    }

    // Allow feedback even if technician is not assigned yet
    // if (!booking.technician?._id) {
    //   toast.error('This booking does not have a technician assigned yet. Please wait for technician assignment before providing feedback.');
    //   return;
    // }

    if (!booking.service?._id) {
      toast.error('Service information is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        bookingId: booking._id,
        technicianId: booking.technician?._id || null, // Allow null technician ID
        serviceId: booking.service._id
      });
      // Success notification is handled by the parent component
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to submit feedback. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, onRatingChange, hoveredRating, onHover) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const IconComponent = star <= (hoveredRating || rating) ? FaStar : FaRegStar;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => onHover && onHover(star)}
              onMouseLeave={() => onHover && onHover(0)}
              className={`text-2xl transition-colors duration-200 ${
                star <= (hoveredRating || rating) 
                  ? 'text-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            >
              <IconComponent />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Feedback</h2>
        <p className="text-gray-600">
          Help us improve by sharing your experience with {booking.technician?.username || 'the technician'}
        </p>
      </div>

      {/* Service Details */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Service Details</h3>
        {!booking.technician?._id && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ This booking does not have a technician assigned yet. You can still provide feedback, but it will be saved for when a technician is assigned.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Service:</span>
            <span className="ml-2 font-medium">{booking.service?.name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Technician:</span>
            <span className="ml-2 font-medium">
              {booking.technician?.username || 'Not assigned yet'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Date:</span>
            <span className="ml-2 font-medium">
              {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Cost:</span>
            <span className="ml-2 font-medium">LKR {booking.estimatedCost || 'N/A'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="form-group">
          <label className="form-label text-lg font-semibold">
            <FaStar className="mr-2 text-yellow-500" />
            Overall Rating *
          </label>
          <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            {renderStars(
              formData.rating, 
              handleRatingChange, 
              hoveredRating, 
              setHoveredRating
            )}
            <span className="text-sm font-medium text-gray-700">
              {formData.rating > 0 ? (
                <>
                  {formData.rating === 1 && 'Poor'}
                  {formData.rating === 2 && 'Fair'}
                  {formData.rating === 3 && 'Good'}
                  {formData.rating === 4 && 'Very Good'}
                  {formData.rating === 5 && 'Excellent'}
                </>
              ) : (
                <span className="text-red-500">Please select an overall rating</span>
              )}
            </span>
          </div>
          {formData.rating === 0 && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Overall rating is required to submit feedback
            </p>
          )}
        </div>

        {/* Category Ratings */}
        <div className="form-group">
          <label className="form-label">Detailed Ratings</label>
          <div className="space-y-4">
            {formData.categories.map((category) => {
              const categoryInfo = categoryLabels[category.category];
              const IconComponent = categoryInfo.icon;
              return (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`w-4 h-4 ${categoryInfo.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {categoryInfo.label}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCategoryRatingChange(category.category, star)}
                        className={`text-lg transition-colors duration-200 ${
                          star <= category.rating 
                            ? 'text-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comment */}
        <div className="form-group">
          <label htmlFor="comment" className="form-label">
            <FaComments className="mr-2" />
            Comments (Optional)
          </label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            className={`input ${errors.comment ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            rows="4"
            placeholder="Tell us about your experience..."
            maxLength="1000"
          />
          <div className="flex justify-between items-center mt-1">
            <div className="text-xs text-gray-500">
              {formData.comment.length}/1000 characters
            </div>
            {errors.comment && (
              <div className="text-xs text-red-500">
                {errors.comment}
              </div>
            )}
          </div>
          {formData.comment.length > 800 && (
            <div className="text-xs text-yellow-600 mt-1">
              ⚠️ Approaching character limit
            </div>
          )}
        </div>

        {/* Privacy Options */}
        <div className="form-group">
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex items-center space-x-2">
                <FaUserSecret className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Submit anonymously</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex items-center space-x-2">
                {formData.isPublic ? (
                  <FaEye className="w-4 h-4 text-green-500" />
                ) : (
                  <FaEyeSlash className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-700">
                  Make feedback public (visible to other customers)
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formData.rating === 0 || errors.comment || isSubmitting}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <FaCheckCircle className="w-4 h-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;








