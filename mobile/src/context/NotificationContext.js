import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../services/api';
import { Alert, Platform, ToastAndroid } from 'react-native';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial fetch of notifications
    useEffect(() => {
        // TODO: Fetch existing unread notifications from API (GET /api/notifications)
        // For now, start empty or persist locally?
    }, [user]);

    useEffect(() => {
        let newSocket;
        if (user) {
            // Clean URL: remove /api if present (though BASE_URL usually is http://host:port)
            // api.js: BASE_URL is http://host:port (no /api suffix usually, axios has /api)
            // Wait, api.js exports const BASE_URL = ... 
            // In api.js: const API_URL = `${BASE_URL}/api`;
            // So BASE_URL is the root.

            console.log('Connecting socket to:', BASE_URL);
            newSocket = io(BASE_URL);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected');
                newSocket.emit('join-user-room', user._id);
                // Also join role room?
                if (user.role) {
                    newSocket.emit('join-role-room', user.role);
                }
            });

            newSocket.on('notification', (notification) => {
                console.log('Notification received:', notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show user feedback
                if (Platform.OS === 'android') {
                    ToastAndroid.show(notification.message, ToastAndroid.LONG);
                } else {
                    Alert.alert('New Notification', notification.message);
                }
            });
        }
        return () => {
            if (newSocket) newSocket.disconnect();
        }
    }, [user]);

    const markAllRead = () => {
        setUnreadCount(0);
        // API call to mark read...
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
