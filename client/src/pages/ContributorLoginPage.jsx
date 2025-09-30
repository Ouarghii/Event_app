import { useContext, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import logo from '../assets/logo.png'; // Assuming your logo is here

export default function ContributorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe] = useState(false); // Simplified: removed persistence logic for brevity
  const { setUser } = useContext(UserContext);

  async function loginContributor(ev) {
    ev.preventDefault();
    try {
      // 🟢 CHANGE: Use the specific contributor login endpoint
      const { data } = await axios.post('/contributor/login', { email, password });
      
      // Save user data (including role if returned) to context
      setUser(data); 
      
      alert('Contributor Login successful');
      setRedirect(true);
    } catch (e) {
      alert('Contributor Login failed');
    }
  }

  if (redirect) {
    return <Navigate to="/" />;
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
        <div className="bg-gray-900 p-10 rounded-xl w-full max-w-md text-center">
          {/* 🟢 CHANGE: Title reflects the role */}
          <h1 className="text-3xl font-bold mb-6 text-yellow-500">Contributor Connexion</h1>

          {/* Form (Same structure as original) */}
          <form onSubmit={loginContributor} className="flex flex-col gap-4 text-left">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none w-full" />

            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none" />
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

            <button type="submit" className="bg-yellow-500 text-black font-bold p-3 rounded-md hover:bg-yellow-400">
              Sign In as Contributor
            </button>

            <Link to="/contributor/register" className="flex-1 text-center p-3 border border-yellow-500 rounded-md hover:bg-yellow-500 hover:text-black mt-4">
              Sign Up as Contributor
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}