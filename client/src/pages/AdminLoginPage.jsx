// AdminLoginPage.jsx

import { useContext, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import logo from '../assets/logo.png'; 

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false); // Changed to boolean for clarity
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe] = useState(false);
  // 🟢 NEW STATE: For button status/feedback
  const [status, setStatus] = useState('Sign In as Admin'); 
  
  const { setUser } = useContext(UserContext);

  async function loginAdmin(ev) {
    ev.preventDefault();
    
    setStatus('Signing in...'); // Show loading status
    
    try {
      // Target the /admin/login endpoint
      const { data } = await axios.post('/admin/login', { email, password });
      
      setUser(data); 
      
      // setStatus('Login successful! Redirecting...'); // Optional: Show success before redirect
      setRedirect(true);
    } catch (e) {
      // On error (e.g., 401 Unauthorized), reset the button text and show failure message
      setStatus('Login failed. Check credentials! ❌');
      setTimeout(() => setStatus('Sign In as Admin'), 3000); // Reset after 3 seconds
    }
  }

  // 🟢 FIX: Redirect to Admin Dashboard upon successful login
  if (redirect) {
    // This triggers the navigation to the protected dashboard route
    return <Navigate to="/admin/dashboard" />;
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
        <div className="bg-gray-900 p-10 rounded-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-bold mb-6 text-red-500">Admin Connexion</h1>

          <form onSubmit={loginAdmin} className="flex flex-col gap-4 text-left">
            <input 
              type="email" 
              placeholder="admin@admin.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" 
            />

            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Mot de passe" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none" 
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={rememberMe} readOnly /> 
                Remember Me
              </label>
              <Link to="/forgotpassword" className="text-yellow-500 hover:underline">Forgot Password?</Link>
            </div>

            <button 
              type="submit" 
              className={`font-bold p-3 rounded-md ${
                status.includes('failed') ? 'bg-red-800' : 'bg-red-600 hover:bg-red-500'
              } text-white transition duration-200`}
            >
              {status}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}