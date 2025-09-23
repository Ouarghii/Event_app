import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import logo from '../assets/logo.png';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [redirect, setRedirect] = useState('');

  async function registerUser(ev){
    ev.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try{
      await axios.post('/register', { name, email, password });
      alert('Registration Successful');
      setRedirect(true);
    }catch(e){
      alert('Registration failed');
    }
  }

  if (redirect){
    return <Navigate to={'/login'} />
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
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
          {/* Optional signup illustration for larger screens */}


          {/* Logo */}
          <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-6 text-yellow-500">Sign Up</h1>

          {/* Form */}
          <form onSubmit={registerUser} className="flex flex-col gap-4 text-left">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full"
            />

            <button
              type="submit"
              className="bg-yellow-500 text-black font-bold p-3 rounded-md hover:bg-yellow-400"
            >
              Create Account
            </button>

            <div className="flex justify-between mt-4 gap-4">
              <Link to="/login" className="flex-1 text-center p-3 border border-yellow-500 rounded-md hover:bg-yellow-500 hover:text-black">
                Sign In
              </Link>
              <Link to="/register" className="flex-1 text-center p-3 border border-yellow-500 rounded-md hover:bg-yellow-500 hover:text-black">
                Sign Up
              </Link>
            </div>

            <Link to="/" className="mt-4 inline-block text-yellow-500 hover:underline">
              &larr; Back
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
