import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext'; 
import { FaUserEdit, FaUserCircle } from 'react-icons/fa'; 

export default function ProfilePage() {
    const { user, setUser } = useContext(UserContext);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState('');
    const [photoFile, setPhotoFile] = useState(null); 
    const [currentPhoto, setCurrentPhoto] = useState(''); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // LOGIC: Fetch initial profile data
    useEffect(() => {
        if (!user || !user._id) return;

        axios.get('/profile')
            .then(response => {
                const data = response.data;
                setName(data.name || '');
                setBio(data.bio || '');
                setSkills(data.skills ? data.skills.join(', ') : '');
                setCurrentPhoto(data.photo || ''); // DB path (e.g., 'uploads/...')
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.error || 'Failed to load profile data.');
                setLoading(false);
            });
    }, [user]);

    // HANDLER: Capture selected file
    const handleFileChange = (e) => {
        setPhotoFile(e.target.files[0]);
    };

    // LOGIC: Determine image source (Preview URL > DB Path > Icon Fallback)
    const imageSource = () => {
        if (photoFile) {
            return URL.createObjectURL(photoFile); // Local URL for instant preview
        }
        if (currentPhoto) {
            // NOTE: We return the raw DB path here. The URL construction moves to the JSX.
            return currentPhoto; 
        }
        return 'icon'; // Signal to render FaUserCircle
    };

    // Cleanup local object URL
    useEffect(() => {
        if (photoFile) {
            return () => URL.revokeObjectURL(photoFile);
        }
    }, [photoFile]);


    // HANDLER: Form Submission (remains unchanged)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const data = new FormData();
        data.append('name', name);
        data.append('bio', bio);
        data.append('skills', JSON.stringify(skills.split(',').map(s => s.trim()).filter(s => s.length > 0)));

        if (photoFile) {
            data.append('photo', photoFile);
        }

        try {
            const response = await axios.put('/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setUser(response.data); 
            setCurrentPhoto(response.data.photo);
            setPhotoFile(null); 
            alert('Profile updated successfully! ✅');

        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.error || 'Profile update failed.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">Loading profile...</div>;
    if (error) return <div className="text-red-500 p-6">{error}</div>;
    if (!user) return <div className="min-h-screen bg-gray-950 text-white p-6">Please log in to view your profile.</div>;

    const currentImageSource = imageSource();

    // Helper to construct the full image URL from the DB path
    const getFullImageUrl = (path) => {
         // Ensures it uses http://localhost:4000/uploads/...
        return `http://localhost:4000/${path.startsWith('/') ? path.substring(1) : path}`;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 lg:p-24 animate-fade-in">
            <div className="w-full mx-auto max-w-4xl bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-10">
                
                <h1 className="flex items-center text-3xl font-bold text-white tracking-wide mb-6 border-b border-gray-700 pb-2">
                    <FaUserEdit className="mr-2 text-red-500" />
                    Edit Your Profile
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Profile Photo Display with Preview Logic */}
                    <div className="flex items-center space-x-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
                        
                        {/* Conditional Rendering: Icon or Image */}
                        {currentImageSource === 'icon' ? (
                            <FaUserCircle className="w-24 h-24 text-gray-500 rounded-full border-4 border-red-500 flex-shrink-0" />
                        ) : (
                            <img 
                                // 👇 CORRECTED SRC CONSTRUCTION (similar to your IndexPage)
                                src={photoFile ? currentImageSource : getFullImageUrl(currentImageSource)}
                                alt="Profile" 
                                className="w-24 h-24 rounded-full object-cover border-4 border-red-500 flex-shrink-0 shadow-lg"
                                onError={(e) => { 
                                    // If a DB image fails to load, hide the broken icon
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}

                        <div>
                            <label className="block text-lg font-medium text-gray-300 mb-2">Profile Picture</label>
                            <input 
                                type="file" 
                                onChange={handleFileChange} 
                                className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600 transition duration-150" 
                                accept="image/*"
                            />
                            {photoFile && <p className="text-sm text-yellow-400 mt-2">Previewing new photo: {photoFile.name}</p>}
                        </div>
                    </div>

                    {/* ... (rest of the form remains the same) ... */}
                    <div>
                        <label htmlFor="name" className="block text-md font-medium text-gray-300 mb-1">Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} 
                            className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:ring-red-500 focus:border-red-500" />
                    </div>
                    
                    <div>
                        <label htmlFor="bio" className="block text-md font-medium text-gray-300 mb-1">Bio</label>
                        <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows="4"
                                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:ring-red-500 focus:border-red-500"></textarea>
                    </div>
                    
                    <div>
                        <label htmlFor="skills" className="block text-md font-medium text-gray-300 mb-1">Skills (Comma-separated)</label>
                        <input type="text" id="skills" value={skills} onChange={e => setSkills(e.target.value)} 
                                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:ring-red-500 focus:border-red-500"
                                placeholder="e.g., React, Node.js, Design" />
                    </div>
                    
                    <button type="submit" disabled={loading}
                            className="w-full py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300">
                        {loading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                    
                </form>
            </div>
        </div>
    );
}