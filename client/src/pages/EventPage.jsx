import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AiFillCalendar } from "react-icons/ai";
import { MdLocationPin } from "react-icons/md";
import { FaCopy, FaWhatsappSquare, FaFacebook } from "react-icons/fa";

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  // Fetch event by ID
  useEffect(() => {
    if (!id) return;
    axios.get(`/event/${id}`)
      .then(response => setEvent(response.data))
      .catch(err => console.error("Error fetching event:", err));
  }, [id]);

  // Share functionalities
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'));
  };

  const handleWhatsAppShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`whatsapp://send?text=${url}`);
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 lg:p-24 animate-fade-in">
      <div className="w-full mx-auto max-w-7xl bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-12">
        
        {/* Event Image */}
        {event.image && (
          <div className="rounded-xl overflow-hidden mb-8 shadow-xl transform transition-transform duration-300 hover:scale-[1.01]">
            <img 
              // 🟢 FIX: Remove "/api/" from the image URL
              src={`http://localhost:4000${event.image}`} 
              alt={event.title} 
              className="w-full h-80 md:h-[500px] object-cover" 
              onError={(e) => {
                console.error('Image failed to load:', event.image);
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Header Section: Title & Book Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-700 pb-6 animate-slide-in-up">
          <div className="flex-grow">
            <h1 className="text-4xl md:text-6xl font-extrabold text-yellow-400 tracking-wide glow-text mb-2">
              {event.title ? event.title.toUpperCase() : 'Untitled Event'}
            </h1>
            <p className="text-lg text-gray-400 font-medium">
              <span className="text-white">Organized By:</span> {event.organizedBy || 'Unknown'}
            </p>
          </div>
          <Link to={`/event/${event._id}/ordersummary`} className="mt-4 md:mt-0 md:ml-6">
            <button className="w-full md:w-auto px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-xl shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105">
              Book Ticket
            </button>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          
          {/* Left Column: Description */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-3">Event Details</h2>
              <p className="text-gray-300 leading-relaxed">{event.description || 'No description available.'}</p>
            </div>
            
            {/* When and Where Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
              <h2 className="text-xl md:text-2xl font-bold mb-4">When and Where</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-700 rounded-full shadow-md">
                    <AiFillCalendar className="text-yellow-400 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Date & Time</h3>
                    <p className="text-gray-300">
                      Date: <span className="font-semibold">{event.eventDate ? event.eventDate.split("T")[0] : 'TBA'}</span>
                    </p>
                    <p className="text-gray-300">
                      Time: <span className="font-semibold">{event.eventTime || 'TBA'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-700 rounded-full shadow-md">
                    <MdLocationPin className="text-yellow-400 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Location</h3>
                    <p className="text-gray-300 font-semibold">{event.location || 'Location TBA'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Ticket Price & Share */}
          <div className="lg:col-span-1 flex flex-col justify-start space-y-8">
            {/* Ticket Price */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 text-center">
              <h3 className="text-lg md:text-xl font-bold text-gray-400 mb-2">Ticket Price</h3>
              <div className="text-4xl font-extrabold text-yellow-400">
                {event.ticketPrice === 0 || !event.ticketPrice ? 'FREE' : ` ${event.ticketPrice} TND`}
              </div>
            </div>
            
            {/* Share Buttons */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Share with Friends</h2>
              <div className="flex gap-6 justify-center md:justify-start">
                <button
                  onClick={handleCopyLink}
                  className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 transform hover:scale-110"
                  title="Copy Link"
                >
                  <FaCopy className="w-8 h-8" />
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="text-green-500 hover:text-green-400 transition-colors duration-200 transform hover:scale-110"
                  title="Share on WhatsApp"
                >
                  <FaWhatsappSquare className="w-8 h-8" />
                </button>
                <button
                  onClick={handleFacebookShare}
                  className="text-blue-600 hover:text-blue-500 transition-colors duration-200 transform hover:scale-110"
                  title="Share on Facebook"
                >
                  <FaFacebook className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}