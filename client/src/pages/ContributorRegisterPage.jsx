import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import logo from '../assets/logo.png'; // Assuming your logo is here

export default function ContributorRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [redirect, setRedirect] = useState('');

  async function registerContributor(ev) {
    ev.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // 🟢 CHANGE: Use the specific contributor registration endpoint
      await axios.post('/contributor/register', { name, email, password });
      alert('Contributor Registration Successful! Please sign in.');
      setRedirect(true);
    } catch (e) {
      alert('Contributor Registration failed. Email might already be in use.');
    }
  }

  // 🟢 CHANGE: Redirect to Contributor Login Page
  if (redirect) {
    return <Navigate to={'/contributor/login'} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header (Same as original) */}
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

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-xl w-full max-w-md p-10 text-center relative">
          <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
          {/* 🟢 CHANGE: Title reflects the role */}
          <h1 className="text-3xl font-bold mb-6 text-yellow-500">Contributor Sign Up</h1>

          {/* Form (Same structure as original) */}
          <form onSubmit={registerContributor} className="flex flex-col gap-4 text-left">
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />

            <button type="submit" className="bg-yellow-500 text-black font-bold p-3 rounded-md hover:bg-yellow-400">
              Create Contributor Account
            </button>

            <div className="mt-4 text-center">
              Already a Contributor? <Link to="/contributor/login" className="text-yellow-500 hover:underline">Sign In</Link>
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