import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Code,Home, BarChart3, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white shadow-2xl">
      {/* Background overlay with subtle pattern */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 text-2xl font-bold hover:scale-105 transition-transform duration-300"
          >
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DevConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" icon={Home} text="Home" />
            <NavLink to="/dashboard" icon={BarChart3} text="Dashboard" />
            <NavLink to="/login" icon={LogIn} text="Login" />
            <NavLink to="/register" icon={UserPlus} text="Register" />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 shadow-2xl">
            <div className="px-4 py-4 space-y-2">
              <MobileNavLink to="/" icon={Home} text="Home" />
              <MobileNavLink to="/dashboard" icon={BarChart3} text="Dashboard" />
              <MobileNavLink to="/login" icon={LogIn} text="Login" />
              <MobileNavLink to="/register" icon={UserPlus} text="Register" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Desktop Navigation Link Component
const NavLink = ({ to, icon: Icon, text }) => (
  <Link
    to={to}
    className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-105 group"
  >
    <Icon className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
    <span className="group-hover:text-blue-400 transition-colors">{text}</span>
  </Link>
);

// Mobile Navigation Link Component
const MobileNavLink = ({ to, icon: Icon, text }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 hover:translate-x-1"
  >
    <Icon className="w-5 h-5 text-blue-400" />
    <span className="text-lg">{text}</span>
  </Link>
);

export default Navbar;