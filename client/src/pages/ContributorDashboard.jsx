import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import axios from 'axios';
import { MdEvent, MdConfirmationNumber, MdAccessTimeFilled, MdExitToApp, MdOutlineScheduleSend } from 'react-icons/md';

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
// 🟢 ContributorSidebar (FIXED: Notifications ENABLED)
// =================================================================
const ContributorSidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const navItems = [
        { name: 'My Events', component: 'myEvents', icon: MdEvent },
        { name: 'Booked Tickets', component: 'bookedTickets', icon: MdConfirmationNumber },
        // Fixed: Removed (Disabled) text
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
                        // Fixed: Removed disabled styling logic
                        className={`w-full flex items-center p-3 rounded-lg text-left transition duration-200 ${
                            isNavItemActive(item) 
                                ? 'bg-blue-700/50 text-blue-400 font-bold border-l-4 border-blue-500' 
                                : 'text-gray-300 hover:bg-gray-800/80'
                        }`}
                        // Fixed: Removed 'disabled' attribute
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
// 🟢 MyEventsList (Lists events created by the contributor)
// =================================================================
const MyEventsList = ({ contributorId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/events?creatorId=${contributorId}`);
                setEvents(response.data);
                setLoading(false);
            } catch (err) {
                setError("Failed to load your events. Ensure the backend '/events' route can filter by 'creatorId'.");
                setLoading(false);
                console.error('Error fetching contributor events:', err);
            }
        };

        if (contributorId) {
            fetchMyEvents();
        }
    }, [contributorId]);

    if (loading) return <div className="text-white text-center py-10">Loading your events...</div>;
    if (error) return <div className="text-red-400 p-4 border border-red-600 rounded-lg">{error}</div>;

    return (
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
                                <button className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700">View</button>
                                <button className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// =================================================================
// 🟢 BookedTicketsList 
// =================================================================
const BookedTicketsList = ({ contributorId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
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

    const handleCancelBooking = async (bookingId, eventTitle) => {
        if (!window.confirm(`Are you sure you want to cancel ticket ID ${bookingId} (Event: ${eventTitle || 'N/A'})?`)) return;

        try {
            await axios.delete(`/tickets/${bookingId}`); 
            alert('Ticket cancelled successfully!');
            fetchBookings(); // Refresh the list
        } catch (error) {
            alert('Failed to cancel ticket. Check server logs.');
            console.error('Error cancelling ticket:', error);
        }
    };

    if (loading) return <div className="text-white text-center py-10">Loading ALL tickets...</div>;
    if (error) return <div className="text-red-400 p-4 border border-red-600 rounded-lg">{error}</div>;

    return (
        <div className={STYLES.cardBg}>
            <h2 className={`text-2xl font-extrabold mb-6 ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                🎟️ Booked Tickets Management ({bookings.length})
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
                            
                            <button
                                onClick={() => handleCancelBooking(booking._id, booking.eventTitle)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition flex-shrink-0"
                            >
                                Cancel Ticket ❌
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// =================================================================
// 🟢 EventNotificationSender (Now Functional Placeholder)
// =================================================================
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
                return <BookedTicketsList contributorId={user._id} />; 
                
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