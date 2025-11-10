import { useContext, useEffect, useRef, useState } from "react";
import axios from 'axios';
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { BsFillCaretDownFill } from 'react-icons/bs';
import logo from '../assets/logo.png'; // adjust path if needed

export default function Header() {
  const { user, setUser } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef();

  // Helper boolean variables for clearer conditional rendering
  const isAdmin = user && user.role === 'admin';
  const isContributor= user && user.role === 'contributor'
  const isContributorOrAdmin = user && (user.role === 'contributor' || user.role === 'admin');

  //! Fetch events
  useEffect(() => {
    axios.get("/events")
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  }, []);

  //! Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  //! Logout
  const logout = async () => {
    await axios.post('/logout');
    setUser(null);
  };

  return (
    <header className="w-full bg-gray-900 p-4 flex justify-between items-center shadow-md relative">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-4">
        <img src={logo} alt="Logo" className="w-24" />
        <nav className="hidden md:flex gap-6 text-yellow-500 font-semibold">
          <Link className="px-4 py-2 hover:bg-gray-100" to="/">Actuality</Link>
          <Link className="px-4 py-2 hover:bg-gray-100" to="/categories">Categories</Link>
          <Link className="px-4 py-2 hover:bg-gray-100" to="/profile">Profil</Link>

          {/* Conditional Link: Admin Dashboard */}
          {isAdmin && (
            <Link className="px-4 py-2 hover:bg-gray-100" to="/admindashboard">Dashboard</Link>
          )}
          
          {/* // 🚩 ADDED LOGIC FOR CONTRIBUTOR DASHBOARD LINK IN MAIN NAV 
            // This link should be visible if the user is a contributor, 
            // but the Admin link above takes precedence if they are admin. 
          */}
          {isContributor && !isAdmin && (
            <Link className="px-4 py-2 hover:bg-gray-100" to="/contributordashboard">Dashboard</Link>
          )}


          {/* Conditional Link: Create Event (for Admin and Contributor) */}
          {isContributorOrAdmin && (
            <Link className="px-4 py-2 hover:bg-gray-100" to="/createEvent">Create Event</Link>
          )}

          <Link className="px-4 py-2 hover:bg-gray-100" to="/wallet">Wallet</Link>
          <Link className="px-4 py-2 hover:bg-gray-100" to="/calendar">Calendar</Link>
        </nav>
      </div>

      {/* Middle: Search (No changes needed) */}
      <div className="flex items-center bg-white rounded py-2 px-4 w-1/3 gap-4 shadow-md shadow-gray-200 relative">
        <button>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
        <div ref={searchInputRef} className="w-full">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm text-black outline-none w-full"
          />
        </div>

        {searchQuery && (
          <div className="p-2 w-144 z-10 absolute rounded top-14 left-0 md:w-[315px] md:left-0 lg:w-[540px] lg:left-0 bg-white shadow-lg">
            {events.filter(event =>
              event.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(event => (
              <Link key={event._id} to={`/event/${event._id}`}>
                <div className="p-2 text-black hover:bg-gray-100 rounded">{event.title}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right: User / Auth (Dropdown updates) */}
      <div className="flex items-center gap-4">
        {!user && (
          <Link to="/select-role">
            <button className="bg-yellow-500 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-400">Sign in</button>
          </Link>
        )}

        {user && (
          <div className="flex items-center gap-2 relative">
            <span className="font-semibold text-white">{user.name.toUpperCase()}</span>
            <BsFillCaretDownFill className="h-5 w-5 cursor-pointer text-white hover:rotate-180 transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)} />

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg flex flex-col z-20">
                {/* Conditional Link in Dropdown: Admin Dashboard */}
                {isAdmin && (
                    <Link className="px-4 py-2 hover:bg-gray-100" to="/admindashboard">Dashboard (Admin)</Link>
                )}
                {/* Conditional Link in Dropdown: Contributor Dashboard (already present) */}
                {isContributor && (
                    <Link className="px-4 py-2 hover:bg-gray-100" to="/contributordashboard">Dashboard (Contributor)</Link>
                )}
                {/* Conditional Link in Dropdown: Create Event */}
                {isContributorOrAdmin && (
                    <Link className="px-4 py-2 hover:bg-gray-100" to="/createEvent">Create Event</Link>
                    
                )}

                <Link className="px-4 py-2 hover:bg-gray-100" to="/wallet">Wallet</Link>
                <Link className="px-4 py-2 hover:bg-gray-100" to="/calendar">Calendar</Link>
                <button className="px-4 py-2 text-left hover:bg-gray-100" onClick={logout}>Log out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}