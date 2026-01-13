import React, { useState } from 'react';
import { FaStar, FaTimes, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const QuickFeedbackWidget = ({ booking, onFeedbackSubmitted, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateComment = (comment) => {
    if (comment.length > 500) {
      return 'Comment cannot exceed 500 characters';
    }
    
    if (comment.trim().length > 0 && comment.trim().length < 5) {
      return 'Please provide more detailed feedback (at least 5 characters)';
    }
    
    return '';
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);
    setCommentError(validateComment(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const commentValidationError = validateComment(comment);
    if (commentValidationError) {
      setCommentError(commentValidationError);
      toast.error(commentValidationError);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId: booking._id,
          technicianId: booking.technician._id,
          serviceId: booking.service._id,
          rating,
          comment: comment.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Feedback submitted successfully!');
        onFeedbackSubmitted && onFeedbackSubmitted(result.feedback);
        onClose && onClose();
      } else {
        toast.error(result.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex space-x-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-2xl transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Feedback</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Service Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">
              {booking.service?.name || 'Service'}
            </h4>
            <p className="text-sm text-gray-600">
              Technician: {booking.technician?.username || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              Completed: {new Date(booking.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              How would you rate this service?
            </label>
            {renderStars()}
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={handleCommentChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                commentError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="Tell us about your experience..."
              maxLength="500"
            />
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-500">
                {comment.length}/500
              </div>
              {commentError && (
                <div className="text-xs text-red-500">
                  {commentError}
                </div>
              )}
            </div>
            {comment.length > 400 && (
              <div className="text-xs text-yellow-600 mt-1">
                ⚠️ Approaching character limit
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || commentError || isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FaCheck className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickFeedbackWidget;