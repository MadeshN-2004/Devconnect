import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !socket) {
      const newSocket = io('http://localhost:5000', {
        withCredentials: true,
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        newSocket.emit('joinUserRoom', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, socket]); // Fixed dependency array

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};