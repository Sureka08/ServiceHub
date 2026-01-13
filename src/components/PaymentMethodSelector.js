import React, { useState } from 'react';
import { 
  FaMoneyBillWave,
  FaCheckCircle
} from 'react-icons/fa';

const PaymentMethodSelector = ({ selectedMethod, onMethodSelect, totalAmount }) => {

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Cash on Service',
      icon: FaMoneyBillWave,
      description: 'Pay when service is completed',
      color: 'green',
      available: true
    }
  ];

  const handleMethodSelect = (methodId) => {
    onMethodSelect(methodId);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
      purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
    };
    return colorMap[color] || 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
  };

  const getSelectedColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-500 bg-blue-100 text-blue-800',
      green: 'border-green-500 bg-green-100 text-green-800',
      purple: 'border-purple-500 bg-purple-100 text-purple-800'
    };
    return colorMap[color] || 'border-gray-500 bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          const baseClasses = "flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200";
          const colorClasses = isSelected 
            ? getSelectedColorClasses(method.color)
            : getColorClasses(method.color);
          
          return (
            <div
              key={method.id}
              onClick={() => method.available && handleMethodSelect(method.id)}
              className={`${baseClasses} ${colorClasses} ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <IconComponent className="w-6 h-6" />
                <div className="flex-1">
                  <h3 className="font-medium">{method.name}</h3>
                  <p className="text-sm opacity-75">{method.description}</p>
                </div>
                {isSelected && (
                  <FaCheckCircle className="w-5 h-5" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cash Payment Info */}
      {selectedMethod === 'cash' && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <FaMoneyBillWave className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-medium text-green-900">Cash Payment</h3>
          </div>
          <p className="text-sm text-green-700">
            You will pay <strong>LKR {totalAmount.toFixed(2)}</strong> in cash when the service is completed.
            Our technician will collect the payment after finishing the work.
          </p>
        </div>
      )}

      {/* Payment Summary */}
      {selectedMethod && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Payment Summary</h3>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Total Amount:</span>
            <span className="font-semibold text-blue-900">LKR {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-blue-700">Payment Method:</span>
            <span className="text-blue-900">
              {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentMethodSelector;
