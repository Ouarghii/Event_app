import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext'; // Assume this is your context
import { FaUserEdit } from 'react-icons/fa'; // Icon for edit title

export default function ProfilePage() {
    const { user, setUser } = useContext(UserContext);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [currentPhoto, setCurrentPhoto] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return; // Wait for user context to be available

        // Fetch the full profile data on component mount
        axios.get('/profile')
            .then(response => {
                const data = response.data;
                setName(data.name || '');
                setBio(data.bio || '');
                setSkills(data.skills ? data.skills.join(', ') : '');
                setCurrentPhoto(data.photo || '');
                setLoading(false);
            })
            .catch(err => {
                // If 401 Unauthorized, the user object in context might be stale
                setError(err.response?.data?.error || 'Failed to load profile data.');
                setLoading(false);
            });
    }, [user]);

    const handleFileChange = (e) => {
        setPhotoFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const data = new FormData();
        data.append('name', name);
        data.append('bio', bio);
        
        // Convert comma-separated string to JSON array for skills
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        data.append('skills', JSON.stringify(skillsArray));

        // Note: Add logic for 'preferences' if required by the backend
        // data.append('preferences', JSON.stringify({ /* ... */ }));

        if (photoFile) {
            data.append('photo', photoFile);
        }

        try {
            const response = await axios.put('/profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setUser(response.data); 
            setCurrentPhoto(response.data.photo);
            setPhotoFile(null);
            alert('Profile updated successfully! ✅');

        } catch (err) {
            console.error('Update error:', err);
            // Use the error response from the backend for better feedback
            setError(err.response?.data?.error || 'Profile update failed.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">
            <div className="animate-pulse text-lg text-yellow-400">Loading Profile...</div>
        </div>
    );
    if (error) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-950 text-red-500">
             <div className="p-8 bg-gray-900 rounded-xl shadow-2xl">Error: {error}</div>
        </div>
    );
    if (!user) return <div className="min-h-screen bg-gray-950 text-white p-6 text-center">Please log in to view your profile.</div>;

    // Helper function to correctly construct the image URL
    const getPhotoUrl = (path) => {
        if (!path) return 'placeholder.png'; // Fallback
        // Use the base URL set for axios (e.g., http://localhost:4000)
        return `${axios.defaults.baseURL}/${path.startsWith('/') ? path.substring(1) : path}`;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 lg:p-24 animate-fade-in">
            <div className="w-full mx-auto max-w-4xl bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-10">
                
                <h1 className="flex items-center text-4xl font-extrabold text-yellow-400 tracking-wide mb-8 border-b border-gray-700 pb-4">
                    <FaUserEdit className="mr-3 w-8 h-8 text-red-500" />
                    Edit Your Profile
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Profile Photo Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <img 
                            src={getPhotoUrl(currentPhoto)} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 flex-shrink-0"
                            onError={(e) => e.target.src = 'placeholder.png'} // Use a generic fallback on error
                        />
                        <div>
                            <label className="block text-lg font-bold text-white mb-2">Profile Picture</label>
                            <input 
                                type="file" 
                                onChange={handleFileChange} 
                                className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 transition duration-150" 
                            />
                            {photoFile && <p className="text-sm text-yellow-400 mt-2">New file ready: {photoFile.name}</p>}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-md font-medium text-gray-300 mb-1">Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} 
                            className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:ring-yellow-400 focus:border-yellow-400 transition-shadow" />
                    </div>
                    
                    {/* Bio */}
                    <div>
                        <label htmlFor="bio" className="block text-md font-medium text-gray-300 mb-1">Bio / About Me</label>
                        <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows="4"
                                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:ring-yellow-400 focus:border-yellow-400 transition-shadow"></textarea>
                    </div>
                    
                    {/* Skills */}
                    <div>
                        <label htmlFor="skills" className="block text-md font-medium text-gray-300 mb-1">Skills (Comma-separated)</label>
                        <input type="text" id="skills" value={skills} onChange={e => setSkills(e.target.value)} 
                                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:ring-yellow-400 focus:border-yellow-400 transition-shadow"
                                placeholder="e.g., React, Node.js, Database Design" />
                    </div>
                    
                    {/* Save Button */}
                    <button type="submit" disabled={loading}
                            className="w-full py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.01]">
                        {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                    
                </form>
            </div>
        </div>
    );
}