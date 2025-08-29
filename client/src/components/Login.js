import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Make actual API call to your backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message
        alert('Login successful! Welcome back!');
        
        // Navigate to dashboard (you'll need to handle this in your main app)
        window.location.href = '/dashboard';
      } else {
        // Handle error responses
        alert(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/4 right-16 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
        </div>
        
        {/* Animated Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-300/10 to-transparent animate-pulse delay-700"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl mb-6 shadow-2xl relative">
              <LogIn className="w-10 h-10 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur opacity-50 animate-pulse"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-300 text-lg">Sign in to continue your journey</p>
          </div>

          {/* Form Container */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl"></div>
              
              <div className="relative z-10">
                <div onSubmit={onSubmit} className="contents">
                  {/* Email Field */}
                  <div className="mb-6">
                    <div className="relative group">
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300 z-10">
                          <Mail className="h-5 w-5" />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={onChange}
                          required
                          placeholder="Email Address"
                          className="pl-12 pr-4 py-4 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300 text-white placeholder-gray-300 hover:bg-white/15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-8">
                    <div className="relative group">
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-300 z-10">
                          <Lock className="h-5 w-5" />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={password}
                          onChange={onChange}
                          required
                          placeholder="Enter your password"
                          className="pl-12 pr-12 py-4 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/20 transition-all duration-300 text-white placeholder-gray-300 hover:bg-white/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-gray-300 hover:text-white transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={onSubmit}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold flex justify-center items-center disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing you in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 relative z-10">
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Register Link */}
                <div className="text-center mt-8">
                  <p className="text-gray-300 text-sm">
                    Don't have an account?{" "}
                    <span
                      className="text-blue-400 hover:text-blue-300 cursor-pointer font-semibold transition-colors duration-200 hover:underline"
                      onClick={() => window.location.href = '/register'}
                    >
                      Create one here
                    </span>
                  </p>
                </div>

                {/* Additional Features */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
                      onClick={() => {
                        alert('Please contact support for password reset');
                      }}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom decorative elements */}
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-xl"></div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-xs">
              Secure login powered by DevConnect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;