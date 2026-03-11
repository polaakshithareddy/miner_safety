import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { Vibration } from 'react-native';
import { Audio } from 'expo-av';
import io from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

const SOSContext = createContext();

export const SOSProvider = ({ children }) => {
    const { user } = useAuth();
    const [sosNotification, setSosNotification] = useState(null);
    const socketRef = useRef(null);
    const soundRef = useRef(null);

    // Play SOS alert sound and vibration
    const playSOSSound = async () => {
        try {
            // Set audio mode for playback
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            // Stop any existing sound
            if (soundRef.current) {
                try {
                    await soundRef.current.unloadAsync();
                } catch (e) {
                    // Ignore errors when unloading
                }
            }

            // Vibrate pattern: SOS pattern (3 short, 3 long, 3 short)
            Vibration.vibrate([0, 200, 200, 200, 200, 200, 200, 600, 200, 600, 200, 600], false);

            // Play emergency beep sound
            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                    {
                        shouldPlay: true,
                        volume: 1.0,
                        isLooping: false,
                        isMuted: false,
                    }
                );

                soundRef.current = sound;
                await sound.playAsync();
                console.log('🔊 Playing SOS alert sound');

                // Clean up after playing
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.didJustFinish) {
                        sound.unloadAsync().catch(() => { });
                        soundRef.current = null;
                    }
                });
            } catch (soundError) {
                console.warn('Could not play sound, using enhanced vibration:', soundError);
                // Enhanced vibration pattern as fallback (SOS pattern)
                Vibration.vibrate([0, 100, 50, 100, 50, 100, 50, 200, 50, 200, 50, 200, 50, 100, 50, 100, 50, 100], false);
            }
        } catch (error) {
            console.error('Error playing SOS sound/vibration:', error);
            // Fallback: just vibrate with pattern
            Vibration.vibrate([0, 500, 200, 500, 200, 500], false);
        }
    };

    const stopSOSSound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                console.log('🔇 SOS alert sound stopped');
            }
            Vibration.cancel();
        } catch (error) {
            console.error('Error stopping SOS sound:', error);
        }
    };

    useEffect(() => {
        // Only set up Socket.IO for admin users
        if (user?.role === 'admin') {
            // Get base URL from API config
            const baseURL = api.defaults.baseURL?.replace('/api', '') || 'http://172.16.58.131:5000';

            console.log('Setting up Socket.IO connection to:', baseURL);

            // Initialize Socket.IO connection
            socketRef.current = io(baseURL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            // Join admin room
            socketRef.current.on('connect', () => {
                console.log('✅ Socket.IO connected for admin, socket ID:', socketRef.current.id);
                socketRef.current.emit('join-role-room', 'admin');
            });

            // Listen for SOS emergency alerts
            socketRef.current.on('sos-emergency-alert', (alertData) => {
                console.log('🚨 SOS Alert received (sos-emergency-alert):', alertData);
                playSOSSound();
                setSosNotification({
                    ...alertData,
                    id: alertData.id || Date.now(),
                });
            });

            // Also listen to broadcast
            socketRef.current.on('sos-emergency-broadcast', (alertData) => {
                console.log('🚨 SOS Broadcast received (sos-emergency-broadcast):', alertData);
                playSOSSound();
                setSosNotification({
                    ...alertData,
                    id: alertData.id || Date.now(),
                });
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('❌ Socket.IO connection error:', error);
            });
        }

        return () => {
            // Cleanup Socket.IO connection
            if (socketRef.current) {
                console.log('Cleaning up Socket.IO connection');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            // Cleanup sound on unmount/logout
            stopSOSSound();
        };
    }, [user?.role]);

    const dismissNotification = () => {
        setSosNotification(null);
    };

    return (
        <SOSContext.Provider value={{
            sosNotification,
            playSOSSound,
            stopSOSSound,
            dismissNotification
        }}>
            {children}
        </SOSContext.Provider>
    );
};

export const useSOS = () => useContext(SOSContext);
