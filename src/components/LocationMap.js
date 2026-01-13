import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt, FaCrosshairs, FaSearch, FaTimes, FaMap } from 'react-icons/fa';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

const LocationMap = ({ onLocationSelect, selectedLocation, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 6.9271, lng: 79.8612 }); // Default: Colombo, Sri Lanka
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef(null);

  // Popular cities in Sri Lanka
  const popularCities = [
    { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
    { name: 'Kandy', lat: 7.8731, lng: 80.7718 },
    { name: 'Galle', lat: 6.0535, lng: 80.2210 },
    { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
    { name: 'Chavakachcheri', lat: 9.6615, lng: 80.0255 },
    { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
    { name: 'Polonnaruwa', lat: 7.8731, lng: 80.7718 },
    { name: 'Trincomalee', lat: 8.5881, lng: 81.2155 },
    { name: 'Batticaloa', lat: 7.7167, lng: 81.7000 }
  ];

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const mapOptions = {
    zoom: 13,
    mapTypeId: 'roadmap', // Shows roads, buildings, etc.
    streetViewControl: true,
    mapTypeControl: true,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      }
    ]
  };

  const handleCitySelect = (city) => {
    setMapCenter({ lat: city.lat, lng: city.lng });
    onLocationSelect(city.lat, city.lng);
    setShowInfoWindow(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // Using Google Places API for better search results
      if (isApiKeyConfigured && window.google && window.google.maps) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { address: searchQuery + ', Sri Lanka' },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();
                setMapCenter({ lat, lng });
                onLocationSelect(lat, lng);
                setShowInfoWindow(true);
              } else {
                // Fallback to OpenStreetMap if Google fails
                fallbackSearch();
              }
              setSearching(false);
            }
          );
        } catch (googleError) {
          console.error('Google Maps error:', googleError);
          fallbackSearch();
          setSearching(false);
        }
      } else {
        // Fallback to OpenStreetMap if Google Maps not loaded
        fallbackSearch();
        setSearching(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      fallbackSearch();
      setSearching(false);
    }
  };

  const fallbackSearch = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Sri Lanka')}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Fallback search error:', error);
    }
  };

  const handleSearchResultSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCenter({ lat, lng });
    onLocationSelect(lat, lng);
    setSearchQuery('');
    setSearchResults([]);
    setShowInfoWindow(true);
  };

  const handleMapClick = (event) => {
    if (event && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onLocationSelect(lat, lng);
      setShowInfoWindow(true);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Validate if location is in Sri Lanka (approximate bounds)
          const isInSriLanka = latitude >= 5.9 && latitude <= 9.8 && 
                              longitude >= 79.6 && longitude <= 81.9;
          
          if (isInSriLanka) {
            // Location seems to be in Sri Lanka
            setMapCenter({ lat: latitude, lng: longitude });
            onLocationSelect(latitude, longitude);
            setShowInfoWindow(true);
            console.log('Location detected in Sri Lanka:', latitude, longitude);
          } else {
            // Location seems wrong, use Chavakachcheri as fallback
            console.warn('Detected location seems outside Sri Lanka, using Chavakachcheri as fallback');
            const chavakachcheri = { lat: 9.6615, lng: 80.0255 }; // Chavakachcheri coordinates
            setMapCenter(chavakachcheri);
            onLocationSelect(chavakachcheri.lat, chavakachcheri.lng);
            setShowInfoWindow(true);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to Chavakachcheri if geolocation fails
          const chavakachcheri = { lat: 9.6615, lng: 80.0255 };
          setMapCenter(chavakachcheri);
          onLocationSelect(chavakachcheri.lat, chavakachcheri.lng);
          setShowInfoWindow(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      // Fallback to Chavakachcheri if geolocation not supported
      const chavakachcheri = { lat: 9.6615, lng: 80.0255 };
      setMapCenter(chavakachcheri);
      onLocationSelect(chavakachcheri.lat, chavakachcheri.lng);
      setShowInfoWindow(true);
    }
  };

  const onMapLoad = (map) => {
    if (map) {
      mapRef.current = map;
      setMapLoading(false);
    }
  };

  // Check if API key is configured and valid
  const isApiKeyConfigured = GOOGLE_MAPS_API_KEY && 
    GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && 
    GOOGLE_MAPS_API_KEY.length > 10;

  // Debug: Log API key status
  console.log('Google Maps API Key configured:', isApiKeyConfigured);
  console.log('API Key:', GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Select Location</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Search and Cities */}
          <div className="w-80 border-r p-4 space-y-4">
            {/* Search */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Search Location</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a place..."
                  className="flex-1 input text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {searching ? '...' : <FaSearch />}
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {searchResults.map((result, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Cities */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Popular Cities</h4>
              <div className="grid grid-cols-2 gap-2">
                {popularCities.map((city) => (
                  <button
                    type="button"
                    key={city.name}
                    onClick={() => handleCitySelect(city)}
                    className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Location */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full flex items-center justify-center gap-2 p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                <FaCrosshairs />
                Use My Location
              </button>
              <button
                type="button"
                onClick={() => {
                  const chavakachcheri = { lat: 9.6615, lng: 80.0255 };
                  setMapCenter(chavakachcheri);
                  onLocationSelect(chavakachcheri.lat, chavakachcheri.lng);
                  setShowInfoWindow(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
              >
                <FaMapMarkerAlt />
                Set to Chavakachcheri
              </button>
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-900 mb-1">Selected Location</h4>
                <p className="text-sm text-blue-700">
                  Lat: {selectedLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm text-blue-700">
                  Lng: {selectedLocation.lng.toFixed(6)}
                </p>
                {(() => {
                  const isInSriLanka = selectedLocation.lat >= 5.9 && selectedLocation.lat <= 9.8 && 
                                      selectedLocation.lng >= 79.6 && selectedLocation.lng <= 81.9;
                  if (!isInSriLanka) {
                    return (
                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                        <p className="text-xs text-red-700">
                          ⚠️ Location seems outside Sri Lanka. Click "Set to Chavakachcheri" for correct location.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* Right Panel - Google Map */}
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg border-2 border-gray-300 overflow-hidden relative">
              {isApiKeyConfigured && typeof window !== 'undefined' ? (
                <LoadScript 
                  googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                  onError={(error) => {
                    console.error('Google Maps API Error:', error);
                  }}
                  onLoad={() => {
                    console.log('Google Maps API loaded successfully');
                  }}
                >
                  {mapLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    options={mapOptions}
                    onClick={handleMapClick}
                    onLoad={onMapLoad}
                    onError={(error) => {
                      console.error('Google Map Error:', error);
                    }}
                  >
                    {/* Selected Location Marker */}
                    {selectedLocation && (
                      <Marker
                        position={selectedLocation}
                        icon={{
                          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                          scaledSize: { width: 32, height: 32 }
                        }}
                      >
                        {showInfoWindow && (
                          <InfoWindow
                            position={selectedLocation}
                            onCloseClick={() => setShowInfoWindow(false)}
                          >
                            <div className="p-2">
                              <h4 className="font-medium text-gray-900">Selected Location</h4>
                              <p className="text-sm text-gray-600">
                                Lat: {selectedLocation.lat.toFixed(6)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Lng: {selectedLocation.lng.toFixed(6)}
                              </p>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    )}

                    {/* Popular Cities Markers */}
                    {popularCities.map((city) => (
                      <Marker
                        key={city.name}
                        position={city}
                        icon={{
                          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                          scaledSize: { width: 24, height: 24 }
                        }}
                        onClick={() => handleCitySelect(city)}
                      />
                    ))}
                  </GoogleMap>
                </LoadScript>
              ) : (
                <div className="h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FaMap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Google Maps Not Configured</h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      To see real roads and buildings, you need to configure Google Maps API key.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>✅ Popular cities selection works</p>
                      <p>✅ GPS location works</p>
                      <p>✅ Search with OpenStreetMap works</p>
                      <p>❌ Interactive map not available</p>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Quick Setup:</strong> Follow the guide in <code className="bg-blue-100 px-1 rounded">GOOGLE_MAPS_SETUP_GUIDE.md</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
