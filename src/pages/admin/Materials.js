import React, { useEffect, useState } from 'react';
import { FaBox, FaClipboardList, FaSpinner, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import MaterialUsage from '../../components/MaterialUsage';

const Materials = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        // Get pending bookings for admin; could be extended to all statuses
        const res = await axios.get('/api/bookings/admin/pending');
        const withMaterials = (res.data.bookings || []).filter(b => b.selectedInventory && b.selectedInventory.length > 0);
        setBookings(withMaterials);
      } catch (e) {
        console.error('Error loading materials view', e);
        toast.error('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.service?.name?.toLowerCase().includes(s) ||
      b.houseOwner?.username?.toLowerCase().includes(s) ||
      b.selectedInventory.some(it => it.name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-900 font-bold text-xl">
          <FaBox className="mr-3 text-primary-600" />
          Materials Usage
        </div>
        <div className="relative w-full max-w-sm">
          <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings/materials..."
            className="input pr-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mr-3" />
          <span className="text-gray-600">Loading materials...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings with materials</h3>
          <p className="text-gray-600">Pending bookings with selected materials will appear here</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((booking) => (
            <div key={booking._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-gray-900">{booking.service?.name}</div>
                  <div className="text-sm text-gray-600">{new Date(booking.scheduledDate).toLocaleDateString()} • {booking.scheduledTime}</div>
                  <div className="text-sm text-gray-600">Customer: {booking.houseOwner?.username}</div>
                </div>
                <div className="text-sm text-gray-600 capitalize">Status: {booking.status}</div>
              </div>
              <MaterialUsage booking={booking} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Materials;


