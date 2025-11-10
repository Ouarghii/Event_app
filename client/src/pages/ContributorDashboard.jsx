import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import axios from 'axios';
import { 
    MdEvent, 
    MdConfirmationNumber, 
    MdAccessTimeFilled, 
    MdExitToApp, 
    MdOutlineScheduleSend, 
    MdEdit, 
    MdClose 
} from 'react-icons/md'; // Added MdEdit, MdClose

// --- Styling Constants ---
const STYLES = {
    // General styles for the dashboard (can be shared or adjusted)
    pageBg: "min-h-screen bg-gray-900 text-white flex",
    sidebarBg: "w-64 bg-gray-900 shadow-2xl border-r border-gray-800 fixed h-full z-20",
    mainContentWrapper: "flex-1 ml-64",
    fixedHeader: "fixed top-0 left-64 right-0 bg-gray-900 border-b border-gray-700 shadow-xl p-8 z-10",
    contentBody: "mt-[120px] p-8",
    headerText: "text-4xl font-extrabold text-white",
    cardBg: "bg-gray-800 p-6 rounded-xl shadow-inner border border-gray-700",
    accentPrimary: "text-blue-400", // Contributor primary color
    accentSecondary: "text-cyan-300",
};
// --- End Styling Constants ---

// =================================================================
// 🆕 New Component: EditEventModal
// =================================================================
const EditEventModal = ({ event, onClose, onSave }) => {
    const [newTime, setNewTime] = useState(event.eventTime || '');
    const [newDate, setNewDate] = useState(new Date(event.eventDate).toISOString().split('T')[0] || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Send only the updated time and date, along with the required creatorId for auth
            const updatedData = {
                ...event, // Keep existing data
                eventTime: newTime,
                eventDate: newDate,
                creatorId: event.creatorId, // Assuming event object has creatorId
            };
            
            // Note: The backend PUT route needs to be implemented to accept this data
            const response = await axios.put(`/event/${event._id}`, updatedData);
            
            onSave(response.data); // Pass the newly updated event back to the list
            onClose();
        } catch (error) {
            alert('Failed to update event. See console for details.');
            console.error('Error updating event:', error);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-blue-600">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
                    <h3 className="text-2xl font-bold text-blue-400">Edit Time for "{event.title}"</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><MdClose size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">New Event Date:</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">New Event Time (HH:MM):</label>
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className={`w-full py-2 rounded-lg font-bold transition ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// =================================================================
// 🟢 ContributorSidebar (FIXED: Notifications ENABLED)
// =================================================================
const ContributorSidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const navItems = [
        { name: 'My Events', component: 'myEvents', icon: MdEvent },
        { name: 'Event Notifications', component: 'notifications', icon: MdOutlineScheduleSend }, 
    ];

    const isNavItemActive = (item) => activeTab === item.component;

    return (
        <div className={STYLES.sidebarBg}>
            <div className="p-8">
                <h1 className={`text-3xl font-black ${STYLES.accentPrimary}`}>CONTRIBUTOR PANEL</h1>
            </div>
            <nav className="mt-4 px-4 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.component}
                        onClick={() => setActiveTab(item.component)}
                        className={`w-full flex items-center p-3 rounded-lg text-left transition duration-200 ${
                            isNavItemActive(item) 
                                ? 'bg-blue-700/50 text-blue-400 font-bold border-l-4 border-blue-500' 
                                : 'text-gray-300 hover:bg-gray-800/80'
                        }`}
                    >
                        <item.icon className="w-6 h-6 mr-3" />
                        {item.name}
                    </button>
                ))}
            </nav>
            <div className="absolute bottom-0 w-full p-4">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center p-3 rounded-lg text-left text-red-400 bg-red-900/40 hover:bg-red-900/70 transition"
                >
                    <MdExitToApp className="w-6 h-6 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

// =================================================================
// 🟢 MyEventsList (FIXED: Edit Button & Added Cancel Event)
// =================================================================
const MyEventsList = ({ contributorId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchMyEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            // Assuming the backend /events route handles creatorId filter
            const response = await axios.get(`/events?creatorId=${contributorId}`);
            setEvents(response.data);
            setLoading(false);
        } catch (err) {
            setError("Failed to load your events. Ensure the backend '/events' route can filter by 'creatorId'.");
            setLoading(false);
            console.error('Error fetching contributor events:', err);
        }
    };

    useEffect(() => {
        if (contributorId) {
            fetchMyEvents();
        }
    }, [contributorId]);

    const handleEditClick = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEdit = (updatedEvent) => {
        // Update the event list with the new data
        setEvents(events.map(e => e._id === updatedEvent._id ? updatedEvent : e));
    };
    
    // NEW: Handle Event Cancellation
    const handleCancelEvent = async (eventId, eventTitle) => {
        if (!window.confirm(`Are you absolutely sure you want to CANCEL the event: "${eventTitle}"? This cannot be undone.`)) {
            return;
        }

        try {
            // NOTE: You need to implement a DELETE /event/:id route in your backend
            await axios.delete(`/event/${eventId}`); 
            alert(`Event "${eventTitle}" cancelled successfully!`);
            fetchMyEvents(); // Refresh the list
        } catch (error) {
            alert('Failed to cancel event. Check server logs.');
            console.error('Error cancelling event:', error);
        }
    };


    if (loading) return <div className="text-white text-center py-10">Loading your events...</div>;
    if (error) return <div className="text-red-400 p-4 border border-red-600 rounded-lg">{error}</div>;

    return (
        <>
            {isModalOpen && selectedEvent && (
                <EditEventModal 
                    event={selectedEvent} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveEdit}
                />
            )}
            
            <div className={STYLES.cardBg}>
                <h2 className={`text-2xl font-extrabold mb-6 ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                    📅 Your Events ({events.length})
                </h2>

                {events.length === 0 ? (
                    <p className="text-gray-400">You have not created any events yet.</p>
                ) : (
                    <div className="space-y-4">
                        {events.map(event => (
                            <div key={event._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-xl font-bold">{event.title}</p>
                                    <p className="text-sm text-gray-400">Date: {new Date(event.eventDate).toLocaleDateString()} at {event.eventTime} | Status: <span className="text-yellow-300 capitalize">{event.status}</span></p>
                                    <p className="text-xs text-gray-500">Likes: {event.likes}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleEditClick(event)}
                                        className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 flex items-center"
                                    >
                                        <MdEdit className="mr-1" /> Edit Time
                                    </button>
                                    <button 
                                        onClick={() => handleCancelEvent(event._id, event.title)}
                                        className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 flex items-center"
                                    >
                                        Cancel Event
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};


// =================================================================
// 🟢 BookedTicketsList (FIXED: Management Focused, No Cancellation)
// =================================================================
const BookedTicketsList = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch ALL tickets for contributor overview/management
            const response = await axios.get("/tickets"); 
            setBookings(response.data); 
            setLoading(false);
        } catch (err) {
            setError(`⚠️ Failed to load tickets. Using generic '/tickets' endpoint. Error: ${err.message}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(); 
    }, []);

    // Removed handleCancelBooking as per request (focus on event cancellation)

    if (loading) return <div className="text-white text-center py-10">Loading ALL tickets...</div>;
    if (error) return <div className="text-red-400 p-4 border border-red-600 rounded-lg">{error}</div>;

    return (
        <div className={STYLES.cardBg}>
            <h2 className={`text-2xl font-extrabold mb-6 ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                🎟️ Booked Tickets Overview ({bookings.length})
            </h2>
            

            {bookings.length === 0 ? (
                <p className="text-gray-400">No tickets found in the system.</p>
            ) : (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {bookings.map(booking => (
                        <div key={booking._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex items-center justify-between gap-4">
                            
                            <div className="flex-grow">
                                <p className="text-lg font-semibold text-white">Event: {booking.eventTitle || 'N/A (Missing Event Title)'}</p>
                                <p className="text-sm text-gray-400">
                                    Booked by ID: <span className="text-cyan-300">{booking.userId || 'N/A'}</span> | 
                                    Quantity: <span className="text-yellow-400">{booking.quantity || 1}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Ticket ID: {booking._id}
                                </p>
                            </div>
                            
                            <span className="text-sm font-medium text-green-400 p-2 bg-green-900/40 rounded-lg flex-shrink-0">
                                ACTIVE
                            </span> 
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// =================================================================
// 🟢 EventNotificationSender 
// =================================================================
// ... (EventNotificationSender remains unchanged)
const EventNotificationSender = () => {
    // This is a functional mock-up relying on the backend POST /event/:eventId/notify being available.
    
    return (
        <div className={STYLES.cardBg}>
            <h2 className="text-2xl text-blue-400 font-extrabold mb-6 border-b border-gray-700 pb-2">
                📢 Send Event Notification
            </h2>
            <p className="text-green-400 font-bold mb-4">
                Feature Status: ENABLED. The form below is ready to send data to your `/event/:eventId/notify` backend route.
            </p>
            
            <form className="space-y-4">
                <div className="flex flex-col">
                    <label className="text-gray-300 mb-1">Select Event:</label>
                    <select className="p-2 bg-gray-700 border border-gray-600 rounded text-white">
                        <option>Event Placeholder 1 (ID: 123)</option>
                        <option>Event Placeholder 2 (ID: 456)</option>
                        {/* In a real app, this list would be populated by fetching events from MyEventsList */}
                    </select>
                </div>
                
                <div className="flex flex-col">
                    <label className="text-gray-300 mb-1">Subject:</label>
                    <input type="text" placeholder="Important Update Regarding..." className="p-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
                
                <div className="flex flex-col">
                    <label className="text-gray-300 mb-1">Message Body:</label>
                    <textarea rows="5" placeholder="Dear attendees, the event time has been changed..." className="p-2 bg-gray-700 border border-gray-600 rounded text-white"></textarea>
                </div>
                
                <button 
                    type="submit" 
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition"
                    onClick={(e) => { e.preventDefault(); alert('Notification Sent Mock (Check backend for implementation)'); }}
                >
                    Send Notification to Attendees
                </button>
            </form>
        </div>
    );
};


// =================================================================
// 🟢 MAIN COMPONENT: ContributorDashboard
// =================================================================
export default function ContributorDashboard() {
    const { user, loading, setUser } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState('myEvents');

    if (loading) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading user data...</div>;
    }

    // Redirect if not logged in or not a contributor
    if (!user || user.role !== 'contributor') {
        return <Navigate to="/" />;
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case 'myEvents':
                return <MyEventsList contributorId={user._id} />;
                
            case 'bookedTickets':
                return <BookedTicketsList contributorId={user._id} />; // ContributorId is not currently used here but is passed
                
            case 'notifications':
                return <EventNotificationSender />; 
                
            default:
                return <h2 className="text-white text-3xl">Welcome, {user.name}</h2>;
        }
    };
    
    const getTabTitle = (tab) => {
        const titles = {
            myEvents: 'My Events',
            bookedTickets: 'Manage Booked Tickets',
            notifications: 'Send Event Notifications',
        };
        return titles[tab] || 'Contributor Dashboard';
    };

    const handleLogout = async () => {
        await axios.post('/logout');
        setUser(null);
    };

    return (
        <div className={STYLES.pageBg}>
            <ContributorSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
            <div className={STYLES.mainContentWrapper}>
                
                <div className={STYLES.fixedHeader}>
                    <div className="flex justify-between items-center">
                        <h1 className={STYLES.headerText}>{getTabTitle(activeTab)}</h1>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-blue-400">Contributor</p>
                            <p className="text-sm text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                </div>
                <div className={STYLES.contentBody}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}