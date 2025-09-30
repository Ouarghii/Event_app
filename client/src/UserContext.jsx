import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const USER_STORAGE_KEY = 'adminUser';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    // 1. Initialize state by checking localStorage first
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            return null;
        }
    });

    const [loading, setLoading] = useState(true);

    // 2. Effect to persist user data to localStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }, [user]); 

    // 3. Effect to check for an authenticated user on page load
    useEffect(() => {
        if (user) {
            // User already loaded from localStorage, no need for backend check
            setLoading(false);
            return;
        }
        
        // Function to attempt profile checks sequentially
        const checkProfiles = async () => {
            const profileEndpoints = [
                '/admin/profile', 
                '/contributor/profile', 
                '/profile' // General user profile
            ];

            for (const endpoint of profileEndpoints) {
                try {
                    const { data } = await axios.get(endpoint);
                    
                    // If successful, set the user and stop checking
                    if (data) {
                        setUser(data);
                        setLoading(false);
                        return; // Found user, exit the loop/function
                    }
                } catch (error) {
                    // Profile check failed for this endpoint (user might not be this role)
                    // Continue to the next endpoint
                    // console.log(`Profile check failed for ${endpoint}:`, error.message);
                }
            }
            
            // If the loop finishes without setting a user, no one is logged in
            setLoading(false);
        };

        checkProfiles();
    }, [user]); // Rerun if user changes (e.g., set to null on logout)

    // Function to handle logout/clear user
    const logout = () => {
        setUser(null);
        axios.post('/logout'); // Assuming a general logout endpoint
    };


    return (
        <UserContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </UserContext.Provider>
    );
}