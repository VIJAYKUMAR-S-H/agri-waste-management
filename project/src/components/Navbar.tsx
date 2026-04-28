import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { user, logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/ai-dashboard', label: 'AI Dashboard' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-cream-white/90 backdrop-blur-sm shadow-sm border-b border-cream-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-sage-600 to-sage-700 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 group-hover:text-sage-700 transition-colors">
              AgriWaste
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-sage-600 bg-sage-50 shadow-sm'
                    : 'text-slate-600 hover:text-sage-600 hover:bg-sage-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          {user ? (
            <div className="flex items-center space-x-3">
              <NotificationCenter />
              <div className="flex items-center space-x-2">
                <div className="bg-sage-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-sage-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                className="text-slate-600 hover:text-sage-600 p-2 rounded-md transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 p-2 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-slate-600 hover:text-sage-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 
                         text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;