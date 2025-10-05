// src/ProtectedRoute.jsx
/* eslint-disable react/prop-types */
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from './UserContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useContext(UserContext);
    const location = useLocation();

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    // User is not logged in - redirect to role selection with intended destination
    if (!user) {
        return <Navigate to="/select-role" state={{ from: location }} replace />;
    }

    // Check roles if specific roles are required
    if (allowedRoles.length > 0) {
        const userRole = user.role || 'user';
        
        if (!allowedRoles.includes(userRole)) {
            // Role not allowed - redirect to home or unauthorized page
            return <Navigate to="/" replace />;
        }
    }

    // User is logged in (and has required role if specified) - render children
    return children;
}