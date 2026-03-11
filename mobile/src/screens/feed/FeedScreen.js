import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,  // Added Alert
    TouchableWithoutFeedback
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api, { BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRef } from 'react';
import SOSButton from '../../components/sos/SOSButton';

const { width } = Dimensions.get('window');

// Custom Video Component for Tap-to-Pause
const VideoPost = ({ url, isVisible }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true); // User's preference (default play)

    // Sync actual playback with visibility + user preference
    useEffect(() => {
        if (!videoRef.current) return;

        if (isVisible && isPlaying) {
            videoRef.current.playAsync();
        } else {
            videoRef.current.pauseAsync();
        }
    }, [isVisible, isPlaying]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <TouchableWithoutFeedback onPress={togglePlay}>
            <View style={{ width: '100%', height: 300 }}>
                <Video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%' }}
                    source={{ uri: url }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={true}
                    shouldPlay={isVisible && isPlaying} // Simplified control
                />
                {/* Show Play icon if paused by user OR if not visible (though not visible usually means off screen) */}
                {(!isPlaying) && (
                    <View style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.3)'
                    }}>
                        <MaterialIcons name="play-arrow" size={50} color="#fff" />
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const FeedScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all');

    // Viewability Config
    const [viewableItems, setViewableItems] = useState([]);
    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        // Store IDs of currently visible items
        const visibleIds = viewableItems.map(item => item.item._id);
        setViewableItems(visibleIds);
    }, []);
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50 // Item is "visible" if 50% shown
    }).current;

    const fetchPosts = async (pageNum = 1, shouldRefresh = false, currentFilter = filter) => {
        // ... existing fetchPosts logic ...
        try {
            if (pageNum === 1) setLoading(true);

            let url = `/posts?page=${pageNum}&limit=10`;
            if (currentFilter !== 'all') {
                url += `&type=${currentFilter}`;
            }

            const response = await api.get(url);
            const { posts: newPosts, totalPages: pages } = response.data;

            if (shouldRefresh || pageNum === 1) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setTotalPages(pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPosts(1, true);
        }, [filter]) // Re-fetch when filter changes
    );

    const handleFilterChange = (newFilter) => {
        if (filter !== newFilter) {
            setFilter(newFilter);
            setPosts([]); // Clear current list immediately
            // fetchPosts will be triggered by useEffect
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPosts(1, true);
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            fetchPosts(page + 1);
        }
    };

    const handleLike = async (postId) => {
        try {
            // Optimistic update
            const updatedPosts = posts.map(post => {
                if (post._id === postId) {
                    const isLiked = post.likes.includes(user._id);
                    return {
                        ...post,
                        likes: isLiked
                            ? post.likes.filter(id => id !== user._id)
                            : [...post.likes, user._id]
                    };
                }
                return post;
            });
            setPosts(updatedPosts);

            await api.put(`/posts/${postId}/like`);
        } catch (error) {
            console.error('Error liking post:', error);
            // Revert on error? For now, keep simple.
        }
    };

    const handleDelete = async (postId) => {
        try {
            await api.delete(`/posts/${postId}`);
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            Alert.alert('Error', 'Failed to delete post');
        }
    };

    // Helper to format date if date-fns not available, generic fallback
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    const [following, setFollowing] = useState([]);

    useEffect(() => {
        // Fetch fresh user data to know who we follow
        const fetchUserFollowing = async () => {
            try {
                // Assuming we have an endpoint for 'me' or just get user profile
                // GET /api/auth/me or similar. 
                // Since user object in context might be stale if we just followed someone.
                // For simplicity, we can trust the 'user' context IF we update it, 
                // but AuthContext usually only sets on login.
                // Let's assume user object has 'following' array.
                // If not, we might need to rely on local state tracking.

                // Better approach: fetch current user details
                // But for now, let's just initialize from user context if available, or fetch.
                if (user.following) {
                    setFollowing(user.following);
                }
            } catch (err) {
                console.log(err);
            }
        };
        fetchUserFollowing();
    }, [user]);

    const handleFollow = async (authorId) => {
        try {
            const isFollowing = following.includes(authorId);
            if (isFollowing) {
                await api.put(`/users/${authorId}/unfollow`);
                setFollowing(prev => prev.filter(id => id !== authorId));
            } else {
                await api.put(`/users/${authorId}/follow`);
                setFollowing(prev => [...prev, authorId]);
            }
        } catch (error) {
            console.error('Follow error:', error);
            Alert.alert('Error', 'Failed to update follow status');
        }
    };

    const renderItem = ({ item }) => {
        const isLiked = item.likes.includes(user._id);
        const isFollowing = following.includes(item.author?._id);
        const isSelf = item.author?._id === user._id;

        return (
            <View style={styles.postCard}>
                {/* Header */}
                <View style={styles.postHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.author?.name?.charAt(0) || 'U'}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{item.author?.name || t('unknown_user', { defaultValue: 'Unknown User' })}</Text>
                            <Text style={styles.userRole}>{item.author?.role} • {item.author?.operationRole}</Text>
                            {!isSelf && (
                                <TouchableOpacity onPress={() => handleFollow(item.author?._id)}>
                                    <Text style={[styles.followText, isFollowing && styles.followingText]}>
                                        {isFollowing ? `• ${t('following', { defaultValue: 'Following' })}` : `• ${t('follow', { defaultValue: 'Follow' })}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerMeta}>
                        <Text style={styles.categoryBadge}>{item.category}</Text>
                        <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>

                {/* Media */}
                <View style={styles.mediaContainer}>
                    {item.mediaType === 'video' ? (
                        <VideoPost
                            url={getFullUrl(item.mediaUrl)}
                            isVisible={viewableItems.includes(item._id)}
                        />
                    ) : (
                        <Image
                            source={{ uri: getFullUrl(item.mediaUrl) }}
                            style={styles.media}
                            resizeMode="cover"
                        />
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsBar}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item._id)}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={28}
                            color={isLiked ? "#e91e63" : "#333"}
                        />
                        <Text style={styles.actionText}>{item.likes.length > 0 ? item.likes.length : ''}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Comments', { postId: item._id })}>
                        <Ionicons name="chatbubble-outline" size={26} color="#333" />
                        <Text style={styles.actionText}>{item.comments?.length > 0 ? item.comments.length : ''}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
                        <Ionicons name="share-social-outline" size={26} color="#333" />
                    </TouchableOpacity>

                    {/* Edit Button (Author only) */}
                    {(user._id === item.author?._id) && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditPost', { post: item })}>
                            <MaterialIcons name="edit" size={24} color="#666" />
                        </TouchableOpacity>
                    )}

                    {/* Delete Button (Author or Supervisor) */}
                    {(user._id === item.author?._id || user.role === 'supervisor' || user.role === 'admin') && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item._id)}>
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {item.description && (
                        <Text style={styles.description}>
                            <Text style={styles.userNameInText}>{item.author?.name}</Text> {item.description}
                        </Text>
                    )}
                </View>
            </View>
        );
    };



    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>{t('safety_feed', { defaultValue: 'Safety Feed' })}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ position: 'relative', marginRight: 10 }}>
                        <MaterialIcons name="notifications-none" size={28} color="#333" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreatePost')}
                    >
                        <MaterialIcons name="add-a-photo" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterChip, filter === 'all' && styles.activeChip]}
                    onPress={() => handleFilterChange('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>{t('all', { defaultValue: 'All' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filter === 'video' && styles.activeChip]}
                    onPress={() => handleFilterChange('video')}
                >
                    <MaterialIcons name="videocam" size={16} color={filter === 'video' ? '#fff' : '#666'} style={{ marginRight: 4 }} />
                    <Text style={[styles.filterText, filter === 'video' && styles.activeFilterText]}>{t('videos', { defaultValue: 'Videos' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filter === 'image' && styles.activeChip]}
                    onPress={() => handleFilterChange('image')}
                >
                    <MaterialIcons name="image" size={16} color={filter === 'image' ? '#fff' : '#666'} style={{ marginRight: 4 }} />
                    <Text style={[styles.filterText, filter === 'image' && styles.activeFilterText]}>{t('photos', { defaultValue: 'Photos' })}</Text>
                </TouchableOpacity>
            </View>

            {loading && page === 1 ? (
                <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                />
            )}
            <SOSButton />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingTop: 50, // Safe Area crude fix
    },
    backButton: {
        padding: 5,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    createButton: {
        backgroundColor: '#2196F3', // Blue
        padding: 8,
        borderRadius: 20,
    },
    postCard: {
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    userRole: {
        color: '#666',
        fontSize: 12,
    },
    headerMeta: {
        alignItems: 'flex-end',
    },
    categoryBadge: {
        fontSize: 10,
        color: '#2196F3',
        fontWeight: 'bold',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 2,
    },
    timeText: {
        color: '#999',
        fontSize: 10,
    },
    mediaContainer: {
        width: width,
        height: width, // Square/Instagram style
        backgroundColor: '#000',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    actionsBar: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
    },
    actionButton: {
        marginRight: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 5,
        fontWeight: 'bold',
        color: '#333',
    },
    contentContainer: {
        paddingHorizontal: 12,
        paddingBottom: 15,
    },
    description: {
        lineHeight: 20,
        color: '#333',
    },
    userNameInText: {
        fontWeight: 'bold',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 10
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    activeChip: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3'
    },
    filterText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14
    },
    activeFilterText: {
        color: '#fff'
    },
    badge: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff'
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },
    followText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2196F3',
        marginTop: 2
    },
    followingText: {
        color: '#666'
    }
});

export default FeedScreen;
