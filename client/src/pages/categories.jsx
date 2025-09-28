import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [eventsByCategory, setEventsByCategory] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryConfig = [
    { value: 'Community', label: 'Community', icon: '👥' },
    { value: 'Networking & Development', label: 'Networking & Development', icon: '🌐' },
    { value: 'Engineering & Business', label: 'Engineering & Business', icon: '⚙️' },
    { value: 'Innovation & Cybersecurity', label: 'Innovation & Cybersecurity', icon: '🔒' },
    { value: 'Compliance & Emerging Technologies & Corporate', label: 'Compliance & Emerging Technologies & Corporate', icon: '🏢' },
    { value: 'Enterprise IT & Education', label: 'Enterprise IT & Education', icon: '💼' },
    { value: 'Research & Global Tech Trends', label: 'Research & Global Tech Trends', icon: '🔬' }
  ];

  useEffect(() => {
    const initializeCategories = async () => {
      try {
        setCategories(categoryConfig.map(cat => cat.value));
        
        const response = await axios.get('/events');
        const allEvents = response.data;
        
        const counts = {};
        categoryConfig.forEach(cat => {
          counts[cat.value] = allEvents.filter(event => event.category === cat.value).length;
        });
        
        setCategoryCounts(counts);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing categories:', error);
        setLoading(false);
      }
    };

    initializeCategories();
  }, []);

  const fetchEventsByCategory = async (category) => {
    console.log('Fetching events for category:', category);
    setLoading(true);
    setError(null);
    try {
      // CORRECTED ENDPOINT - using query parameter instead of path parameter
      const res = await axios.get(`/events?category=${encodeURIComponent(category)}`);
      
      setEventsByCategory(prev => ({
        ...prev,
        [category]: res.data
      }));
      setSelectedCategory(category);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(`Failed to load events for ${getCategoryLabel(category)}. Please try again.`);
      
      // Fallback to client-side filtering if the endpoint fails
      try {
        console.log('Trying fallback method...');
        const allEventsRes = await axios.get('/events');
        const filteredEvents = allEventsRes.data.filter(event => event.category === category);
        
        setEventsByCategory(prev => ({
          ...prev,
          [category]: filteredEvents
        }));
        setSelectedCategory(category);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component remains the same...
  const getCategoryLabel = (categoryValue) => {
    const category = categoryConfig.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getCategoryIcon = (categoryValue) => {
    const category = categoryConfig.find(cat => cat.value === categoryValue);
    return category ? category.icon : '📅';
  };

  const getEventCount = (categoryValue) => {
    return categoryCounts[categoryValue] || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.replace(/:00$/, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <header className="w-full bg-gray-900 p-4 flex justify-between items-center shadow-md fixed top-0 z-50">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-24" />
            <nav className="hidden md:flex gap-6 text-yellow-500 font-semibold">
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/">Actuality</Link>
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/categories">Categories</Link>
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/profile">Profil</Link>
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/createEvent">Create Event</Link>
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/wallet">Wallet</Link>
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/verification">Center</Link>
              <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/calendar">Calendar</Link>
            </nav>
          </div>
        </header>
        <div className="pt-32 flex items-center justify-center">
          <div className="text-xl">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="w-full bg-gray-900 p-4 flex justify-between items-center shadow-md fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-24" />
          <nav className="hidden md:flex gap-6 text-yellow-500 font-semibold">
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/">Actuality</Link>
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/categories">Categories</Link>
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/profile">Profil</Link>
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/createEvent">Create Event</Link>
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/wallet">Wallet</Link>
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/verification">Center</Link>
            <Link className="px-4 py-2 hover:bg-gray-100 rounded" to="/calendar">Calendar</Link>
          </nav>
        </div>
      </header>

      <div className="pt-24 px-2 sm:px-4 lg:px-6">
        <div className="max-w-8xl mx-auto">
          
          {!selectedCategory && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Event Categories</h1>
                <p className="text-gray-400">Browse events by category</p>
              </div>
              

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {categories.map(category => (
                  <div 
                    key={category}
                    onClick={() => fetchEventsByCategory(category)}
                    className="p-4 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-600 min-h-[100px] flex flex-col justify-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0">{getCategoryIcon(category)}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate" title={getCategoryLabel(category)}>
                          {getCategoryLabel(category)}
                        </h3>
                        <p className="text-xs opacity-75 mt-1">
                          {getEventCount(category)} event{getEventCount(category) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}


          {selectedCategory && (
            <div className="flex flex-col lg:flex-row gap-4">

              <div className="lg:w-1/5 xl:w-1/6">
                <div className="mb-4">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="w-full bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 mb-3 text-sm"
                  >
                    <span>←</span> All Categories
                  </button>
                  
                  <div className="p-3 bg-gray-800 rounded-lg mb-3 border-2 border-yellow-500">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl flex-shrink-0">{getCategoryIcon(selectedCategory)}</span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-sm truncate" title={getCategoryLabel(selectedCategory)}>
                          {getCategoryLabel(selectedCategory)}
                        </h2>
                        <p className="text-gray-400 text-xs">
                          {getEventCount(selectedCategory)} event{getEventCount(selectedCategory) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {categories.map(category => (
                    <div 
                      key={category}
                      onClick={() => fetchEventsByCategory(category)}
                      className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCategory === category 
                          ? 'bg-yellow-500 text-gray-900' 
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg flex-shrink-0">{getCategoryIcon(category)}</span>
                        <span className="font-medium text-xs truncate flex-1" title={getCategoryLabel(category)}>
                          {getCategoryLabel(category)}
                        </span>
                        <span className="ml-auto text-xs bg-black/20 px-1 py-0.5 rounded flex-shrink-0">
                          {getEventCount(category)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-4/5 xl:w-5/6">
                {error && (
                  <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                        <div className="w-full h-40 bg-gray-700"></div>
                        <div className="p-3">
                          <div className="h-5 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded mb-1"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : eventsByCategory[selectedCategory]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {eventsByCategory[selectedCategory].map(event => (
                      <Link key={event._id} to={`/event/${event._id}`} className="group">
                        <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-300 transform group-hover:scale-105 border border-gray-700 group-hover:border-yellow-500/50 h-full flex flex-col">
                          <div className="relative h-40 overflow-hidden flex-shrink-0">
                            <img 
                              src={event.image || 'https://via.placeholder.com/300x200/1f2937/6b7280?text=No+Image'} 
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x200/1f2937/6b7280?text=No+Image';
                              }}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="bg-yellow-500 text-gray-900 px-2 py-1 rounded text-xs font-bold">
                                ${event.ticketPrice || 0}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                👍 {event.likes || 0}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 flex-1 flex flex-col">
                            <h3 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors flex-1">
                              {event.title}
                            </h3>
                            
                            <div className="space-y-1 text-xs text-gray-300 mt-auto">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">📍</span>
                                <span className="line-clamp-1 truncate">{event.location || 'Location not specified'}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">📅</span>
                                <span className="truncate">{formatDate(event.eventDate)}</span>
                              </div>
                              
                              {event.eventTime && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-400">⏰</span>
                                  <span className="truncate">{formatTime(event.eventTime)}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">👤</span>
                                <span className="line-clamp-1 truncate">{event.organizedBy || 'Organizer not specified'}</span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <span className="inline-block bg-gray-700 text-yellow-400 px-2 py-1 rounded text-xs truncate w-full">
                                {event.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                    <div className="text-5xl mb-3">📅</div>
                    <h3 className="text-xl font-bold mb-2">No events yet</h3>
                    <p className="text-gray-400 mb-4 text-sm">Be the first to create an event in this category!</p>
                    <Link 
                      to="/createEvent" 
                      className="inline-flex items-center gap-2 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold text-sm"
                    >
                      <span>+</span> Create First Event
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}