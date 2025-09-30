// src/pages/AdminDashboard.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../UserContext'; // Adjust path if necessary
import axios from 'axios';

// =================================================================
// 🟢 NEW COMPONENT: Events Calendar View (Date-Grouped List)
// =================================================================
const EventsCalendarView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all events
        axios.get('/createEvent')
            .then(response => {
                setEvents(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching events:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-white">Loading events calendar...</div>;

    // Helper function to group events by date
    const groupEventsByDate = (eventList) => {
        const grouped = {};
        eventList.forEach(event => {
            // Use the eventDate field and format it for display/grouping
            const date = new Date(event.eventDate).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
        });
        return grouped;
    };

    const groupedEvents = groupEventsByDate(events);
    const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
            <h2 className="text-2xl font-extrabold mb-6 text-red-500 border-b border-gray-700 pb-2">📅 Events Calendar View ({events.length} Total)</h2>
            
            {events.length === 0 ? (
                <p className="text-gray-400">No events scheduled. Time to create one!</p>
            ) : (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {sortedDates.map(date => (
                        <div key={date} className="border-l-4 border-yellow-500 pl-4">
                            <h3 className="text-xl font-bold text-yellow-400 mb-2">{date}</h3>
                            <div className="space-y-3">
                                {groupedEvents[date].map(event => (
                                    <div key={event._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center hover:bg-gray-700 transition duration-200">
                                        <div>
                                            <p className="text-lg font-semibold text-white">{event.title}</p>
                                            <p className="text-sm text-gray-400">{event.eventTime} | {event.location}</p>
                                        </div>
                                        <span className="text-sm px-3 py-1 bg-red-600 rounded-full text-white">{event.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// =================================================================

// Placeholder components for the main content areas
// The previous EventsManagement placeholder is removed/replaced
const ContributorApproval = () => <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Approve New Contributors</h2>;
const PlatformOverview = () => <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Platform Overview & Metrics</h2>;

// 💡 Component for detailed event list (unchanged)
const EventListDetails = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/createEvent') 
            .then(response => {
                setEvents(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching events:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-white">Loading event data...</div>;
    
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold mb-4 text-yellow-500">All Events Details ({events.length})</h3>
            
            {events.length === 0 ? (
                <p className="text-gray-400">No events found in the system.</p>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {events.map(event => (
                        <div key={event._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition duration-300">
                            <p className="text-lg font-semibold text-white">{event.title}</p>
                            <p className="text-sm text-gray-400">Organized By: {event.organizedBy}</p>
                            <p className="text-sm text-gray-400">Category: {event.category}</p>
                            <p className="text-sm text-gray-400">Date: {new Date(event.eventDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-400">Location: {event.location}</p>
                            <p className="text-sm text-gray-400">Price: {event.ticketPrice > 0 ? `${event.ticketPrice} TND` : 'Free'}</p>
                            <p className="text-sm text-gray-400">Quantity: {event.Quantity}</p>
                            {/* Actions will go here (Edit/Delete buttons) */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


export default function AdminDashboard() {
    const { user, loading } = useContext(UserContext);
    // 🟢 FIX: Set initial tab to 'calendar'
    const [activeTab, setActiveTab] = useState('calendar'); 

    // Mappings for the tabs
    const tabComponents = {
        'overview': PlatformOverview,
        'calendar': EventsCalendarView, // 🟢 Calendar view component added here
        'contributors': ContributorApproval,
        'eventList': EventListDetails, 
    };

    const ActiveComponent = tabComponents[activeTab];

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading User Data...</div>;
    }

    // Security check is still removed as per previous request, but retained the fallback name
    const adminName = user?.name || 'Admin';

    // ----------------------------------------------------------------------
    // Main Dashboard Layout
    // ----------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-black text-white flex pt-8">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-gray-900 shadow-xl border-r border-gray-700 fixed h-full z-10">
                <div className="p-6">
                    <h1 className="text-3xl font-extrabold text-red-500 mb-8 border-b border-gray-700 pb-4">Admin Panel</h1>
                    <nav className="space-y-4">
                        <button 
                            onClick={() => setActiveTab('overview')} 
                            className={`w-full text-left p-3 rounded-lg font-medium transition duration-200 ${
                                activeTab === 'overview' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                            }`}
                        >
                            <span className="mr-2">📊</span> Platform Overview
                        </button>
                        <button 
                            // 🟢 Update: Use the new 'calendar' tab
                            onClick={() => setActiveTab('calendar')} 
                            className={`w-full text-left p-3 rounded-lg font-medium transition duration-200 ${
                                activeTab === 'calendar' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                            }`}
                        >
                            <span className="mr-2">📅</span> Events Calendar
                        </button>
                        <button 
                            onClick={() => setActiveTab('eventList')} 
                            className={`w-full text-left p-3 rounded-lg font-medium transition duration-200 ${
                                activeTab === 'eventList' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                            }`}
                        >
                            <span className="mr-2">📜</span> View Event Details
                        </button>
                        <button 
                            onClick={() => setActiveTab('contributors')} 
                            className={`w-full text-left p-3 rounded-lg font-medium transition duration-200 ${
                                activeTab === 'contributors' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                            }`}
                        >
                            <span className="mr-2">👥</span> Approve Contributors
                        </button>
                    </nav>
                </div>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-bold text-white">
                        Welcome, {adminName}!
                    </h1>
                    <p className="text-gray-400 mt-1">Manage all aspects of the Evento platform.</p>
                </header>
                
                {/* Dynamic Content Area */}
                <div className="bg-gray-900 p-6 rounded-xl shadow-2xl min-h-[70vh]">
                    <ActiveComponent />
                </div>
            </main>
        </div>
    );
}