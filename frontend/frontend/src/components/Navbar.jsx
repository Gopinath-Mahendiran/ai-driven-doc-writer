import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/image.png";
import isAuthenticated, { subscribeAuth } from "../utils/Authentication";
import { useState, useEffect } from "react";
import { ACCESS_TOKEN,REFRESH_TOKEN } from "../constants";

const Navbar = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(isAuthenticated());

  useEffect(() => {
    const unsubscribe = subscribeAuth(setAuth);
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setAuth(false);
    navigate("/");
    // window.location.reload();
  };

  return (
    <nav className="relative w-full flex items-center justify-center px-6 py-6 space-x-12 z-20 primary-font">
      <div className="flex items-center space-x-12">
        {/* Logo */}
        <div className="flex top-0 items-center space-x-3">
          <Link to="/">
            <img src={logo} alt="Logo" className="w-40 h-126.8" />
          </Link>
        </div>

        {/* Nav Links */}
        <ul className="flex items-center space-x-8 text-white text-xl">
          <li>
            <Link to="/" className="hover:backdrop-blur-sm hover:bg-white/10 hover:border hover:border-blue-400 hover:rounded-full px-4 py-2">
              Home
            </Link>
          </li>
          <li>
            <Link to="/sample" className="hover:backdrop-blur-sm hover:bg-white/10 hover:border hover:border-blue-400 hover:rounded-full px-4 py-2">
              Pricing
            </Link>
          </li>
          <li>
            <Link to="/docs" className="hover:backdrop-blur-sm hover:bg-white/10 hover:border hover:border-blue-400 hover:rounded-full px-4 py-2">
              Docs
            </Link>
          </li>
          <li>
            {auth ? (
              <button
                className="ml-4 hover:backdrop-blur-sm hover:bg-white/10 hover:border hover:border-blue-400 hover:rounded-full px-4 py-2"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/signin"
                className="ml-4 hover:backdrop-blur-sm hover:bg-white/10 hover:border hover:border-blue-400 hover:rounded-full px-4 py-2"
              >
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;