import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Phone, MapPin, Briefcase, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    place: '',
    role: '',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare the data to send to the backend
      const userData = {
        name: form.name,
        email: form.email,
        password: form.password,
        place: form.place,
        role: form.role,
        phone: form.phone
      };

      // Updated to use localhost backend URL
      const response = await axios.post('http://localhost:5000/api/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Check if registration was successful
      if (response.data.success) {
        setShowSuccess(true);
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        setTimeout(() => {
          setShowSuccess(false);
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Please make sure the backend is running on port 5000.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Join DevConnect
            </h1>
            <p className="text-gray-300">Connect with developers worldwide</p>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl"></div>
              
              {showSuccess && (
                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-2xl">
                    <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                  </div>
                </div>
              )}

              <div className="relative z-10">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Name */}
                <InputField 
                  icon={<User className="w-5 h-5" />} 
                  name="name" 
                  placeholder="Full Name" 
                  value={form.name} 
                  onChange={handleChange} 
                />

                {/* Email */}
                <InputField 
                  icon={<Mail className="w-5 h-5" />} 
                  name="email" 
                  type="email" 
                  placeholder="Email Address" 
                  value={form.email} 
                  onChange={handleChange} 
                />

                {/* Phone */}
                <InputField 
                  icon={<Phone className="w-5 h-5" />} 
                  name="phone" 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={form.phone} 
                  onChange={handleChange} 
                />

                {/* Place */}
                <InputField 
                  icon={<MapPin className="w-5 h-5" />} 
                  name="place" 
                  placeholder="Your City/Location" 
                  value={form.place} 
                  onChange={handleChange} 
                />

                {/* Role */}
                <div className="mb-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300">
                        <Briefcase className="w-5 h-5" />
                      </span>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        required
                        className="pl-12 pr-4 py-4 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white/20 transition-all duration-300 text-white placeholder-gray-300 appearance-none cursor-pointer hover:bg-white/15"
                      >
                        <option value="" className="bg-gray-800 text-white">Select Your Role</option>
                        <option value="Frontend Developer" className="bg-gray-800 text-white">Frontend Developer</option>
                        <option value="Backend Developer" className="bg-gray-800 text-white">Backend Developer</option>
                        <option value="Full Stack Developer" className="bg-gray-800 text-white">Full Stack Developer</option>
                        <option value="UI/UX Designer" className="bg-gray-800 text-white">UI/UX Designer</option>
                        <option value="DevOps Engineer" className="bg-gray-800 text-white">DevOps Engineer</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <InputField 
                  icon={<Lock className="w-5 h-5" />} 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create Password (min 6 chars)" 
                  value={form.password} 
                  onChange={handleChange} 
                  isPassword 
                  togglePassword={() => setShowPassword(!showPassword)} 
                  showPassword={showPassword} 
                />

                {/* Confirm Password */}
                <InputField 
                  icon={<Lock className="w-5 h-5" />} 
                  name="confirmPassword" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  isPassword 
                  togglePassword={() => setShowPassword(!showPassword)} 
                  showPassword={showPassword} 
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex justify-center items-center disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 relative z-10">
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center mt-6">
                  <p className="text-gray-300 text-sm">
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => navigate("/login")} 
                      className="text-purple-400 font-semibold hover:text-purple-300 transition-colors duration-200 hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ icon, name, type = "text", placeholder, value, onChange, isPassword, togglePassword, showPassword }) => (
  <div className="mb-6">
    <div className="relative group">
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300 z-10">
          {icon}
        </span>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          className="pl-12 pr-12 py-4 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white/20 transition-all duration-300 text-white placeholder-gray-300 hover:bg-white/15"
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-gray-300 hover:text-white transition-colors duration-200"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  </div>
);

export default Register;