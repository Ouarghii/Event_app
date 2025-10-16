import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaTachometerAlt, FaCalendarAlt, FaPlusSquare, FaListAlt, FaRegNewspaper, FaUserCircle } from 'react-icons/fa';

export default function AdminHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Define the navigation items
    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: FaTachometerAlt },
        { name: 'Create Event', path: '/admin/events/new', icon: FaPlusSquare },
        { name: 'Calendar', path: '/admin/calendar', icon: FaCalendarAlt },
        { name: 'Categories', path: '/admin/categories', icon: FaListAlt },
        { name: 'Actuality', path: '/admin/actuality', icon: FaRegNewspaper },
    ];

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="bg-gray-900 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    
                    {/* Logo/Site Title */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-extrabold text-red-500 tracking-wider">
                            EVENTO<span className="text-white">Admin</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block">
                        <div className="flex items-baseline space-x-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 flex items-center"
                                >
                                    <item.icon className="mr-2" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Right Side Icons (e.g., Profile) */}
                    <div className="flex items-center space-x-4">
                        <Link to="/profile" title="Admin Profile" className="p-2 text-gray-300 hover:text-red-500 transition duration-150">
                            <FaUserCircle className="w-6 h-6" />
                        </Link>
                        
                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMenu}
                            className="p-2 text-gray-300 hover:text-white md:hidden rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu (Conditionally Rendered) */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-800 border-t border-gray-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)} // Close menu on click
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 flex items-center"
                            >
                                <item.icon className="mr-3 text-red-400" />
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}