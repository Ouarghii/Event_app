import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext';
// import logo from '../assets/logo.png'; // Assuming logo is used elsewhere

// Import MapTiler and Leaflet for the map
import * as maptilersdk from '@maptiler/sdk';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Leaflet library

// --- START: CORRECT Leaflet Icon Fix Block ---
// This is necessary because bundlers change the paths for Leaflet's default marker icons.
// **ENSURE YOU HAVE REMOVED ANY OTHER VERSION OF THIS FIX, especially the malformed line at L12.**
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// --- END: CORRECT Leaflet Icon Fix Block ---


// Set the MapTiler API Key
// !! IMPORTANT: Replace YOUR_MAPTILER_API_KEY with your actual key !!
maptilersdk.config.apiKey = 'tr4ZoswNfXjS2biB2deE';

/**
 * Utility function to geocode coordinates to a human-readable address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - The human-readable address
 */
const reverseGeocode = async (lat, lng) => {
  try {
    // FIX APPLIED: Coordinates must be passed as a single array: [lng, lat]
    const response = await maptilersdk.geocoding.reverse([lng, lat], {
        language: 'en',
    });
    
    // Use the primary label from the first feature
    if (response.features && response.features.length > 0) {
      return response.features[0].place_name || `${lat}, ${lng}`;
    }
    return `${lat}, ${lng}`; // Fallback to coordinates
  } catch (error) {
    // This logs the error including the 'position must be an array' message
    console.error("Error during reverse geocoding:", error);
    return `Error retrieving address for ${lat}, ${lng}`;
  }
};


/**
 * Map Component for selecting a location
 * @param {object} props
 * @param {function} props.onLocationSelect - Callback function (lat, lng, address)
 */
function LocationPickerMap({ onLocationSelect }) {
  const mapContainer = 'map-container';
  const initialCenter = [34.0, 9.0]; // Center of Tunisia, adjust as needed
  const initialZoom = 6;

  useEffect(() => {
    // Initialize the map
    const map = L.map(mapContainer, {
        center: initialCenter,
        zoom: initialZoom,
        scrollWheelZoom: false, // Optional: disable scroll wheel zoom
    });

    // Add MapTiler tile layer
    L.tileLayer(
  `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${maptilersdk.config.apiKey}`,
  {
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    tileSize: 512,
    zoomOffset: -1, // Adjust if using 512px tiles
  }
).addTo(map);

    // Initial marker (optional, centered on the initial view)
    const marker = L.marker(initialCenter, { draggable: true }).addTo(map);

    // Update location and geocode on marker drag end
    const updateLocation = async (latlng) => {
        const address = await reverseGeocode(latlng.lat, latlng.lng);
        onLocationSelect(latlng.lat, latlng.lng, address);
    };

    marker.on('dragend', (e) => {
        updateLocation(e.target.getLatLng());
    });

    // Handle map click to move the marker
    map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        updateLocation(e.latlng);
    });

    // Initial call to set the default location in the form data
    updateLocation(L.latLng(initialCenter[0], initialCenter[1]));

    // Cleanup function
    return () => {
        map.remove();
    };
  }, []); // Empty dependency array ensures this runs once after mounting

  return <div id={mapContainer} className="h-96 w-full rounded-lg shadow-inner border border-gray-700"></div>;
}


// Main Component
export default function AddEvent() {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState({
    owner: user ? user.name : "",
    title: "",
    optional: "",
    description: "",
    organizedBy: "",
    eventDate: "",
    eventTime: "",
    location: "", // Human-readable address
    ticketPrice: 0,
    category: ""
  });
  
  // New state for map coordinates
  const [mapLocation, setMapLocation] = useState({ lat: null, lng: null });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Category configuration
  const categories = [
    { value: 'Community', label: 'Community' },
    { value: 'Networking & Development', label: 'Networking & Development' },
    { value: 'Engineering & Business', label: 'Engineering & Business' },
    { value: 'Innovation & Cybersecurity', label: 'Innovation & Cybersecurity' },
    { value: 'Compliance & Emerging Technologies & Corporate', label: 'Compliance & Emerging Technologies & Corporate' },
    { value: 'Enterprise IT & Education', label: 'Enterprise IT & Education' },
    { value: 'Research & Global Tech Trends', label: 'Research & Global Tech Trends' }
  ];

  // Callback function from LocationPickerMap
  const handleLocationSelect = (lat, lng, address) => {
    setMapLocation({ lat, lng });
    setFormData((prevState) => ({ 
        ...prevState, 
        location: address 
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ 
      ...prevState, 
      [name]: name === 'ticketPrice' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });
      
      // Append coordinates explicitly for the backend
      if (mapLocation.lat !== null && mapLocation.lng !== null) {
        submitData.append('lat', mapLocation.lat);
        submitData.append('lng', mapLocation.lng);
      }

      // Append image file if exists
      if (image) {
        submitData.append('image', image);
      }

      // Validate required fields
      if (!formData.title || !formData.category || !formData.eventDate || !formData.location) {
        setMessage('Please fill in all required fields (including selecting a location on the map).');
        setLoading(false);
        return;
      }

      const response = await axios.post("/createEvent", submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Event posted successfully:", response.data);
      setMessage('Event created successfully!');
      
      // Reset form
      setFormData({
        owner: user ? user.name : "",
        title: "",
        optional: "",
        description: "",
        organizedBy: "",
        eventDate: "",
        eventTime: "",
        location: "",
        ticketPrice: 0,
        category: ""
      });
      setMapLocation({ lat: null, lng: null }); // Reset map location
      setImage(null);
      
      // Clear file input
      const fileInput = document.getElementById('image');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error posting event:", error);
      setMessage('Error creating event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-4xl bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-wider">Post an Event</h1>
          <p className="mt-2 text-gray-400">Bring your community together. Fill out the details below.</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-900/50 border border-green-700 text-green-200' 
              : 'bg-red-900/50 border border-red-700 text-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Text Inputs (excluding location) */}
          {[
            { label: "Event Title *", name: "title", type: "text", required: true },
            { label: "Optional Info", name: "optional", type: "text", required: false },
            { label: "Organized By *", name: "organizedBy", type: "text", required: true },
            { label: "Event Date *", name: "eventDate", type: "date", required: true },
            { label: "Event Time", name: "eventTime", type: "time", required: false },
            { label: "Ticket Price ($)", name: "ticketPrice", type: "number", required: false, min: 0 }
          ].map(({ label, name, type, required, min }) => (
            <div key={name} className="relative z-0 w-full group">
              <input
                type={type}
                name={name}
                id={name}
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer"
                placeholder=" "
                value={formData[name]}
                onChange={handleChange}
                required={required}
                min={min}
                step={type === 'number' ? '0.01' : undefined}
              />
              <label
                htmlFor={name}
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-400 peer-focus:scale-75 peer-focus:-translate-y-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2"
              >
                {label}
              </label>
            </div>
          ))}

          {/* Category Dropdown */}
          <div className="relative z-0 w-full group">
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" disabled hidden>Select Category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-gray-900 text-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <label
              htmlFor="category"
              className="absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-400 peer-focus:scale-75 peer-focus:-translate-y-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2"
            >
              Category *
            </label>
          </div>

          {/* Location Picker (Map replaces text input) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Event Location *
            </label>
            <LocationPickerMap onLocationSelect={handleLocationSelect} />
            
            {/* Display selected location address */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400">Selected Address:</p>
                <p className="text-white font-medium">{formData.location || 'Click or drag the marker on the map to select a location.'}</p>
                {mapLocation.lat && (
                    <p className="text-xs text-gray-500 mt-1">
                        Coords: {mapLocation.lat.toFixed(4)}, {mapLocation.lng.toFixed(4)}
                    </p>
                )}
            </div>
          </div>
          
          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              className="w-full p-4 text-white bg-gray-800 rounded-lg border border-gray-700 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow duration-300"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell people about your event..."
              required
            ></textarea>
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Event Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-300 group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-400 group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-400 group-hover:text-white">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-300">PNG, JPG, JPEG (MAX. 10MB)</p>
                  {image && (
                    <p className="text-xs text-yellow-400 mt-2">Selected: {image.name}</p>
                  )}
                </div>
                <input 
                  id="image" 
                  type="file" 
                  name="image" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            </div>
            {image && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Image Preview:</p>
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="rounded-lg w-full h-64 object-cover shadow-xl border border-gray-700"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating Event...' : 'Submit Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}