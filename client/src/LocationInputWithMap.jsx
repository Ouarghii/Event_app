import React, { useState, useRef, useCallback } from 'react';
import { GoogleMap, useLoadScript, Autocomplete, Marker } from '@react-google-maps/api';

// Center the map around a default location (e.g., London)
const defaultCenter = { lat: 51.5074, lng: 0.1278 };
const libraries = ["places"]; // Required for Autocomplete

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
  marginTop: '1rem',
};

export default function LocationInputWithMap({ onPlaceSelect, defaultValue }) {
  const [markerPosition, setMarkerPosition] = useState(null);
  const [address, setAddress] = useState(defaultValue);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  // 1. Load the Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // 2. Map handlers
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    if (markerPosition) {
        map.panTo(markerPosition);
        map.setZoom(15);
    } else {
        map.setCenter(defaultCenter);
        map.setZoom(10);
    }
  }, [markerPosition]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // 3. Handle click on the map to set a marker
  const onMapClick = useCallback((event) => {
    const newPos = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setMarkerPosition(newPos);
    
    // Reverse Geocode the coordinates to get the address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: newPos }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const selectedAddress = results[0].formatted_address;
        setAddress(selectedAddress);
        onPlaceSelect({
          address: selectedAddress,
          lat: newPos.lat,
          lng: newPos.lng,
        });
      } else {
        setAddress(`Coordinates: ${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`);
        onPlaceSelect({
          address: '', // No formatted address found
          lat: newPos.lat,
          lng: newPos.lng,
        });
      }
    });
  }, [onPlaceSelect]);

  // 4. Handle selection from the Autocomplete dropdown
  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry || !place.geometry.location) {
      console.error("Place selection failed: No geometry information.");
      return;
    }

    const newPos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setMarkerPosition(newPos);
    mapRef.current.panTo(newPos);
    mapRef.current.setZoom(15);

    const selectedAddress = place.formatted_address;
    setAddress(selectedAddress);
    onPlaceSelect({
      address: selectedAddress,
      lat: newPos.lat,
      lng: newPos.lng,
    });
  };

  if (loadError) return <div className="text-red-500">Error loading maps. Check your API key.</div>;
  if (!isLoaded) return <div className="text-yellow-400">Loading Map...</div>;

  return (
    <div className="md:col-span-2">
      <label htmlFor="autocomplete" className="block text-sm font-medium text-gray-400 mb-2">
        Location (Search or Click on Map) *
      </label>
      
      {/* Autocomplete Input */}
      <Autocomplete
        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          type="text"
          id="autocomplete"
          placeholder="Start typing an address, city, or place..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400"
        />
      </Autocomplete>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
            disableDefaultUI: false,
            zoomControl: true,
            styles: [
                { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#d59563' }],
                },
                // Add more dark mode styles as needed
            ],
        }}
      >
        {markerPosition && <Marker position={markerPosition} />}
      </GoogleMap>
    </div>
  );
}