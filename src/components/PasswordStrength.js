import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const PasswordStrength = ({ password = '' }) => {
  // Password strength criteria
  const criteria = [
    {
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8,
      icon: FaCheck
    },
    {
      label: 'Contains uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd),
      icon: FaCheck
    },
    {
      label: 'Contains lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd),
      icon: FaCheck
    },
    {
      label: 'Contains number',
      test: (pwd) => /\d/.test(pwd),
      icon: FaCheck
    },
    {
      label: 'Contains special character',
      test: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
      icon: FaCheck
    }
  ];

  // Calculate strength score
  const getStrengthScore = (pwd) => {
    return criteria.reduce((score, criterion) => {
      return score + (criterion.test(pwd) ? 1 : 0);
    }, 0);
  };

  // Get strength level and color
  const getStrengthLevel = (score) => {
    if (score === 0) return { level: '', color: 'bg-gray-200', textColor: 'text-gray-500' };
    if (score <= 2) return { level: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score <= 3) return { level: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (score <= 4) return { level: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { level: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const score = getStrengthScore(password);
  const strength = getStrengthLevel(score);
  const percentage = (score / criteria.length) * 100;

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Password Strength:</span>
          <span className={`text-sm font-semibold ${strength.textColor}`}>
            {strength.level}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="space-y-1">
        {criteria.map((criterion, index) => {
          const isValid = criterion.test(password);
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                isValid ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isValid ? (
                  <FaCheck className="w-2.5 h-2.5 text-green-600" />
                ) : (
                  <FaTimes className="w-2.5 h-2.5 text-gray-400" />
                )}
              </div>
              <span className={`text-xs ${
                isValid ? 'text-green-700' : 'text-gray-500'
              }`}>
                {criterion.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Additional Tips */}
      {score < 3 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            💡 <strong>Tip:</strong> Use a combination of letters, numbers, and special characters for a stronger password.
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
