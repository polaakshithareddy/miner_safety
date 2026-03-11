import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, Alert, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import playlistVideos from '../../data/playlistVideos';
import api from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import Sidebar from '../../components/layout/Sidebar';
import SOSButton from '../../components/sos/SOSButton';

const { width, height } = Dimensions.get('window');

// Enhanced category configuration with LARGE icons and vibrant colors
const CATEGORIES = {
    all: {
        label: 'All Videos',
        color: ['#667eea', '#764ba2'],
        icon: 'apps',
        emoji: '📚'
    },
    equipment: {
        label: 'Equipment',
        color: ['#4facfe', '#00f2fe'],
        icon: 'build-circle',
        emoji: '🔧'
    },
    hazards: {
        label: 'Hazards',
        color: ['#fa709a', '#fee140'],
        icon: 'warning',
        emoji: '⚠️'
    },
    compliance: {
        label: 'Rules',
        color: ['#a8edea', '#fed6e3'],
        icon: 'verified-user',
        emoji: '✅'
    },
    emergency: {
        label: 'Emergency',
        color: ['#ff6b6b', '#ee5a6f'],
        icon: 'local-hospital',
        emoji: '🚨'
    },
};

const VideoLibrary = ({ navigation }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [playing, setPlaying] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Tracking refs
    const intervalRef = useRef(null);
    const lastProgressLoggedRef = useRef(0);
    const videoStartTimeRef = useRef(0);
    const videoStateRef = useRef({ playing: false, video: null });

    const filteredVideos = selectedCategory === 'all'
        ? playlistVideos
        : playlistVideos.filter(v => v.category === selectedCategory);

    // Handle video selection with animation
    const handleVideoSelect = (video) => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setCurrentVideo(video);
        setPlaying(true);
        videoStartTimeRef.current = Date.now();
        lastProgressLoggedRef.current = Date.now();

        logEngagement('video_started', {
            videoId: video.id,
            title: video.title,
            category: video.category,
            duration: video.duration
        });
    };

    // Log engagement to backend
    const logEngagement = async (type, metadata = {}) => {
        try {
            await api.post('/behavior/events', {
                type,
                metadata: {
                    ...metadata,
                    occurredAt: new Date()
                }
            });

            if (type === 'video_completed') {
                const durationMinutes = metadata.durationSeconds ? Math.round(metadata.durationSeconds / 60) : 0;
                const points = Math.min(100, durationMinutes * 5);
                Alert.alert(
                    "🎉 Video Completed!",
                    `Great job! You watched for ${durationMinutes} minutes.\n\n⭐ Points Earned: +${points}`,
                    [{ text: "OK", style: "default" }]
                );
            }
        } catch (error) {
            console.warn('Failed to log video event:', error);
        }
    };

    useEffect(() => {
        videoStateRef.current = { playing, video: currentVideo };
    }, [playing, currentVideo]);

    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                flushProgress();
            }, 5000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [playing]);

    useEffect(() => {
        return () => {
            const { playing, video } = videoStateRef.current;
            if (playing && video) {
                flushProgress(true);
            }
        };
    }, []);

    const flushProgress = (force = false) => {
        const { playing, video } = videoStateRef.current;
        if (!video || (!playing && !force)) return;

        const now = Date.now();
        const deltaSeconds = Math.round((now - lastProgressLoggedRef.current) / 1000);

        if (deltaSeconds >= 1) {
            logEngagement('video_progress', {
                videoId: video.id,
                title: video.title,
                percentage: 0,
                deltaSeconds: deltaSeconds
            });
            lastProgressLoggedRef.current = now;
        }
    };

    const onStateChange = useCallback((state) => {
        if (state === 'ended') {
            setPlaying(false);
            flushProgress(true);
            logEngagement('video_completed', {
                videoId: currentVideo.id,
                title: currentVideo.title,
                category: currentVideo.category,
                durationSeconds: currentVideo.durationSeconds
            });
            setCurrentVideo(null);
        } else if (state === 'playing') {
            setPlaying(true);
            lastProgressLoggedRef.current = Date.now();
        } else if (state === 'paused') {
            flushProgress(true);
            setPlaying(false);
        }
    }, [currentVideo]);

    // GIANT Category Button Component
    const CategoryButton = ({ categoryKey }) => {
        const cat = CATEGORIES[categoryKey];
        const isSelected = selectedCategory === categoryKey;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryButton,
                    isSelected && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(categoryKey)}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={isSelected ? cat.color : ['#f8f9fa', '#e9ecef']}
                    style={styles.categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <MaterialIcons
                        name={cat.icon}
                        size={isSelected ? 40 : 32}
                        color={isSelected ? '#fff' : '#495057'}
                    />
                    <Text style={[
                        styles.categoryLabel,
                        isSelected && styles.categoryLabelActive
                    ]}>
                        {cat.label}
                    </Text>
                    {isSelected && (
                        <View style={styles.selectedIndicator}>
                            <MaterialIcons name="check-circle" size={20} color="#fff" />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // GIANT Video Card Component
    const renderVideoItem = ({ item, index }) => (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={styles.videoCard}
                onPress={() => handleVideoSelect(item)}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={CATEGORIES[item.category]?.color || ['#667eea', '#764ba2']}
                    style={styles.videoCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Thumbnail */}
                    <View style={styles.thumbnailContainer}>
                        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} resizeMode="cover" />

                        {/* GIANT Play Button */}
                        <View style={styles.playOverlay}>
                            <LinearGradient
                                colors={['#ff6b6b', '#ee5a6f']}
                                style={styles.playButton}
                            >
                                <MaterialIcons name="play-arrow" size={60} color="#fff" />
                            </LinearGradient>
                        </View>

                        {/* Duration Badge */}
                        <View style={styles.durationBadge}>
                            <MaterialIcons name="access-time" size={16} color="#fff" />
                            <Text style={styles.durationText}>{item.duration}</Text>
                        </View>

                        {/* Category Emoji Badge */}
                        <View style={styles.emojiBadge}>
                            <Text style={styles.emojiBadgeText}>{CATEGORIES[item.category]?.emoji}</Text>
                        </View>
                    </View>

                    {/* Video Info */}
                    <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.videoMeta}>
                            <View style={styles.metaChip}>
                                <MaterialIcons name="category" size={14} color="#fff" />
                                <Text style={styles.metaText}>{CATEGORIES[item.category]?.label}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View >
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
                        <MaterialIcons name="menu" size={32} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerEmoji}>🎬</Text>
                        <Text style={styles.headerTitle}>Safety Videos</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Category Grid */}
            <View style={styles.categoryGrid}>
                {Object.keys(CATEGORIES).map(key => (
                    <CategoryButton key={key} categoryKey={key} />
                ))}
            </View>

            {/* Video List */}
            <FlatList
                data={filteredVideos}
                renderItem={renderVideoItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎥</Text>
                        <Text style={styles.emptyText}>No videos in this category</Text>
                    </View>
                }
            />

            {/* Video Player Modal */}
            <Modal
                visible={!!currentVideo}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setPlaying(false);
                    setCurrentVideo(null);
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.playerWrapper}>
                        {currentVideo && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle} numberOfLines={1}>{currentVideo.title}</Text>
                                    <TouchableOpacity
                                        onPress={() => setCurrentVideo(null)}
                                        style={styles.closeButton}
                                    >
                                        <MaterialIcons name="close" size={32} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <YoutubePlayer
                                    height={240}
                                    play={playing}
                                    videoId={currentVideo.id}
                                    onChangeState={onStateChange}
                                    initialPlayerParams={{
                                        preventFullScreen: false,
                                        controls: true,
                                        modestbranding: true
                                    }}
                                />
                                <View style={styles.videoDetails}>
                                    <Text style={styles.modalDesc}>{currentVideo.description}</Text>
                                    <View style={styles.infoRow}>
                                        <MaterialIcons name="timer" size={20} color="#fbbf24" />
                                        <Text style={styles.infoText}>{currentVideo.duration}</Text>
                                        <Text style={styles.dot}>•</Text>
                                        <Text style={styles.categoryInfoText}>
                                            {CATEGORIES[currentVideo.category]?.emoji} {CATEGORIES[currentVideo.category]?.label}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <SOSButton />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    menuButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    headerEmoji: {
        fontSize: 32,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    categoryButton: {
        width: (width - 56) / 3,
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    categoryButtonActive: {
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        transform: [{ scale: 1.05 }],
    },
    categoryGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 4,
    },
    categoryEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#495057',
        textAlign: 'center',
        marginTop: 4,
    },
    categoryLabelActive: {
        color: '#fff',
        fontSize: 13,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    videoCard: {
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    videoCardGradient: {
        borderRadius: 24,
    },
    thumbnailContainer: {
        height: 220,
        width: '100%',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff6b6b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emojiBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    emojiBadgeText: {
        fontSize: 28,
    },
    videoInfo: {
        padding: 20,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        lineHeight: 24,
    },
    videoMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    metaText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#adb5bd',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
    },
    playerWrapper: {
        backgroundColor: '#000',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 16,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 12,
    },
    videoDetails: {
        padding: 20,
    },
    modalDesc: {
        color: '#e9ecef',
        fontSize: 15,
        marginBottom: 16,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 12,
    },
    infoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    dot: {
        color: '#adb5bd',
        marginHorizontal: 12,
        fontSize: 16,
    },
    categoryInfoText: {
        color: '#fbbf24',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default VideoLibrary;
