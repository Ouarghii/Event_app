// src/ProtectedRoute.jsx
/* eslint-disable react/prop-types */
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from './UserContext'; // Assurez-vous que le chemin est correct

export default function ProtectedRoute({ allowedRoles = [] }) {
    const { user, loading } = useContext(UserContext);

    // Si le chargement est en cours, vous pouvez retourner un loader ou null
    if (loading) {
        return <div>Loading...</div>; // ⬅️ Vous pouvez remplacer ceci par un vrai loader
    }

    // 1. L'utilisateur est-il connecté ?
    if (!user) {
        // Non, rediriger vers la page de sélection de rôle ou de connexion
        return <Navigate to="/select-role" replace />;
    }

    // 2. L'utilisateur a-t-il le bon rôle ?
    // Vérifie si le rôle de l'utilisateur est dans le tableau des rôles autorisés
    // Le rôle par défaut est 'user' si non spécifié dans le token (régulier /profile)
    const userRole = user.role || 'user'; 

    if (allowedRoles.includes(userRole)) {
        // Oui, afficher le contenu de la route
        return <Outlet />;
    } else {
        // Rôle non autorisé, rediriger vers la page d'accueil
        // Vous pouvez ajouter une logique pour afficher un message d'erreur si vous voulez
        return <Navigate to="/" replace />;
    }
}