// src/pages/AdminDashboard.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../UserContext'; // Adjust path if necessary
import axios from 'axios';
// import logo from '../assets/logo.png'; // Assuming logo is not used in the final display

// --- Styling Constants ---
const STYLES = {
    // General styles for the dashboard
    pageBg: "min-h-screen bg-gray-900 text-white flex",
    // Sidebar: fixed, full height, offset for main content
    sidebarBg: "w-64 bg-gray-900 shadow-2xl border-r border-gray-800 fixed h-full z-20", // Increased z-index
    // Main Content wrapper: must have margin-left to push past the fixed sidebar
    mainContentWrapper: "flex-1 ml-64",
    // Header for Main Content: fixed to the top
    fixedHeader: "fixed top-0 left-64 right-0 bg-gray-900 border-b border-gray-700 shadow-xl p-8 z-10",
    // Content body: pushed down by the header and allowing vertical scroll
    contentBody: "mt-[120px] p-8", // Adjusted margin-top to clear the fixed header
    headerText: "text-4xl font-extrabold text-white",
    cardBg: "bg-gray-800 p-6 rounded-xl shadow-inner border border-gray-700",
    // Accent colors
    accentPrimary: "text-red-500", // Admin primary color
    accentSecondary: "text-yellow-400", // Secondary/Highlight color
};
// --- End Styling Constants ---

// =================================================================
// 🟢 NEW COMPONENT: PlatformStatistics (For Overview Tab)
// =================================================================
const StatCard = ({ title, value, color, icon }) => (
    <div className={`p-6 rounded-xl shadow-lg border border-gray-700 ${color} transition duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
        <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-gray-300">{title}</p>
            <span className="text-4xl">{icon}</span>
        </div>
        <p className={`text-5xl font-extrabold mt-4 ${color.replace('bg-', 'text-')}`}>{value}</p>
    </div>
);
const ContributorApproval = ({ refresh }) => {
    const [pendingContributors, setPendingContributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPendingContributors = () => {
        setLoading(true);
        setError(null);
        // 🚨 Fetch ONLY contributors where status is 'on_progress'
        // ASSUMPTION: Backend has a route '/pendingContributors' returning contributors with status 'on_progress'
        axios.get('/pendingContributors')
            .then(response => {
                setPendingContributors(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching pending contributors:", err.response ? err.response.data : err.message);
                setError("⚠️ Failed to load pending contributors from the server. Check the '/pendingContributors' endpoint.");
                setPendingContributors([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPendingContributors();
    }, [refresh]);

    // Function to handle contributor approval/rejection
    const handleStatusUpdate = async (contributorId, newStatus, contributorName) => {
        const action = newStatus === 'accepted' ? 'accept' : 'decline';
        const message = newStatus === 'accepted' 
            ? `Are you sure you want to accept the contributor "${contributorName}"?`
            : `Are you sure you want to DECLINE the contributor "${contributorName}"? Declining deletes the request.`;
            
        if (!window.confirm(message)) return;

        try {
            if (newStatus === 'accepted') {
                // Endpoint to update the contributor's status to 'accepted'
                // ASSUMPTION: Backend PUT /contributors/:id/status updates the status field
                await axios.put(`/contributors/${contributorId}/status`, { status: 'accepted' });
                alert(`Contributor "${contributorName}" accepted successfully!`);
            } else {
                // OPTIONAL: Delete the contributor entirely upon rejection. 
                // A better approach might be to set status to 'declined' and keep the record.
                // For simplicity, we'll delete the 'on_progress' record here.
                await axios.delete(`/contributors/${contributorId}`); 
                alert(`Contributor "${contributorName}" declined and deleted successfully!`);
            }
            
            fetchPendingContributors(); // Refresh the list
        } catch (error) {
            alert(`Failed to ${action} contributor. Check server logs and permissions.`);
            console.error(`Error processing contributor ${action}:`, error);
        }
    };

    if (loading) return <div className="text-white text-center py-10">Loading pending contributors...</div>;
    if (error) return <div className="text-red-400 text-center py-10 p-4 border border-red-600 rounded-lg">{error}</div>;


    return (
        <div className={STYLES.cardBg}>
            <h2 className={`text-2xl font-extrabold mb-6 ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                👥 Pending Contributor Approval ({pendingContributors.length})
            </h2>

            {pendingContributors.length === 0 ? (
                <p className="text-gray-400">✅ No new contributor applications awaiting approval!</p>
            ) : (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {pendingContributors.map(contributor => (
                        <div key={contributor._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition duration-300 flex items-center justify-between gap-4">
                            
                            {/* CONTRIBUTOR DETAILS */}
                            <div className="flex items-center gap-4 flex-grow">
                                <span className="text-4xl text-yellow-400">👤</span>
                                <div>
                                    <p className="text-lg font-semibold text-white">{contributor.name}</p>
                                    <p className="text-sm text-gray-400">
                                        Email: <span className="text-yellow-400">{contributor.email}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Applied On: {new Date(contributor.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2 flex-shrink-0">
                                <button
                                    onClick={() => handleStatusUpdate(contributor._id, 'accepted', contributor.name)}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                                >
                                    Approve ✅
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(contributor._id, 'declined', contributor.name)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                                >
                                    Decline ❌
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const PlatformStatistics = ({ refreshKey }) => {
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalUsers: 0,
        pendingEvents: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🚨 NOTE: These endpoints must be implemented on your backend 
    // to return the count of records for each collection.
    const fetchStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [eventsRes, usersRes, pendingEventsRes] = await Promise.all([
                axios.get('/events/count'), // Example: Should return { count: N }
                axios.get('/users/count'), // Example: Should return { count: N }
                axios.get('/pendingEvents/count') // Example: Should return { count: N }
            ]);

            setStats({
                totalEvents: eventsRes.data.count,
                totalUsers: usersRes.data.count,
                pendingEvents: pendingEventsRes.data.count,
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching platform statistics:", err.response ? err.response.data : err.message);
            setError("Failed to load statistics. Check backend endpoints.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, [refreshKey]);

    if (loading) return <div className="text-white text-center py-10">Loading platform statistics...</div>;
    if (error) return <div className="text-red-400 p-4 border border-red-600 rounded-lg">{error}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard 
                title="Total Published Events" 
                value={stats.totalEvents} 
                color="text-red-400 bg-red-900/20" 
                icon="🎉" 
            />
            <StatCard 
                title="Total Registered Users" 
                value={stats.totalUsers} 
                color="text-yellow-400 bg-yellow-900/20" 
                icon="👥" 
            />
            <StatCard 
                title="Events Awaiting Approval" 
                value={stats.pendingEvents} 
                color="text-green-400 bg-green-900/20" 
                icon="⏳" 
            />
        </div>
    );
};
// =================================================================

// =================================================================
// 🟢 UPDATED COMPONENT: Platform Overview
// =================================================================
const PlatformOverview = ({ refreshKey }) => {
    return (
        <div className="space-y-8">
            <h2 className={`text-2xl font-extrabold ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                📊 Platform Overview & Key Metrics
            </h2>
            <PlatformStatistics refreshKey={refreshKey} />
            <div className={STYLES.cardBg}>
                <h3 className={`text-xl font-bold mb-4 ${STYLES.accentSecondary}`}>System Health (Placeholder)</h3>
                <p className="text-gray-400">Database connection: <span className="text-green-500 font-semibold">Online</span></p>
                <p className="text-gray-400">API Latency: <span className="text-yellow-500 font-semibold">150ms</span></p>
            </div>
        </div>
    );
};
// =================================================================


// =================================================================
// 🟢 NEW COMPONENT: Pending Events (For Admin Approval)
// =================================================================
const PendingEvents = ({ refresh }) => {
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const fetchPendingEvents = () => {
        setLoading(true);
        setError(null);
        // 🚨 Fetch ONLY events where status is 'pending'
        // You MUST configure your backend to handle this endpoint /pendingEvents 
        axios.get('/pendingEvents') 
            .then(response => {
                setPendingEvents(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching pending events:", err.response ? err.response.data : err.message);
                if (err.response && err.response.status === 401) {
                    setError("🚫 Unauthorized: Please ensure you are logged in as an Admin.");
                } else {
                    setError("⚠️ Failed to load pending events from the server.");
                }
                setPendingEvents([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPendingEvents();
    }, [refresh]);

    // Function to handle event approval/rejection
    const handleApproval = async (eventId, newStatus, eventTitle) => {
        const action = newStatus === 'published' ? 'publish' : 'reject/delete';
        if (!window.confirm(`Are you sure you want to ${action} the event "${eventTitle}"?`)) return;

        try {
            if (newStatus === 'published') {
                 // Endpoint to update the event's status to 'published'
                await axios.put(`/events/${eventId}/status`, { status: 'published' });
                alert('Event published successfully!');
            } else {
                 // Endpoint to delete the event (rejection)
                await axios.delete(`/events/${eventId}`);
                alert('Event rejected and deleted successfully!');
            }
            
            fetchPendingEvents(); // Refresh the list of pending events
            // Force overview/other lists to refresh
            // NOTE: The AdminDashboard component manages the refreshKey, so we don't need a direct call here, 
            // but the parent component will trigger a refresh on tab switch/action if needed.
        } catch (error) {
            alert(`Failed to ${action} event. Check server logs.`);
            console.error(`Error processing event ${action}:`, error);
        }
    };

    if (loading) return <div className="text-white text-center py-10">Loading pending events...</div>;
    if (error) return <div className="text-red-400 text-center py-10 p-4 border border-red-600 rounded-lg">{error}</div>;

    return (
        <div className={STYLES.cardBg}>
            <h2 className={`text-2xl font-extrabold mb-6 ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                ⏳ Pending Events Approval ({pendingEvents.length})
            </h2>

            {pendingEvents.length === 0 ? (
                <p className="text-gray-400">🎉 All contributor events have been approved!</p>
            ) : (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {pendingEvents.map(event => (
                        <div key={event._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 transition duration-300 flex items-center justify-between gap-4">
                            
                            {/* EVENT IMAGE AND DETAILS */}
                            <div className="flex items-center gap-4 flex-grow">
                                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-700">
                                    {event.image ? (
                                        <img 
                                            src={`http://localhost:4000/${event.image}`} 
                                            alt={event.title} 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <p className="text-lg font-semibold text-white">{event.title}</p>
                                    <p className="text-sm text-gray-400">
                                        By: <span className="text-yellow-400">{event.organizedBy}</span> | Date: {new Date(event.eventDate).toLocaleDateString()}
                                    </p>
                                    <span className="text-xs px-2 py-0.5 bg-yellow-600/30 text-yellow-300 rounded-full mt-1 inline-block">
                                        {event.category ? event.category.split(' & ')[0] : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2 flex-shrink-0">
                                <button
                                    onClick={() => handleApproval(event._id, 'published', event.title)}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                                >
                                    Approve ✅
                                </button>
                                <button
                                    onClick={() => handleApproval(event._id, 'rejected', event.title)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                                >
                                    Reject ❌
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// =================================================================


// =================================================================
// 🟢 COMPONENT: Events Calendar View (UPDATED TO FILTER PUBLISHED)
// =================================================================
const EventsCalendarView = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use the dedicated /publishedEvents endpoint if available, otherwise fetch all and filter
        axios.get('/publishedEvents') 
            .then(response => {
                setEvents(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching events:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-white text-center py-10">Loading events calendar...</div>;

    // Helper function to group events by date
    const groupEventsByDate = (eventList) => {
        const grouped = {};
        eventList.forEach(event => {
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
        <div className={STYLES.cardBg}>
            <h2 className={`text-2xl font-extrabold mb-6 ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                📅 Published Events Calendar ({events.length} Total)
            </h2>

            {events.length === 0 ? (
                <p className="text-gray-400">No events currently published.</p>
            ) : (
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {sortedDates.map(date => (
                        <div key={date} className="border-l-4 border-yellow-500 pl-4 bg-gray-900 p-3 rounded-lg shadow-md">
                            <h3 className={`text-xl font-bold ${STYLES.accentSecondary} mb-2`}>{date}</h3>
                            <div className="space-y-3">
                                {groupedEvents[date].map(event => (
                                    <div key={event._id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between hover:bg-gray-700 transition duration-200 border border-gray-700">
                                        
                                        {/* EVENT IMAGE AND DETAILS */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden border border-gray-600">
                                                {event.image ? (
                                                    <img 
                                                        src={`http://localhost:4000/${event.image}`} 
                                                        alt={event.title} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                                        Pic
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <p className="text-lg font-semibold text-white">{event.title}</p>
                                                <p className="text-sm text-gray-400">{event.eventTime} | {event.location}</p>
                                            </div>
                                        </div>

                                        <span className="text-sm px-3 py-1 bg-red-600 rounded-full text-white flex-shrink-0">
                                            {event.category ? event.category.split(' & ')[0] : 'N/A'}
                                        </span>
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
// 🟢 COMPONENT: User and Contributor Management (NO CHANGE)
// =================================================================
const UserManagement = ({ refreshTabs }) => {
    const [users, setUsers] = useState([]);
    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [userRes, contributorRes] = await Promise.all([
                axios.get('/users'),
                axios.get('/contributors')
            ]);
            setUsers(userRes.data);
            setContributors(contributorRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching users/contributors:", err);
            setLoading(false);
            setUsers([]);
            setContributors([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (type, id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the ${type}: "${name}"?`)) return;

        try {
            const endpoint = type === 'user' ? `/users/${id}` : `/contributors/${id}`;
            await axios.delete(endpoint);
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
            fetchData(); // Refresh current list
            refreshTabs(); 
        } catch (error) {
            alert(`Failed to delete ${type}. Make sure you are logged in as an Admin.`);
            console.error(`Error deleting ${type}:`, error);
        }
    };

    if (loading) return <div className="text-white text-center py-10">Loading user management data...</div>;

    return (
        <div className="space-y-8">
            <h2 className={`text-2xl font-extrabold ${STYLES.accentPrimary} border-b border-gray-700 pb-2`}>
                🔧 User & Contributor Management
            </h2>

            {/* Standard Users List */}
            <div className={STYLES.cardBg}>
                <h3 className={`text-xl font-bold mb-4 ${STYLES.accentSecondary}`}>Standard Users ({users.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {users.length === 0 ? <p className="text-gray-400">No standard users found.</p> : users.map(u => (
                        <div key={u._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center border border-gray-700">
                            <p className="text-white">{u.name} (<span className="text-gray-400">{u.email}</span>)</p>
                            <button
                                onClick={() => handleDelete('user', u._id, u.name)}
                                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contributors List */}
            <div className={STYLES.cardBg}>
                <h3 className={`text-xl font-bold mb-4 ${STYLES.accentSecondary}`}>Contributors ({contributors.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {contributors.length === 0 ? <p className="text-gray-400">No contributors found.</p> : contributors.map(c => (
                        <div key={c._id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center border border-gray-700">
                            <p className="text-white">{c.name} (<span className="text-gray-400">{c.email}</span>)</p>
                            <button
                                onClick={() => handleDelete('contributor', c._id, c.name)}
                                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
// =================================================================


// 💡 Component for detailed event list (UPDATED TO FILTER PUBLISHED)
const EventListDetails = ({ refresh }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = () => {
        setLoading(true);
          // Fetch all published events
        axios.get('/publishedEvents')
            .then(response => {
                setEvents(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching events:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchEvents();
    }, [refresh]);

    const handleDeleteEvent = async (eventId, eventTitle) => {
        if (!window.confirm(`⚠️ Are you sure you want to permanently delete the event: "${eventTitle}"? This cannot be undone.`)) return;

        try {
            await axios.delete(`/events/${eventId}`);
            alert(`Event "${eventTitle}" deleted successfully!`);
            fetchEvents(); 
        } catch (error) {
            alert('Failed to delete event. Make sure you are logged in as an Admin.');
            console.error('Error deleting event:', error);
        }
    };

    if (loading) return <div className="text-white text-center py-10">Loading event data...</div>;

    return (
        <div className={STYLES.cardBg}>
            <h3 className={`text-xl font-bold mb-4 ${STYLES.accentSecondary}`}>📜 All Published Events Details ({events.length})</h3>

            {events.length === 0 ? (
                <p className="text-gray-400">No published events found in the system.</p>
            ) : (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    {events.map(event => (
                        <div key={event._id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-red-500 transition duration-300 flex items-center gap-4">
                            
                            {/* EVENT IMAGE THUMBNAIL */}
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-gray-700">
                                {event.image ? (
                                    <img 
                                        src={`http://localhost:4000/${event.image}`} 
                                        alt={event.title} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                                        No Image
                                    </div>
                                )}
                            </div>
                            
                            {/* Event Details */}
                            <div className="flex-grow">
                                <p className="text-lg font-semibold text-white">{event.title}</p>
                                <p className="text-sm text-gray-400">Date: {new Date(event.eventDate).toLocaleDateString()} | Price: {event.ticketPrice > 0 ? `${event.ticketPrice} TND` : 'Free'}</p>
                                <p className="text-xs text-gray-500">By: {event.organizedBy} | Location: {event.location}</p>
                            </div>
                            
                            {/* Action Button */}
                            <button
                                onClick={() => handleDeleteEvent(event._id, event.title)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition flex-shrink-0"
                            >
                                Delete Event
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// 🟢 COMPONENT: FixedHeader
// ----------------------------------------------------------------------


// =================================================================
// 🟢 MAIN COMPONENT: AdminDashboard
// =================================================================
export default function AdminDashboard() {
    const { user, loading, setUser } = useContext(UserContext); 
    const [activeTab, setActiveTab] = useState('pendingEvents'); 
    
    // State used to force components to re-fetch data when a deletion or approval occurs
    const [refreshKey, setRefreshKey] = useState(0); 
    const refreshTabs = () => setRefreshKey(prev => prev + 1); 

    // Handle Logout
    const handleLogout = async () => {
        await axios.post('/admin/logout'); // Use dedicated admin logout endpoint
        setUser(null);
        // Note: Navigate outside of return to prevent state/render issues
    };

    // 🟢 UPDATED TAB MAPPINGS
    const tabComponents = {
        'overview': () => <PlatformOverview refreshKey={refreshKey} />, // Pass refreshKey to stats
        'pendingEvents': () => <PendingEvents refresh={refreshKey} />, 
        'calendar': EventsCalendarView,
        'eventList': () => <EventListDetails refresh={refreshKey} />,
        'userMgmt': () => <UserManagement refreshTabs={refreshTabs} />,
        'contributors': () => <ContributorApproval refresh={refreshKey} />,    };
    // -------------------------

    const ActiveComponent = tabComponents[activeTab];

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading User Data...</div>;
    }
    
    // Safety check: Redirect if not logged in or unauthorized (based on role)
    if (!user || user.role !== 'admin') {
        return <Navigate to={'/admin/login'} />;
    }

    const adminName = user.name || 'Admin';

    // ----------------------------------------------------------------------
    // Main Dashboard Layout
    // ----------------------------------------------------------------------

    return (
        <div className={STYLES.pageBg}>
            {/* Sidebar Navigation (Fixed) */}
            <aside className={STYLES.sidebarBg}>
                <div className="p-6 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-4">
                            <h1 className={`text-2xl font-extrabold ${STYLES.accentPrimary}`}>Admin Panel</h1>
                        </div>
                        
                        <nav className="space-y-3">
                            {Object.entries(tabComponents).map(([key, value]) => (
                                <button 
                                    key={key}
                                    onClick={() => setActiveTab(key)} 
                                    className={`w-full text-left p-3 rounded-lg font-medium transition duration-200 flex items-center gap-3 ${
                                        activeTab === key ? 'bg-red-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                                    }`}
                                >
                                    <span className="text-xl">
                                        {key === 'overview' && '📊'}
                                        {key === 'pendingEvents' && '⏳'} 
                                        {key === 'calendar' && '📅'}
                                        {key === 'eventList' && '📜'}
                                        {key === 'userMgmt' && '🔧'}
                                        {key === 'contributors' && '👥'}
                                    </span> 
                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Footer/Logout */}
                    <div className="pt-6 border-t border-gray-700">
                           <p className="text-sm text-gray-400 mb-3">Logged in as: <span className="font-semibold text-white">{adminName}</span></p>
                        <button 
                            onClick={handleLogout} 
                            className="w-full text-center p-3 rounded-lg bg-gray-800 text-red-500 hover:bg-red-500 hover:text-white transition duration-200"
                        >
                            &larr; Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={STYLES.mainContentWrapper}>
                {/* Header for Main Content (Removed to allow ActiveComponent to render fully without overlap issue) */}
                <div className={STYLES.fixedHeader} style={{ position: 'relative', height: 'fit-content' }}>
                    <h2 className={STYLES.headerText}>
                        Welcome, {adminName}!
                    </h2>
                    <p className="text-gray-400 text-lg">{tabComponents[activeTab].name.replace(/([A-Z])/g, ' $1').trim() || activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
                </div>
                
                {/* Scrollable Content Body */}
                {/* NOTE: Adjusting margin-top is typically for fixed headers. 
                   If the fixedHeader is now static/relative, adjust the margin-top accordingly or remove it.
                   I will keep the style and just adjust the fixedHeader to not be fixed, but inline with flow.
                */}
                <div className={STYLES.contentBody} style={{marginTop: '0px'}}> 
                    <ActiveComponent />
                </div>

            </main>
        </div>
    );
}