import React, { useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext';
import { FaUserCircle, FaBriefcase, FaEnvelope, FaPenFancy, FaUsers } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Assuming you use react-router-dom

export default function ProfileDetails() {
    const { user } = useContext(UserContext);

    // If the full profile data isn't in context, this page should re-fetch it 
    // or rely on the ProfilePage useEffect to populate the context first.
    // For simplicity, we'll use the data already in the UserContext.
    // NOTE: You might need to adjust your UserContext to ensure the 'user' object 
    // contains all the profile fields (bio, skills, photo, etc.) after login/update.

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-6 text-center flex justify-center items-center">
                <div className="p-8 bg-gray-900 rounded-xl shadow-2xl">
                    <p className="text-xl">Please log in to view your profile.</p>
                </div>
            </div>
        );
    }
    
    // Helper function to correctly construct the image URL
    const getPhotoUrl = (path) => {
        if (!path) return 'placeholder.png'; // Fallback
        return `${axios.defaults.baseURL}/${path.startsWith('/') ? path.substring(1) : path}`;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 lg:p-24 animate-fade-in">
            <div className="w-full mx-auto max-w-4xl bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-10">
                
                {/* Header: Photo and Name */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start border-b border-gray-700 pb-8 mb-8">
                    <img 
                        src={getPhotoUrl(user.photo)} 
                        alt={`${user.name}'s Profile`} 
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-yellow-400 flex-shrink-0 shadow-lg mb-4 sm:mb-0 sm:mr-8"
                        onError={(e) => e.target.src = 'placeholder.png'}
                    />
                    <div className="text-center sm:text-left mt-4 sm:mt-0">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 tracking-wide mb-1">
                            {user.name || 'User Profile'}
                        </h1>
                        <p className="text-xl font-medium text-red-500 flex items-center justify-center sm:justify-start">
                            <FaUsers className="mr-2" /> Role: <span className="capitalize ml-1">{user.role || 'Guest'}</span>
                        </p>
                        <p className="text-gray-400 text-lg flex items-center justify-center sm:justify-start mt-2">
                             <FaEnvelope className="mr-2" /> {user.email}
                        </p>
                        <Link to="/profile/edit" className="mt-4 inline-block">
                             <button className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 shadow-md">
                                Edit Profile
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="space-y-6">
                    
                    {/* Bio Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                        <h2 className="text-2xl font-bold mb-3 text-white flex items-center">
                            <FaPenFancy className="mr-3 text-yellow-400" /> About Me
                        </h2>
                        <p className="text-gray-300 leading-relaxed">{user.bio || 'This user has not provided a biography yet.'}</p>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                            <FaBriefcase className="mr-3 text-yellow-400" /> Skills & Expertise
                        </h2>
                        {user.skills && user.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-700 text-yellow-400 rounded-full text-sm font-semibold shadow-md">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No skills listed.</p>
                        )}
                    </div>
                    
                    {/* Preferences/Extra Info Section (Placeholder) */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                        <h2 className="text-2xl font-bold mb-3 text-white flex items-center">
                            <FaUserCircle className="mr-3 text-yellow-400" /> Additional Info
                        </h2>
                        <p className="text-gray-300">User ID: <span className="font-mono text-sm text-yellow-400">{user._id}</span></p>
                        <p className="text-gray-300">Account Type: <span className="capitalize font-semibold text-red-500">{user.role}</span></p>
                        {/* Add more profile fields here (e.g., preferences, joined date) */}
                    </div>

                </div>
            </div>
        </div>
    );
}