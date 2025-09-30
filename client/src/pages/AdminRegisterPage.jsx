// AdminRegisterPage.jsx - Almost identical to Contributor, just targets the /admin routes

import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import logo from '../assets/logo.png'; 

export default function AdminRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [redirect, setRedirect] = useState('');

  async function registerAdmin(ev) {
    ev.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // 🟢 CHANGE: Use the specific admin registration endpoint
      await axios.post('/admin/register', { name, email, password });
      alert('Admin Registration Successful! Please sign in.');
      setRedirect(true);
    } catch (e) {
      alert('Admin Registration failed. Email might already be in use.');
    }
  }

  // 🟢 CHANGE: Redirect to Admin Login Page
  if (redirect) {
    return <Navigate to={'/admin/login'} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="w-full bg-gray-900 p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-24" />
          <nav className="hidden md:flex gap-6 text-yellow-500 font-semibold">
            <Link to="/">Actuality</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/profile">Profil</Link>
          </nav>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-xl w-full max-w-md p-10 text-center relative">
          <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
          {/* 🟢 CHANGE: Title reflects the role */}
          <h1 className="text-3xl font-bold mb-6 text-yellow-500">Admin Sign Up</h1>

          <form onSubmit={registerAdmin} className="flex flex-col gap-4 text-left">
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />

            <button type="submit" className="bg-red-600 text-white font-bold p-3 rounded-md hover:bg-red-500">
              Create Admin Account
            </button> {/* Changed color for distinction */}

            <div className="mt-4 text-center">
              Already an Admin? <Link to="/admin/login" className="text-yellow-500 hover:underline">Sign In</Link>
            </div>
            
            <Link to="/select-role" className="mt-4 inline-block text-yellow-500 hover:underline">
               &larr; Back to Role Selection
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}