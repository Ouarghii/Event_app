/* eslint-disable react/jsx-key */
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsArrowRightShort } from "react-icons/bs";
import { BiLike } from "react-icons/bi";

export default function IndexPage() {
  const [events, setEvents] = useState([]);

  // Fetch events from the server
  useEffect(() => {
    axios
      .get("/createEvent")
      .then((response) => {
        console.log("Events data:", response.data); // Debug log
        setEvents(response.data);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, []);

  // Like Functionality - FIXED ENDPOINT
  const handleLike = (eventId) => {
    axios
      .post(`/event/${eventId}/like`) // 🟢 FIX: Added /like to endpoint
      .then((response) => {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === eventId ? { ...event, likes: event.likes + 1 } : event
          )
        );
        console.log("Like successful", response);
      })
      .catch((error) => {
        console.error("Error liking event:", error);
      });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white animate-fade-in">
      <div className="px-6 md:px-12 lg:px-24 py-8">
        {/* Main Header with All Events link */}
        <div className="flex justify-between items-center my-6">
          <h2 className="text-3xl font-bold text-white tracking-wide">
            À La Une
          </h2>

        </div>

        {/* Featured Events Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.length > 0 ? (
            events.map((event) => (
              <div
                className="bg-gray-900 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] transform group"
                key={event._id}
              >
                {/* Event Image Container */}
                <div className="relative aspect-video">
                  {event.image ? (
                    <img
                      // 🟢 FIX: Remove the extra slash - use the full path from backend
                      src={`http://localhost:4000${event.image}`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', event.image);
                        // Optional: Add a fallback image or hide the broken image
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                  <button
                    onClick={() => handleLike(event._id)}
                    className="absolute bottom-4 right-4 p-2 rounded-full bg-white text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110"
                    title="Like this event"
                  >
                    <BiLike className="w-6 h-6" />
                  </button>
                </div>

                {/* Event Details */}
                <div className="p-4 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h1 className="font-bold text-xl text-white">
                      {event.title ? event.title.toUpperCase() : 'Untitled Event'}
                    </h1>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <BiLike />
                      <span>{event.likes || 0}</span>
                    </div>
                  </div>

                  <div className="flex text-sm flex-wrap justify-between text-gray-400 mb-2">
                    <div>
                      {event.eventDate ? event.eventDate.split("T")[0] : 'Date TBA'}, {event.eventTime || 'Time TBA'}
                    </div>
                    <div>
                      {event.ticketPrice === 0 || !event.ticketPrice ? "Free" : "Rs. " + event.ticketPrice}
                    </div>
                  </div>

                  <div className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {event.description || 'No description available.'}
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div>
                      Organized By:{" "}
                      <span className="font-semibold text-gray-400">
                        {event.organizedBy || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      Created By:{" "}
                      <span className="font-semibold text-gray-400">
                        {event.owner ? event.owner.toUpperCase() : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={"/event/" + event._id}
                    className="flex justify-center"
                  >
                    <button className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-[1.01]">
                      Book Ticket
                    </button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">No events found</p>
            </div>
          )}
        </div>

        {/* Debug Section - Remove in production */}
        {events.length > 0 && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Debug Info (Remove in production):</h3>
            <p>Total events: {events.length}</p>
            <p>First event image path: {events[0]?.image}</p>
            <p>Full image URL: {events[0]?.image ? `http://localhost:4000${events[0].image}` : 'No image'}</p>
          </div>
        )}
      </div>
    </div>
  );
}