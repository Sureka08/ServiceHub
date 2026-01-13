import React, { useState } from 'react';
import { 
  FaStar, 
  FaThumbsUp, 
  FaFlag, 
  FaReply, 
  FaUser, 
  FaUserSecret,
  FaClock,
  FaComments,
  FaBroom,
  FaHandshake,
  FaDollarSign,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const FeedbackDisplay = ({ feedback, onHelpful, onReport, onReply, showActions = true }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const [reported, setReported] = useState(false);

  const categoryLabels = {
    quality: { label: 'Service Quality', icon: FaCheckCircle, color: 'text-blue-600' },
    punctuality: { label: 'Punctuality', icon: FaClock, color: 'text-green-600' },
    communication: { label: 'Communication', icon: FaComments, color: 'text-purple-600' },
    cleanliness: { label: 'Cleanliness', icon: FaBroom, color: 'text-orange-600' },
    professionalism: { label: 'Professionalism', icon: FaHandshake, color: 'text-indigo-600' },
    value_for_money: { label: 'Value for Money', icon: FaDollarSign, color: 'text-yellow-600' }
  };

  const renderStars = (rating, size = 'text-lg') => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${size} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-50';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleHelpful = async () => {
    if (helpfulClicked) return;
    
    try {
      await onHelpful(feedback._id);
      setHelpfulClicked(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error marking as helpful:', error);
      toast.error('Failed to mark as helpful');
    }
  };

  const handleReport = async () => {
    if (reported) return;
    
    if (!window.confirm('Are you sure you want to report this feedback?')) return;
    
    try {
      await onReport(feedback._id);
      setReported(true);
      toast.success('Feedback reported successfully');
    } catch (error) {
      console.error('Error reporting feedback:', error);
      toast.error('Failed to report feedback');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      hidden: { color: 'bg-gray-100 text-gray-800', label: 'Hidden' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            {feedback.isAnonymous ? (
              <FaUserSecret className="w-5 h-5 text-primary-600" />
            ) : (
              <FaUser className="w-5 h-5 text-primary-600" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">
                {feedback.isAnonymous ? 'Anonymous Customer' : feedback.houseOwner?.username}
              </h4>
            </div>
            <p className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            {renderStars(feedback.rating, 'text-sm')}
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRatingColor(feedback.rating)}`}>
              {feedback.rating}/5
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {feedback.service?.name} • {feedback.technician?.username || '⚠️ Needs Assignment'}
          </p>
        </div>
      </div>

      {/* Category Ratings */}
      {feedback.categories && feedback.categories.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Detailed Ratings</h5>
          <div className="grid grid-cols-2 gap-2">
            {feedback.categories.map((category) => {
              const categoryInfo = categoryLabels[category.category];
              const IconComponent = categoryInfo.icon;
              return (
                <div key={category.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <IconComponent className={`w-3 h-3 ${categoryInfo.color}`} />
                    <span className="text-gray-600">{categoryInfo.label}</span>
                  </div>
                  <div className="flex space-x-1">
                    {renderStars(category.rating, 'text-xs')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comment */}
      {feedback.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {feedback.comment.length > 200 && !showFullComment ? (
              <>
                {feedback.comment.substring(0, 200)}...
                <button
                  onClick={() => setShowFullComment(true)}
                  className="text-primary-600 hover:text-primary-700 ml-1 font-medium"
                >
                  Read more
                </button>
              </>
            ) : (
              <>
                {feedback.comment}
                {feedback.comment.length > 200 && showFullComment && (
                  <button
                    onClick={() => setShowFullComment(false)}
                    className="text-primary-600 hover:text-primary-700 ml-1 font-medium"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* Admin Response */}
      {feedback.adminResponse && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-center space-x-2 mb-2">
            <FaReply className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Admin Response {feedback.adminResponse.respondedBy?.username && `by ${feedback.adminResponse.respondedBy.username}`}
            </span>
            <span className="text-xs text-blue-600">
              {formatDate(feedback.adminResponse.respondedAt)}
            </span>
          </div>
          <p className="text-sm text-blue-800">{feedback.adminResponse.content}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleHelpful}
              disabled={helpfulClicked}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                helpfulClicked 
                  ? 'text-green-600' 
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              <FaThumbsUp className="w-4 h-4" />
              <span>
                {helpfulClicked ? 'Helpful' : 'Helpful'} 
                {feedback.helpfulCount > 0 && ` (${feedback.helpfulCount})`}
              </span>
            </button>
            
            <button
              onClick={handleReport}
              disabled={reported}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                reported 
                  ? 'text-red-600' 
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <FaFlag className="w-4 h-4" />
              <span>{reported ? 'Reported' : 'Report'}</span>
            </button>
          </div>

          {feedback.reportedCount > 0 && (
            <div className="flex items-center space-x-1 text-xs text-red-600">
              <FaExclamationTriangle className="w-3 h-3" />
              <span>{feedback.reportedCount} reports</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;








