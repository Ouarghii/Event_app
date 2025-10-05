import { Link, useLocation } from "react-router-dom";
import { FaUserShield, FaUserPlus, FaUser } from "react-icons/fa";
import { BsArrowRightShort } from "react-icons/bs";

// --- Role Data ---
const roles = [
  {
    name: "Admin",
    description: "Manage events, approve contributors, and oversee the entire platform.",
    icon: FaUserShield,
    color: "text-red-500",
    shadow: "shadow-red-900/50",
    path: "admin", 
  },
  {
    name: "Contributor",
    description: "Create and organize your own events. Requires admin approval.",
    icon: FaUserPlus,
    color: "text-yellow-500",
    shadow: "shadow-yellow-900/50",
    path: "contributor", 
  },
  {
    name: "User",
    description: "Browse, like, and book tickets for exciting events.",
    icon: FaUser,
    color: "text-blue-500",
    shadow: "shadow-blue-900/50",
    path: "", // User uses the root /login and /register paths
  },
];

export default function RoleSelectionPage() {
  const location = useLocation();
  
  // Get the intended destination from ProtectedRoute
  const from = location.state?.from?.pathname || '/';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      
      {/* Page Header */}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center tracking-tight">
        Choose Your Role
      </h1>
      <p className="text-gray-400 text-lg mb-12 text-center max-w-2xl">
        Select the role that best describes you to proceed to sign in or registration.
      </p>

      {/* Show where user will be redirected after login */}
      {from !== '/' && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-yellow-500/50">
          <p className="text-yellow-400 text-sm">
            After logging in, you'll be redirected to: <span className="font-mono">{from}</span>
          </p>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid gap-8 md:grid-cols-3 max-w-6xl w-full">
        {roles.map((role) => {
            // Dynamic path calculation
            const loginPath = role.path ? `/${role.path}/login` : '/login';

            return (
              <Link 
                key={role.name}
                to={loginPath}
                state={{ from }} // Pass the redirect destination to login page
                className={`
                  relative bg-gray-900 rounded-xl p-6 md:p-8 
                  flex flex-col items-center text-center 
                  shadow-xl ${role.shadow} 
                  transition-all duration-300 
                  hover:bg-gray-800 hover:scale-[1.05]
                  group cursor-pointer
                `}
              >
                {/* Role Icon */}
                <div className={`p-4 mb-4 rounded-full bg-gray-800 ${role.color} transition-colors duration-300 group-hover:bg-gray-700`}>
                  <role.icon className="w-10 h-10" />
                </div>

                {/* Role Name */}
                <h2 className="text-2xl font-bold mb-2 text-white">{role.name}</h2>
                
                {/* Description */}
                <p className="text-gray-400 mb-6">{role.description}</p>
                
                {/* Action Link/Picture Link */}
                <div className="flex items-center text-yellow-500 font-semibold mt-auto">
                  Sign In 
                  <BsArrowRightShort className="w-5 h-5 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
                
                {/* Animated Border Effect (Optional) */}
                <div className={`absolute inset-0 rounded-xl border-2 border-transparent transition-colors duration-300 group-hover:border-yellow-500`}></div>

              </Link>
            );
        })}
      </div>

      {/* Additional info for contributors wanting to create events */}
      {from === '/createEvent' && (
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg max-w-2xl">
          <p className="text-yellow-400 text-sm text-center">
            💡 <strong>Want to create events?</strong> Select "Contributor" to register as an event organizer.
          </p>
        </div>
      )}
    </div>
  );
}