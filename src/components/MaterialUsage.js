import React from 'react';

const MaterialUsage = ({ booking }) => {
  if (!booking) return null;

  const materials = booking.selectedInventory || [];
  const technician = booking.technician || null;

  const materialsTotal = materials.reduce((sum, it) => sum + (it.totalPrice || (it.price * it.quantity)), 0);

  return (
    <div className="space-y-3">
      {materials.length > 0 && (
        <div className="border rounded-lg">
          <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 text-sm font-semibold text-blue-900">
            Materials Used ({materials.length})
          </div>
          <div className="p-3 space-y-2">
            {materials.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover" />
                  )}
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-gray-500">x {item.quantity} {item.unit || 'pcs'}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  LKR {(item.totalPrice || (item.price * item.quantity)).toFixed(2)}
                </div>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Materials Total</span>
              <span className="text-sm font-bold text-gray-900">LKR {materialsTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg">
        <div className="px-3 py-2 bg-green-50 border-b border-green-200 text-sm font-semibold text-green-900">
          Technician
        </div>
        <div className="p-3 text-sm">
          {technician ? (
            <div>
              <div className="font-medium text-gray-900">{technician.username}</div>
              <div className="text-gray-700">{technician.email}</div>
              <div className="text-gray-700">{technician.mobile}</div>
            </div>
          ) : (
            <div className="text-yellow-800">Not assigned</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialUsage;







