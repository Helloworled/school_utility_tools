/**
 * WebSocket Client Setup
 * Connects to the WebSocket server and handles incoming notifications
 */

import { io } from 'socket.io-client';
import { useNotificationsStore } from '@/stores/notifications';

const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

let socket = null;

/**
 * Initialize WebSocket connection
 */
export const initializeWebSocket = () => {
  // Create socket connection
  socket = io(`${API_URL}`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Connection established
  socket.on('connect', () => {
    console.log('Connected to notification service');

    // Register user after connection
    const userId = localStorage.getItem('user_id');
    if (userId) {
      socket.emit('register', userId);
    }
  });

  // Handle incoming notifications
  socket.on('notification', (data) => {
    console.log('New notification received:', data);

    if (data.type === 'new') {
      const notificationsStore = useNotificationsStore();
      notificationsStore.addNotification(data.data);
    }
  });

  // Connection error handling
  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  // Reconnection handling
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected to notification service (attempt ${attemptNumber})`);

    // Re-register user after reconnection
    const userId = localStorage.getItem('user_id');
    if (userId) {
      socket.emit('register', userId);
    }
  });

  return socket;
};

/**
 * Get WebSocket instance
 * @returns {Object} Socket.io client instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Disconnected from notification service');
  }
};

/**
 * Reconnect WebSocket
 */
export const reconnectWebSocket = () => {
  disconnectWebSocket();
  return initializeWebSocket();
};
