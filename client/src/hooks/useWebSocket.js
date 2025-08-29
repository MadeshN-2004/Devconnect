// hooks/useWebSocket.js - React Hook for WebSocket Integration
import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const useWebSocket = (url = 'http://localhost:5000') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [skills, setSkills] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    try {
      const newSocket = io(url, {
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect unless it was a manual disconnect
        if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setError(`Connection failed: ${error.message}`);
        setIsConnected(false);
      });

      // Skills-related events
      newSocket.on('skillsData', (data) => {
        setSkills(data);
      });

      newSocket.on('skillUpdated', (updatedSkill) => {
        setSkills(prev => prev.map(skill => 
          skill.id === updatedSkill.id ? updatedSkill : skill
        ));
      });

      newSocket.on('skillAdded', (newSkill) => {
        setSkills(prev => [...prev, newSkill]);
      });

      newSocket.on('skillDeleted', (skillId) => {
        setSkills(prev => prev.filter(skill => skill.id !== skillId));
      });

      newSocket.on('skillsBulkAdded', (newSkills) => {
        setSkills(prev => [...prev, ...newSkills]);
      });

      // Upload progress events
      newSocket.on('uploadProgress', (data) => {
        setUploadProgress(prev => ({
          ...prev,
          [data.filename]: data.progress
        }));
      });

      newSocket.on('uploadComplete', (data) => {
        setUploadProgress(prev => ({
          ...prev,
          [data.filename]: 100
        }));
        
        // Remove progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[data.filename];
            return newProgress;
          });
        }, 3000);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      setError(`Failed to connect: ${error.message}`);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.disconnect();
    }
    
    setSocket(null);
    setIsConnected(false);
  }, [socket]);

  // Skills management functions
  const updateSkill = useCallback((skillId, level) => {
    if (socket && isConnected) {
      socket.emit('updateSkill', { id: skillId, level });
    }
  }, [socket, isConnected]);

  const addSkill = useCallback((skillData) => {
    if (socket && isConnected) {
      socket.emit('addSkill', skillData);
    }
  }, [socket, isConnected]);

  const deleteSkill = useCallback((skillId) => {
    if (socket && isConnected) {
      socket.emit('deleteSkill', skillId);
    }
  }, [socket, isConnected]);

  // File upload function
  const uploadFile = useCallback(async (file, endpoint = '/api/upload') => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${url}${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, [url]);

  // Bulk skills upload
  const uploadSkills = useCallback(async (file) => {
    return uploadFile(file, '/api/skills/bulk');
  }, [uploadFile]);

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    skills,
    uploadProgress,
    error,
    updateSkill,
    addSkill,
    deleteSkill,
    uploadFile,
    uploadSkills,
    connect,
    disconnect
  };
};

export default useWebSocket;