// services/api.js - Frontend API Service
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Skills API
export const skillsAPI = {
  // Get all skills
  getAll: async () => {
    try {
      const response = await apiClient.get('/skills');
      return response.data;
    } catch (error) {
      console.error('Error fetching skills:', error);
      throw error;
    }
  },

  // Get a specific skill by ID
  getById: async (skillId) => {
    try {
      const response = await apiClient.get(`/skills/${skillId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching skill:', error);
      throw error;
    }
  },

  // Create a new skill
  create: async (skillData) => {
    try {
      const response = await apiClient.post('/skills', skillData);
      return response.data;
    } catch (error) {
      console.error('Error creating skill:', error);
      throw error;
    }
  },

  // Update a skill
  update: async (skillId, skillData) => {
    try {
      const response = await apiClient.put(`/skills/${skillId}`, skillData);
      return response.data;
    } catch (error) {
      console.error('Error updating skill:', error);
      throw error;
    }
  },

  // Delete a skill
  delete: async (skillId) => {
    try {
      const response = await apiClient.delete(`/skills/${skillId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting skill:', error);
      throw error;
    }
  },

  // Bulk upload skills
  bulkUpload: async (file) => {
    try {
      const formData = new FormData();
      formData.append('skillsFile', file);
      
      const response = await apiClient.post('/skills/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error bulk uploading skills:', error);
      throw error;
    }
  },

  // Search skills
  search: async (query, filters = {}) => {
    try {
      const response = await apiClient.get('/skills/search', {
        params: { q: query, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching skills:', error);
      throw error;
    }
  },
};

// File upload API
export const uploadAPI = {
  // Upload a single file
  uploadFile: async (file, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload multiple files
  uploadMultiple: async (files, onProgress = null) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const response = await apiClient.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  },

  // Delete an uploaded file
  deleteFile: async (fileId) => {
    try {
      const response = await apiClient.delete(`/upload/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  // Get skills analytics
  getSkillsAnalytics: async () => {
    try {
      const response = await apiClient.get('/analytics/skills');
      return response.data;
    } catch (error) {
      console.error('Error fetching skills analytics:', error);
      throw error;
    }
  },

  // Get user analytics
  getUserAnalytics: async () => {
    try {
      const response = await apiClient.get('/analytics/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  // Get dashboard metrics
  getDashboardMetrics: async () => {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Get analytics by date range
  getAnalyticsByDateRange: async (startDate, endDate) => {
    try {
      const response = await apiClient.get('/analytics/range', {
        params: { start: startDate, end: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics by date range:', error);
      throw error;
    }
  },
};

// Authentication API
export const authAPI = {
  // Login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error logging out:', error);
      // Still remove token even if logout fails
      localStorage.removeItem('authToken');
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Update password
  updatePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/auth/update-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get all users (admin only)
  getAll: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Delete user account
  deleteAccount: async () => {
    try {
      const response = await apiClient.delete('/users/account');
      localStorage.removeItem('authToken');
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

// Utility functions
export const utils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Get auth token
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },

  // Clear auth token
  clearAuthToken: () => {
    localStorage.removeItem('authToken');
  },

  // Handle API errors
  handleApiError: (error) => {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection.',
        status: null,
        data: null
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        status: null,
        data: null
      };
    }
  },
};

// Export the axios instance for custom requests
export { apiClient };

// Default export
export default {
  skills: skillsAPI,
  upload: uploadAPI,
  analytics: analyticsAPI,
  auth: authAPI,
  user: userAPI,
  utils,
};