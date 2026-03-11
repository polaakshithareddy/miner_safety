import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const VoiceRecorder = ({ onRecordingComplete }) => {
    const { t } = useTranslation();
    const [recording, setRecording] = useState(null);
    const [sound, setSound] = useState(null);
    const [recordingUri, setRecordingUri] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);

    // Cleanup sound when unmounting
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Timer for recording duration
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(seconds => seconds + 1);
            }, 1000);
        } else if (!isRecording && duration !== 0 && !recordingUri) {
            // Reset duration if not recording and no file (case: stopped but not saved yet)
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                setRecording(recording);
                setIsRecording(true);
                setDuration(0);
            } else {
                Alert.alert(t('permission_required'), t('microphone_permission_msg'));
            }
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert(t('recording_error'), 'Failed to start recording');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecordingUri(uri);
            setRecording(null);

            if (onRecordingComplete) {
                onRecordingComplete(uri);
            }
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    };

    const playSound = async () => {
        if (!recordingUri) return;

        try {
            const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
            setSound(sound);
            setIsPlaying(true);

            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.error('Error playing sound', error);
        }
    };

    const stopSound = async () => {
        if (sound) {
            await sound.stopAsync();
            setIsPlaying(false);
        }
    };

    const deleteRecording = () => {
        setRecordingUri(null);
        setDuration(0);
        if (onRecordingComplete) {
            onRecordingComplete(null);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('voice_note')}</Text>

            <View style={styles.controlsContainer}>
                {!recordingUri ? (
                    <TouchableOpacity
                        style={[styles.recordButton, isRecording && styles.recordingActive]}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <MaterialIcons
                            name={isRecording ? "stop" : "mic"}
                            size={24}
                            color="#fff"
                        />
                        <Text style={styles.buttonText}>
                            {isRecording ? t('stop_recording') : t('start_recording')}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.previewContainer}>
                        <TouchableOpacity
                            style={styles.previewButton}
                            onPress={isPlaying ? stopSound : playSound}
                        >
                            <MaterialIcons
                                name={isPlaying ? "stop" : "play-arrow"}
                                size={24}
                                color="#fff"
                            />
                            <Text style={styles.buttonText}>
                                {isPlaying ? t('stop_preview') : t('play_preview')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={deleteRecording}
                        >
                            <MaterialIcons name="delete" size={24} color="#d32f2f" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {(isRecording || recordingUri) && (
                <Text style={styles.durationText}>
                    {isRecording ? 'Recording: ' : 'Duration: '}
                    {formatDuration(duration)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1976d2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
    },
    recordingActive: {
        backgroundColor: '#d32f2f',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
    previewContainer: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        gap: 10,
    },
    previewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2e7d32',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
    },
    deleteButton: {
        padding: 12,
        backgroundColor: '#ffebee',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    }
});

export default VoiceRecorder;
