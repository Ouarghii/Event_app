import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext'; // Assume this is your context

export default function ProfilePage() {
    const { user, setUser } = useContext(UserContext); // Get user data and setter
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState(''); // Store as comma-separated string for input
    const [photoFile, setPhotoFile] = useState(null);
    const [currentPhoto, setCurrentPhoto] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || !user._id) return;

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
                setError('Failed to load profile data.');
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
        
        // 1. Create FormData object for file and text data
        const data = new FormData();
        data.append('name', name);
        data.append('bio', bio);
        // Convert comma-separated string to JSON array for skills
        data.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(s => s.length > 0)));
        // data.append('preferences', JSON.stringify({ /* ... */ })); // Add preferences here

        if (photoFile) {
            data.append('photo', photoFile); // Append the file
        }

        try {
            // 2. Send PUT request
            const response = await axios.put('/profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Required for file uploads
                }
            });
            
            // 3. Update global context and local state on success
            setUser(response.data); 
            setCurrentPhoto(response.data.photo);
            setPhotoFile(null); // Clear file input state
            alert('Profile updated successfully!');

        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.error || 'Profile update failed.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading profile...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!user) return <div>Please log in to view your profile.</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 lg:p-24 animate-fade-in">
            <div className="w-full mx-auto max-w-4xl bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-10">
            <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">Edit Your Profile</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Profile Photo Display */}
                <div className="flex items-center space-x-4">
                    <img 
                        src={currentPhoto ? `${axios.defaults.baseURL}/${currentPhoto}` : 'placeholder.png'} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-red-500"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Profile Picture</label>
                        <input type="file" onChange={handleFileChange} className="mt-1 block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600" />
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400">Name</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} 
                           className="w-full mt-1 p-2 border border-gray-700 rounded-md bg-gray-800 focus:ring-red-500 focus:border-red-500" />
                </div>
                
                {/* Bio */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-400">Bio</label>
                    <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows="3"
                              className="w-full mt-1 p-2 border border-gray-700 rounded-md bg-gray-800 focus:ring-red-500 focus:border-red-500"></textarea>
                </div>
                
                {/* Skills */}
                <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-400">Skills (Comma-separated)</label>
                    <input type="text" id="skills" value={skills} onChange={e => setSkills(e.target.value)} 
                           className="w-full mt-1 p-2 border border-gray-700 rounded-md bg-gray-800 focus:ring-red-500 focus:border-red-500"
                           placeholder="e.g., React, Node.js, Design" />
                </div>
                
                {/* Save Button */}
                <button type="submit" disabled={loading}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition duration-150">
                    {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
                
            </form>
        </div>
        </div>
    );
}