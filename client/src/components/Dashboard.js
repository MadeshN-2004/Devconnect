import React, { useState, useEffect, useRef } from 'react';
import { User, Code, Briefcase, Plus, Edit, Trash2, Save, X, Github, ExternalLink, Users, UserPlus, UserCheck, UserX, Bell, Search, MessageCircle, Send, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWebSocket } from '../context/WebSocketContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Connection states
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConnectionTab, setActiveConnectionTab] = useState('discover');
  
  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  
  // Form states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    technologies: '',
    githubLink: '',
    liveLink: ''
  });
  const [newSkill, setNewSkill] = useState({ skill: '', level: 'Intermediate' });
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    place: '',
    role: ''
  });

  // WebSocket connection
  const socket = useWebSocket();

  // Get token and user data
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      navigate('/login');
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const getUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData).id;
    }
    return null;
  };

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.sender._id === selectedChat?._id) {
        setChatMessages(prev => [
          ...prev,
          {
            id: message._id,
            senderId: message.sender._id,
            senderName: message.sender.name,
            message: message.content,
            timestamp: new Date(message.createdAt),
            isOwn: false
          }
        ]);
      }
    };

    const handleUserOnline = (userId) => {
      setOnlineUsers(prev => new Set(prev.add(userId)));
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [socket, selectedChat]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Chat functions
  const startChat = (connection) => {
    setSelectedChat(connection);
    setChatOpen(true);
    loadChatMessages(connection._id);
  };

  const loadChatMessages = async (connectionId) => {
    setChatLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`http://localhost:5000/api/messages/${connectionId}`, {
        headers
      });

      if (res.ok) {
        const messages = await res.json();
        setChatMessages(messages.map(msg => ({
          id: msg._id,
          senderId: msg.sender._id,
          senderName: msg.sender.name,
          message: msg.content,
          timestamp: new Date(msg.createdAt),
          isOwn: msg.sender._id === getUserId()
        })));
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Optimistically add message to UI
      const tempId = Date.now();
      const optimisticMessage = {
        id: tempId,
        senderId: getUserId(),
        senderName: user?.name || 'You',
        message: newMessage.trim(),
        timestamp: new Date(),
        isOwn: true
      };
      setChatMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // Send to server
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipientId: selectedChat._id,
          content: newMessage.trim()
        })
      });

      if (res.ok) {
        const sentMessage = await res.json();
        // Replace optimistic message with actual message from server
        setChatMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? {
                  id: sentMessage._id,
                  senderId: sentMessage.sender._id,
                  senderName: sentMessage.sender.name,
                  message: sentMessage.content,
                  timestamp: new Date(sentMessage.createdAt),
                  isOwn: true
                }
              : msg
          )
        );
      } else {
        // Remove optimistic message if failed
        setChatMessages(prev => prev.filter(msg => msg.id !== tempId));
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  };

  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === new Date(today.getTime() - 86400000).toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'connections') {
      fetchConnectionData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const userId = getUserId();
      if (!userId) {
        toast.error('User data not found. Please login again.');
        navigate('/login');
        return;
      }
      
      // Fetch user profile
      const userRes = await fetch('http://localhost:5000/api/users/profile', {
        headers
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setProfileForm({
          name: userData.user.name || '',
          email: userData.user.email || '',
          phone: userData.user.phone || '',
          place: userData.user.place || '',
          role: userData.user.role || ''
        });
      } else {
        const errorData = await userRes.json();
        toast.error(errorData.message || 'Failed to fetch profile');
      }

      // Fetch projects
      const projectsRes = await fetch(`http://localhost:5000/api/projects/user/${userId}`, {
        headers
      });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);
      }

      // Fetch skills
      const skillsRes = await fetch(`http://localhost:5000/api/skills/${userId}`, {
        headers
      });
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setSkills(skillsData.data || []);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Connection functions
  const fetchConnectionData = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Fetch discover users
      const discoverRes = await fetch('http://localhost:5000/api/connections/discover', {
        headers
      });
      if (discoverRes.ok) {
        const discoverData = await discoverRes.json();
        setDiscoverUsers(discoverData.data || []);
      }

      // Fetch connections
      const connectionsRes = await fetch('http://localhost:5000/api/connections/my-connections', {
        headers
      });
      if (connectionsRes.ok) {
        const connectionsData = await connectionsRes.json();
        setConnections(connectionsData.data || []);
      }

      // Fetch received requests
      const receivedRes = await fetch('http://localhost:5000/api/connections/requests/received', {
        headers
      });
      if (receivedRes.ok) {
        const receivedData = await receivedRes.json();
        setReceivedRequests(receivedData.data || []);
      }

      // Fetch sent requests
      const sentRes = await fetch('http://localhost:5000/api/connections/requests/sent', {
        headers
      });
      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setSentRequests(sentData.data || []);
      }
    } catch (error) {
      console.error('Error fetching connection data:', error);
      toast.error('Failed to load connection data');
    }
  };

  const sendConnectionRequest = async (recipientId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch('http://localhost:5000/api/connections/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({ recipientId })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Connection request sent successfully!');
        fetchConnectionData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const respondToRequest = async (connectionId, action) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`http://localhost:5000/api/connections/respond/${connectionId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ action })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Connection request ${action}ed successfully!`);
        fetchConnectionData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to respond to connection request');
      }
    } catch (error) {
      console.error('Error responding to connection request:', error);
      toast.error('Failed to respond to connection request');
    }
  };

  const removeConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`http://localhost:5000/api/connections/remove/${connectionId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        toast.success('Connection removed successfully!');
        fetchConnectionData(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  // Filter discover users based on search term
  const filteredDiscoverUsers = discoverUsers.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.place?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateProfile = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch('http://localhost:5000/api/users/profile/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileForm)
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setEditingProfile(false);
        toast.success('Profile updated successfully!');
        
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({...userData, ...data.user}));
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const addProject = async () => {
    if (!newProject.title || !newProject.description) {
      toast.error('Title and description are required');
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const userId = getUserId();
      
      // Clean up empty URLs
      const projectData = {
        ...newProject,
        userId,
        githubLink: newProject.githubLink.trim() || undefined,
        liveLink: newProject.liveLink.trim() || undefined
      };

      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData)
      });

      const data = await res.json();

      if (res.ok) {
        setProjects([...projects, data.data]);
        setNewProject({
          title: '',
          description: '',
          technologies: '',
          githubLink: '',
          liveLink: ''
        });
        toast.success('Project added successfully!');
      } else {
        toast.error(data.message || 'Failed to add project');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
    }
  };

  const updateProject = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Clean up empty URLs
      const projectData = {
        ...editingProject,
        githubLink: editingProject.githubLink?.trim() || undefined,
        liveLink: editingProject.liveLink?.trim() || undefined
      };

      const res = await fetch(`http://localhost:5000/api/projects/${editingProject._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(projectData)
      });

      const data = await res.json();

      if (res.ok) {
        setProjects(projects.map(p => p._id === data.data._id ? data.data : p));
        setEditingProject(null);
        toast.success('Project updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setProjects(projects.filter(p => p._id !== projectId));
        toast.success('Project deleted successfully!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const addSkill = async () => {
    if (!newSkill.skill) {
      toast.error('Skill name is required');
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const userId = getUserId();

      const res = await fetch('http://localhost:5000/api/skills', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...newSkill, userId })
      });

      const data = await res.json();

      if (res.ok) {
        setSkills([...skills, data.data]);
        setNewSkill({ skill: '', level: 'Intermediate' });
        toast.success('Skill added successfully!');
      } else {
        toast.error(data.message || 'Failed to add skill');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    }
  };

  const deleteSkill = async (skillId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`http://localhost:5000/api/skills/${skillId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setSkills(skills.filter(s => s._id !== skillId));
        toast.success('Skill deleted successfully!');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete skill');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-purple-400 border-b-transparent animate-spin animate-reverse mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to DevConnect
            </h2>
            <p className="text-gray-300 text-lg animate-pulse">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Code className="text-white" size={24} />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-25 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  DevConnect
                </h1>
                <p className="text-gray-400 text-sm">Developer Network Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur opacity-25"></div>
                </div>
                <div>
                  <span className="text-white font-semibold">{user?.name || 'Welcome, Developer!'}</span>
                  <p className="text-gray-400 text-sm">{user?.role || 'Developer'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="relative px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                <span className="relative">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-800/70 backdrop-blur-lg min-h-screen border-r border-gray-700/50">
          <div className="p-4">
            <ul className="space-y-3">
              {[
                { id: 'overview', label: 'Overview', icon: User, color: 'from-blue-500 to-purple-500' },
                { id: 'profile', label: 'Profile', icon: User, color: 'from-green-500 to-teal-500' },
                { id: 'skills', label: 'Skills', icon: Code, color: 'from-yellow-500 to-orange-500' },
                { id: 'projects', label: 'Projects', icon: Briefcase, color: 'from-purple-500 to-pink-500' },
                { id: 'connections', label: 'Connections', icon: Users, color: 'from-indigo-500 to-blue-500' }
              ].map(({ id, label, icon: Icon, color }) => (
                <li key={id}>
                  <button
                    onClick={() => setActiveTab(id)}
                    className={`relative w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 group ${
                      activeTab === id
                        ? `bg-gradient-to-r ${color} text-white shadow-lg transform scale-105`
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-102'
                    }`}
                  >
                    {activeTab === id && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-xl blur opacity-25 animate-pulse`}></div>
                    )}
                    <Icon size={20} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                    {activeTab === id && (
                      <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Notifications at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <button className="relative w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 group">
              <Bell size={18} className="group-hover:animate-bounce" />
              <span className="font-medium">Notifications</span>
              {receivedRequests.length > 0 && (
                <div className="relative ml-auto">
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                    {receivedRequests.length}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur opacity-25 animate-pulse"></div>
                </div>
              )}
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Welcome to DevConnect
                </h1>
                <p className="text-gray-300 text-lg">Your gateway to the developer community. Connect, collaborate, and create amazing things together!</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Projects', value: projects.length, icon: Briefcase, gradient: 'from-blue-500 to-blue-600' },
                  { title: 'Skills', value: skills.length, icon: Code, gradient: 'from-green-500 to-green-600' },
                  { title: 'Connections', value: connections.length, icon: Users, gradient: 'from-purple-500 to-purple-600' },
                  { title: 'Profile Status', value: user?.name && user?.email ? 'Complete' : 'Incomplete', icon: User, gradient: 'from-orange-500 to-orange-600', isText: true }
                ].map((stat, index) => (
                  <div key={stat.title} className={`relative bg-gradient-to-r ${stat.gradient} rounded-2xl p-6 transform hover:scale-105 transition-all duration-200 shadow-xl`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur opacity-25`}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-white">
                          <p className="text-sm font-medium opacity-90">{stat.title}</p>
                          <p className={`${stat.isText ? 'text-2xl' : 'text-3xl'} font-bold`}>
                            {stat.value}
                          </p>
                        </div>
                        <stat.icon className="text-white/80" size={28} />
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full animate-pulse" 
                          style={{ width: `${Math.min(100, (stat.value || 0) * 10)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project, index) => (
                      <div key={project._id} className="flex items-start space-x-4 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 hover:scale-102 transition-transform">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mt-2 shadow-lg"></div>
                        <div>
                          <p className="text-white font-medium">Completed Project: {project.title}</p>
                          <p className="text-gray-400 text-sm">2 weeks ago</p>
                        </div>
                      </div>
                    ))}
                    
                    {skills.slice(0, 2).map((skill, index) => (
                      <div key={skill._id} className="flex items-start space-x-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:scale-102 transition-transform">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2 shadow-lg"></div>
                        <div>
                          <p className="text-white font-medium">Added Skill: {skill.skill}</p>
                          <p className="text-gray-400 text-sm">1 month ago</p>
                        </div>
                      </div>
                    ))}
                    
                    {connections.slice(0, 1).map((connection, index) => (
                      <div key={connection._id} className="flex items-start space-x-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:scale-102 transition-transform">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-2 shadow-lg"></div>
                        <div>
                          <p className="text-white font-medium">New Connection: {connection.name}</p>
                          <p className="text-gray-400 text-sm">2 months ago</p>
                        </div>
                      </div>
                    ))}
                    
                    {projects.length === 0 && skills.length === 0 && connections.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User className="text-white" size={24} />
                        </div>
                        <p className="text-gray-400">Start your DevConnect journey by adding your first project or skill!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Requests */}
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mr-3"></div>
                    Connection Requests
                  </h2>
                  <div className="space-y-4">
                    {receivedRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="text-white" size={24} />
                        </div>
                        <p className="text-gray-400">No pending requests</p>
                      </div>
                    ) : (
                      receivedRequests.slice(0, 3).map((request) => (
                        <div key={request._id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl border border-gray-600/50 hover:scale-102 transition-transform">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {request.requester.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-25"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold">{request.requester.name}</p>
                            <p className="text-gray-300 text-sm">{request.requester.role}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => respondToRequest(request._id, 'accept')}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => respondToRequest(request._id, 'reject')}
                              className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    Profile Information
                  </h1>
                  <p className="text-gray-300 text-lg">Manage your account details and preferences.</p>
                </div>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                  <Edit size={18} className="relative z-10" />
                  <span className="relative z-10">{editingProfile ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-xl">
                {editingProfile ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'name', placeholder: 'Full Name', type: 'text' },
                        { key: 'email', placeholder: 'Email Address', type: 'email' },
                        { key: 'phone', placeholder: 'Phone Number', type: 'tel' },
                        { key: 'place', placeholder: 'Location', type: 'text' }
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {field.placeholder}
                          </label>
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={profileForm[field.key]}
                            onChange={(e) => setProfileForm({...profileForm, [field.key]: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 hover:bg-gray-700/70"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                      <select
                        value={profileForm.role}
                        onChange={(e) => setProfileForm({...profileForm, role: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-200 hover:bg-gray-700/70"
                      >
                        <option value="">Select Role</option>
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                      </select>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={updateProfile}
                        className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                      >
                        <Save size={18} />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                      >
                        <X size={18} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { label: 'Full Name', value: user?.name || 'Not provided' },
                      { label: 'Email Address', value: user?.email || 'Not provided' },
                      { label: 'Phone Number', value: user?.phone || 'Not provided' },
                      { label: 'Location', value: user?.place || 'Not provided' },
                    ].map((field) => (
                      <div key={field.label} className="p-4 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-xl border border-gray-600/30">
                        <label className="block text-sm font-medium text-gray-400 mb-2">{field.label}</label>
                        <p className="text-white text-lg font-medium">{field.value}</p>
                      </div>
                    ))}
                    <div className="md:col-span-2 p-4 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-xl border border-gray-600/30">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                      <p className="text-white text-lg font-medium">{user?.role || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  Skills
                </h1>
                <p className="text-gray-300 text-lg">Manage your technical skills and expertise levels.</p>
              </div>

              {/* Add Skill Form */}
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full mr-3"></div>
                  Add New Skill
                </h2>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    placeholder="Skill name (e.g., React, Node.js)"
                    value={newSkill.skill}
                    onChange={(e) => setNewSkill({...newSkill, skill: e.target.value})}
                    className="flex-1 px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 hover:bg-gray-700/70"
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
                    className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white transition-all duration-200 hover:bg-gray-700/70"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <button
                    onClick={addSkill}
                    className="relative flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                  >
                    <Plus size={18} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Skills List */}
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full mr-3"></div>
                  Your Skills
                </h2>
                {skills.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Code className="text-white" size={32} />
                    </div>
                    <p className="text-gray-400 text-lg">No skills added yet. Add your first skill above!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((skill) => (
                      <div key={skill._id} className="group relative bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl p-4 border border-gray-600/30 hover:scale-105 transition-all duration-200 hover:shadow-xl">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-white text-lg">{skill.skill}</h3>
                          <button
                            onClick={() => deleteSkill(skill._id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                            skill.level === 'Expert' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                            skill.level === 'Advanced' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                            skill.level === 'Intermediate' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' :
                            'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                          }`}>
                            {skill.level}
                          </span>
                          <div className={`w-3 h-3 rounded-full ${
                            skill.level === 'Expert' ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                            skill.level === 'Advanced' ? 'bg-blue-400 shadow-lg shadow-blue-400/50' :
                            skill.level === 'Intermediate' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' :
                            'bg-gray-400 shadow-lg shadow-gray-400/50'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  Projects
                </h1>
                <p className="text-gray-300 text-lg">Showcase your work and track your development progress.</p>
              </div>

              {/* Add Project Form */}
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mr-3"></div>
                  Add New Project
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 hover:bg-gray-700/70"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (e.g., React, Node.js)"
                      value={newProject.technologies}
                      onChange={(e) => setNewProject({...newProject, technologies: e.target.value})}
                      className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 hover:bg-gray-700/70"
                    />
                  </div>
                  <textarea
                    placeholder="Project Description"
                    rows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none transition-all duration-200 hover:bg-gray-700/70"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="url"
                      placeholder="GitHub Repository URL (optional)"
                      value={newProject.githubLink}
                      onChange={(e) => setNewProject({...newProject, githubLink: e.target.value})}
                      className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 hover:bg-gray-700/70"
                    />
                    <input
                      type="url"
                      placeholder="Live Demo URL (optional)"
                      value={newProject.liveLink}
                      onChange={(e) => setNewProject({...newProject, liveLink: e.target.value})}
                      className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200 hover:bg-gray-700/70"
                    />
                  </div>
                  <button
                    onClick={addProject}
                    className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                  >
                    <Plus size={18} />
                    <span>Add Project</span>
                  </button>
                </div>
              </div>

              {/* Projects List */}
              <div className="space-y-6">
                {projects.length === 0 ? (
                  <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 text-center border border-gray-700/50 shadow-xl">
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Briefcase className="text-white" size={36} />
                    </div>
                    <p className="text-gray-400 text-xl">No projects added yet. Create your first project above!</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project._id} className="group bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:shadow-2xl transition-all duration-200 hover:scale-102">
                      {editingProject && editingProject._id === project._id ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={editingProject.title}
                              onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                              className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-200"
                            />
                            <input
                              type="text"
                              value={editingProject.technologies}
                              onChange={(e) => setEditingProject({...editingProject, technologies: e.target.value})}
                              className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-200"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={editingProject.description}
                            onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white resize-none transition-all duration-200"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="url"
                              placeholder="GitHub Repository URL (optional)"
                              value={editingProject.githubLink || ''}
                              onChange={(e) => setEditingProject({...editingProject, githubLink: e.target.value})}
                              className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                            />
                            <input
                              type="url"
                              placeholder="Live Demo URL (optional)"
                              value={editingProject.liveLink || ''}
                              onChange={(e) => setEditingProject({...editingProject, liveLink: e.target.value})}
                              className="px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                            />
                          </div>
                          <div className="flex space-x-4">
                            <button
                              onClick={updateProject}
                              className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                            >
                              <Save size={18} />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingProject(null)}
                              className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl"
                            >
                              <X size={18} />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                {project.technologies.split(',').map((tech, index) => (
                                  <span key={index} className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                                    {tech.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => setEditingProject(project)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-110"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => deleteProject(project._id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-6 leading-relaxed text-lg">{project.description}</p>
                          <div className="flex space-x-4">
                            {project.githubLink && (
                              <a
                                href={project.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl hover:from-gray-600 hover:to-gray-700"
                              >
                                <Github size={18} />
                                <span>GitHub</span>
                              </a>
                            )}
                            {project.liveLink && (
                              <a
                                href={project.liveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-xl hover:from-green-600 hover:to-emerald-700"
                              >
                                <ExternalLink size={18} />
                                <span>Live Demo</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  Connections
                </h1>
                <p className="text-gray-300 text-lg">Build your professional network and connect with other developers.</p>
              </div>

              {/* Connection Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Total Connections', value: connections.length, gradient: 'from-blue-500 to-blue-600', icon: Users },
                  { title: 'Pending Requests', value: receivedRequests.length, gradient: 'from-yellow-500 to-orange-600', icon: Bell },
                  { title: 'Sent Requests', value: sentRequests.length, gradient: 'from-purple-500 to-purple-600', icon: UserPlus },
                  { title: 'Available Users', value: filteredDiscoverUsers.length, gradient: 'from-green-500 to-emerald-600', icon: Search }
                ].map((stat) => (
                  <div key={stat.title} className={`relative bg-gradient-to-r ${stat.gradient} rounded-2xl p-6 transform hover:scale-105 transition-all duration-200 shadow-xl`}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur opacity-25`}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className="text-white/80" size={24} />
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                      <p className="text-white/90 text-sm font-medium">{stat.title}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connection Tabs */}
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-xl">
                <div className="flex flex-wrap border-b border-gray-700/50 p-4 gap-2">
                  {[
                    { id: 'discover', label: 'Discover Users', gradient: 'from-green-500 to-emerald-600' },
                    { id: 'my-connections', label: 'My Connections', gradient: 'from-blue-500 to-blue-600' },
                    { id: 'requests', label: `Requests (${receivedRequests.length})`, gradient: 'from-yellow-500 to-orange-600' },
                    { id: 'sent', label: 'Sent Requests', gradient: 'from-purple-500 to-purple-600' }
                  ].map(({ id, label, gradient }) => (
                    <button
                      key={id}
                      onClick={() => setActiveConnectionTab(id)}
                      className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        activeConnectionTab === id
                          ? `bg-gradient-to-r ${gradient} text-white shadow-lg transform scale-105`
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50 hover:scale-102'
                      }`}
                    >
                      {activeConnectionTab === id && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl blur opacity-25 animate-pulse`}></div>
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Discover Users */}
                  {activeConnectionTab === 'discover' && (
                    <div className="space-y-6">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search users by name, role, or location..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 text-lg transition-all duration-200"
                        />
                      </div>

                      {filteredDiscoverUsers.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="text-white" size={32} />
                          </div>
                          <p className="text-gray-400 text-xl">
                            {searchTerm ? 'No users found matching your search.' : 'No new users to discover right now.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredDiscoverUsers.map((discoverUser) => (
                            <div key={discoverUser._id} className="group bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-2xl p-6 border border-gray-600/30 hover:scale-105 transition-all duration-200 hover:shadow-xl">
                              <div className="text-center mb-6">
                                <div className="relative mx-auto w-16 h-16 mb-4">
                                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl">
                                    {discoverUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <h4 className="font-bold text-white text-lg mb-1">
                                  {discoverUser.name || 'Anonymous User'}
                                </h4>
                                <p className="text-green-400 font-medium">{discoverUser.role || 'Developer'}</p>
                                <p className="text-gray-400 text-sm">{discoverUser.place || 'Location not specified'}</p>
                              </div>
                              <button
                                onClick={() => sendConnectionRequest(discoverUser._id)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                              >
                                <UserPlus size={18} />
                                <span>Connect</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* My Connections */}
                  {activeConnectionTab === 'my-connections' && (
                    <div className="space-y-6">
                      {connections.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="text-white" size={32} />
                          </div>
                          <p className="text-gray-400 text-xl">No connections yet. Start connecting with other developers!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {connections.map((connection) => (
                            <div key={connection._id} className="group bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-2xl p-6 border border-gray-600/30 hover:scale-105 transition-all duration-200 hover:shadow-xl">
                              <div className="text-center mb-6">
                                <div className="relative mx-auto w-16 h-16 mb-4">
                                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl">
                                    {connection.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                                  {/* Online indicator */}
                                  {onlineUsers.has(connection._id) && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full shadow-lg"></div>
                                  )}
                                </div>
                                <h4 className="font-bold text-white text-lg mb-1">
                                  {connection.name || 'Anonymous User'}
                                </h4>
                                <p className="text-blue-400 font-medium">{connection.role || 'Developer'}</p>
                                <p className="text-gray-400 text-sm">{connection.place || 'Location not specified'}</p>
                                <p className="text-gray-500 text-xs mt-2">
                                  Connected on {new Date(connection.connectedAt).toLocaleDateString()}
                                </p>
                                {onlineUsers.has(connection._id) && (
                                  <p className="text-green-400 text-sm mt-1 font-medium">● Online</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startChat(connection)}
                                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                                >
                                  <MessageCircle size={16} />
                                  <span>Chat</span>
                                </button>
                                <button
                                  onClick={() => removeConnection(connection.connectionId)}
                                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                                >
                                  <UserX size={16} />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Received Requests */}
                  {activeConnectionTab === 'requests' && (
                    <div className="space-y-6">
                      {receivedRequests.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="text-white" size={32} />
                          </div>
                          <p className="text-gray-400 text-xl">No pending requests</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {receivedRequests.map((request) => (
                            <div key={request._id} className="flex items-center space-x-6 p-6 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-2xl border border-gray-600/30 hover:scale-102 transition-all duration-200 hover:shadow-xl">
                              <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                  {request.requester.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full blur opacity-25"></div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-white text-lg">{request.requester.name}</h4>
                                <p className="text-yellow-400 font-medium">{request.requester.role}</p>
                                <p className="text-gray-400 text-sm">{request.requester.place}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Requested on {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => respondToRequest(request._id, 'accept')}
                                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => respondToRequest(request._id, 'reject')}
                                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sent Requests */}
                  {activeConnectionTab === 'sent' && (
                    <div className="space-y-6">
                      {sentRequests.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserPlus className="text-white" size={32} />
                          </div>
                          <p className="text-gray-400 text-xl">No sent requests. Start connecting with other users!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {sentRequests.map((request) => (
                            <div key={request._id} className="group bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-2xl p-6 border border-gray-600/30 hover:scale-105 transition-all duration-200 hover:shadow-xl">
                              <div className="text-center mb-6">
                                <div className="relative mx-auto w-16 h-16 mb-4">
                                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl">
                                    {request.recipient.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                                </div>
                                <h4 className="font-bold text-white text-lg mb-1">
                                  {request.recipient.name || 'Anonymous User'}
                                </h4>
                                <p className="text-purple-400 font-medium">{request.recipient.role || 'Developer'}</p>
                                <p className="text-gray-400 text-sm">{request.recipient.place || 'Location not specified'}</p>
                                <p className="text-gray-500 text-xs mt-2">
                                  Sent on {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 rounded-full text-sm font-bold border border-yellow-500/30">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                                  Pending Response
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Chat Window */}
      {chatOpen && selectedChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl w-full max-w-4xl h-5/6 flex flex-col mx-4 border border-gray-700/50 shadow-2xl">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-t-2xl">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 lg:hidden"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {selectedChat.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25"></div>
                  {onlineUsers.has(selectedChat._id) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full shadow-lg"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedChat.name}</h3>
                  <p className="text-sm text-gray-300">
                    {onlineUsers.has(selectedChat._id) ? '● Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110">
                  <Phone size={20} />
                </button>
                <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110">
                  <Video size={20} />
                </button>
                <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110">
                  <MoreVertical size={20} />
                </button>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-900/20 to-gray-800/20">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <div className="absolute inset-0 rounded-full h-12 w-12 border-4 border-purple-500 border-b-transparent animate-spin animate-reverse"></div>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(chatMessages[index - 1].timestamp) !== formatDate(message.timestamp);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center mb-6">
                            <span className="px-4 py-2 bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-300 text-sm rounded-full border border-gray-600/50 backdrop-blur">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                            message.isOwn 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                              : 'bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-white backdrop-blur border border-gray-600/30'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.message}</p>
                            <p className={`text-xs mt-2 ${
                              message.isOwn ? 'text-blue-100' : 'text-gray-400'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-b-2xl">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 px-4 py-3 bg-gray-700/50 backdrop-blur border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="relative px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <Send size={18} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Floating Button */}
      {!chatOpen && connections.length > 0 && (
        <div className="fixed bottom-8 right-8 z-40">
          <div className="relative">
            <button
              onClick={() => {
                if (connections.length === 1) {
                  startChat(connections[0]);
                } else {
                  // Show a quick menu to select connection
                  setActiveTab('connections');
                  setActiveConnectionTab('my-connections');
                }
              }}
              className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              <MessageCircle size={28} className="relative z-10" />
            </button>
            {/* Online indicator */}
            {onlineUsers.size > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs text-white font-bold">{onlineUsers.size}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;