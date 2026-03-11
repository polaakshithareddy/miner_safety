import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { mockPosts, mockUsers, getTimeAgo } from '../../data/socialData';
import Sidebar from '../../components/layout/Sidebar';

const { width, height } = Dimensions.get('window');

// Mock comments data since backend integration isn't requested for this specific part yet
const MOCK_COMMENTS = [
  { id: 1, user: 'John Miner', avatar: 'https://ui-avatars.com/api/?name=John+Miner', text: 'Stay safe out there! 👷‍♂️', time: '2m' },
  { id: 2, user: 'Sarah Safety', avatar: 'https://ui-avatars.com/api/?name=Sarah+Safety', text: 'Great tip! 👍', time: '5m' },
  { id: 3, user: 'Mike Lead', avatar: 'https://ui-avatars.com/api/?name=Mike+Lead', text: 'Important reminder for everyone.', time: '1h' },
];

const SafetyShorts = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sort posts by likes initially so high-engagement videos appear first
  // Calculate this once to ensure posts and playingId match
  const [initialSortedPosts] = useState(() => [...mockPosts].sort((a, b) => b.likes - a.likes));

  const [posts, setPosts] = useState(initialSortedPosts);
  const [users, setUsers] = useState(mockUsers);
  const [playingId, setPlayingId] = useState(initialSortedPosts[0]?.id || null);
  const [pausedVideos, setPausedVideos] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false); // Default unmuted for better UX
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Comments State
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activePostComments, setActivePostComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentPostId, setCurrentPostId] = useState(null);

  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'following'
  const flatListRef = useRef(null);
  const likeAnimations = useRef({});

  const extractVideoId = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('watch?v=')[1]?.split('&')[0];
    }
    if (url.includes('youtube.com/shorts/')) {
      return url.split('shorts/')[1]?.split('?')[0];
    }
    // Fallback for simple IDs
    return url.length === 11 ? url : null;
  };

  const handleLike = (postId) => {
    if (!likeAnimations.current[postId]) {
      likeAnimations.current[postId] = new Animated.Value(0);
    }
    Animated.sequence([
      Animated.spring(likeAnimations.current[postId], {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(likeAnimations.current[postId], {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  const handleFollow = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowing: !u.isFollowing,
            followers: u.isFollowing ? u.followers - 1 : u.followers + 1,
          };
        }
        return u;
      })
    );
  };

  const handleSave = (postId) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, saved: !post.saved } : post))
    );
  };

  const handleShare = (post) => {
    Alert.alert('Share', `Share "${post.caption.substring(0, 30)}..."`);
  };

  const handleComment = (post) => {
    setCurrentPostId(post.id);
    setActivePostComments(MOCK_COMMENTS); // In real app, fetch comments for this post
    setShowCommentsModal(true);
  };

  const submitComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: user?.name || 'You',
      avatar: user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'You'}`,
      text: newComment,
      time: 'Just now'
    };

    setActivePostComments([comment, ...activePostComments]);
    setNewComment('');

    // Update comment count in post list locally
    setPosts(prev => prev.map(p =>
      p.id === currentPostId ? { ...p, comments: p.comments + 1 } : p
    ));
  };

  const openProfile = (post) => {
    const user = users.find((u) => u.id === post.userId);
    if (user) {
      setSelectedUser(user);
      setShowProfileModal(true);
    }
  };

  const handleCreatePost = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newPost = {
        id: `post_${Date.now()}`,
        userId: user?._id || 'current_user',
        username: user?.name?.toLowerCase().replace(' ', '_') || 'you',
        userAvatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User'),
        type: result.assets[0].type === 'video' ? 'video' : 'photo',
        url: result.assets[0].uri,
        thumbnail: result.assets[0].uri,
        caption: '',
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: new Date(),
        liked: false,
        saved: false,
      };
      setPosts((prev) => [newPost, ...prev]);
      setShowCreateModal(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visiblePost = viewableItems[0].item;
      setCurrentIndex(viewableItems[0].index);
      // Auto-play when video comes into view (unless paused)
      if (!pausedVideos.has(visiblePost.id)) {
        setPlayingId(visiblePost.id);
      } else {
        setPlayingId(null);
      }
    }
  }).current;

  const handleVideoTap = (postId) => {
    if (pausedVideos.has(postId)) {
      // Resume video
      setPausedVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      setPlayingId(postId);
    } else {
      // Pause video
      setPausedVideos((prev) => new Set(prev).add(postId));
      setPlayingId(null);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)} K`;
    return num.toString();
  };

  const filteredPosts = viewMode === 'following'
    ? posts.filter((post) => {
      const postUser = users.find((u) => u.id === post.userId);
      return postUser?.isFollowing;
    })
    : posts;

  const renderPost = ({ item: post, index }) => {
    const videoId = extractVideoId(post.url);
    const isPaused = pausedVideos.has(post.id);
    const isPlaying = playingId === post.id && !isPaused;
    const likeAnim = likeAnimations.current[post.id] || new Animated.Value(0);
    const postUser = users.find((u) => u.id === post.userId) || mockUsers[0];

    return (
      <View style={styles.videoContainer}>
        {/* Video/Photo Player */}
        {post.type === 'video' && videoId ? (
          <TouchableOpacity
            style={styles.playerContainer}
            activeOpacity={1}
            onPress={() => handleVideoTap(post.id)}
          >
            <YoutubePlayer
              height={height}
              width={width}
              videoId={videoId}
              play={isPlaying}
              mute={isMuted}
              initialPlayerParams={{
                controls: false,
                modestbranding: true,
                rel: false,
              }}
              onChangeState={(state) => {
                if (state === 'ended' && index < filteredPosts.length - 1) {
                  flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
                }
              }}
            />
            {/* Pause Overlay */}
            {isPaused && (
              <View style={styles.pauseOverlay}>
                <MaterialIcons name="play-circle-filled" size={80} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.thumbnailContainer}
            activeOpacity={1}
            onPress={() => handleVideoTap(post.id)}
          >
            <Image source={{ uri: post.thumbnail || post.url }} style={styles.thumbnail} />
            {isPaused && (
              <View style={styles.pauseOverlay}>
                <MaterialIcons name="play-circle-filled" size={80} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Double Tap Like Animation */}
        <Animated.View
          style={[
            styles.doubleTapLike,
            {
              opacity: likeAnim,
              transform: [
                {
                  scale: likeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <MaterialIcons name="favorite" size={120} color="rgba(220, 38, 38, 0.9)" />
        </Animated.View>

        {/* Right Side Action Buttons - LARGE ICON BASED */}
        <View style={styles.rightActions}>
          {/* Profile Picture with Follow Button */}
          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={() => openProfile(post)}
          >
            <Image source={{ uri: post.userAvatar }} style={styles.profileImage} />
            {!postUser.isFollowing && (
              <TouchableOpacity
                style={styles.followBadge}
                onPress={() => handleFollow(post.userId)}
              >
                <MaterialIcons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Like Button */}
          <View style={styles.actionItem}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => handleLike(post.id)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={post.liked ? 'favorite' : 'favorite-border'}
                size={36}
                color={post.liked ? '#ef4444' : '#fff'}
              />
            </TouchableOpacity>
            <Text style={styles.actionCount}>{formatNumber(post.likes)}</Text>
          </View>

          {/* Comment Button */}
          <View style={styles.actionItem}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => handleComment(post)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chat-bubble" size={34} color="#3b82f6" />
            </TouchableOpacity>
            <Text style={styles.actionCount}>{formatNumber(post.comments)}</Text>
          </View>

          {/* Share Button */}
          <View style={styles.actionItem}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => handleShare(post)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="share" size={34} color="#22c55e" />
            </TouchableOpacity>
            <Text style={styles.actionCount}>{formatNumber(post.shares)}</Text>
          </View>

          {/* Mute Button */}
          <View style={styles.actionItem}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
              onPress={() => setIsMuted(!isMuted)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Overlay - Username and Description */}
        <View style={styles.bottomOverlay}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => openProfile(post)} style={styles.usernameRow}>
              <Text style={styles.username}>@{post.username}</Text>
              {!postUser.isFollowing && (
                <View style={styles.followTag}>
                  <Text style={styles.followText}>Follow</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.description} numberOfLines={2}>
              {post.caption}
            </Text>
            <View style={styles.musicInfo}>
              <MaterialIcons name="music-note" size={20} color="#fbbf24" />
              <Text style={styles.musicText}>Original Sound</Text>
            </View>
          </View>
        </View>

        {/* Top Header - Icon Based Navigation */}
        {index === 0 && (
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.headerIcon}>
              <MaterialIcons name="menu" size={32} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTabs}>
              <TouchableOpacity
                style={[styles.headerTab, viewMode === 'feed' && styles.headerTabActive]}
                onPress={() => setViewMode('feed')}
              >
                <Text style={styles.headerEmoji}>🌎</Text>
                {/* <Text style={[styles.headerTabText, viewMode === 'feed' && styles.headerTabTextActive]}>For You</Text> */}
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.headerTab, viewMode === 'following' && styles.headerTabActive]}
                onPress={() => setViewMode('following')}
              >
                <Text style={styles.headerEmoji}>👥</Text>
                {/* <Text style={[styles.headerTabText, viewMode === 'following' && styles.headerTabTextActive]}>Following</Text> */}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.headerIcon}>
              <MaterialIcons name="add-a-photo" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <FlatList
        ref={flatListRef}
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => String(item.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
        removeClippedSubviews={false}
      />

      {/* User Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* ... keeping existing profile modal structure but simplifying style ... */}
          <View style={styles.profileModal}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <MaterialIcons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
            {selectedUser && (
              <ScrollView style={styles.profileContent}>
                <View style={styles.profileInfo}>
                  <Image source={{ uri: selectedUser.avatar }} style={styles.profileAvatar} />
                  <Text style={styles.profileName}>{selectedUser.name}</Text>

                  <View style={styles.profileStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedUser.posts}</Text>
                      <Text style={styles.statLabel}>Videos</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{formatNumber(selectedUser.followers)}</Text>
                      <Text style={styles.statLabel}>Fans</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.followButtonLarge,
                      selectedUser.isFollowing && styles.followingButtonLarge,
                    ]}
                    onPress={() => handleFollow(selectedUser.id)}
                  >
                    <Text style={styles.followButtonText}>
                      {selectedUser.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* COMMENTS MODAL */}
      <Modal
        visible={showCommentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.commentsModal}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({formatNumber(activePostComments.length)})</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <MaterialIcons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {activePostComments.length === 0 ? (
                <View style={styles.center}>
                  <MaterialIcons name="chat-bubble-outline" size={48} color="#ccc" />
                  <Text style={styles.noCommentsText}>Be the first to comment!</Text>
                </View>
              ) : (
                activePostComments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentRow}>
                        <Text style={styles.commentUser}>{comment.user}</Text>
                        <Text style={styles.commentTime}>{comment.time}</Text>
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                onPress={submitComment}
                disabled={!newComment.trim()}
              >
                <MaterialIcons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createModal}>
            <TouchableOpacity
              style={styles.closeCreateButton}
              onPress={() => setShowCreateModal(false)}
            >
              <MaterialIcons name="close" size={32} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.createTitle}>Create Safety Short</Text>

            <TouchableOpacity style={styles.createOption} onPress={handleCreatePost}>
              <View style={[styles.createIconBadge, { backgroundColor: '#3b82f6' }]}>
                <MaterialIcons name="photo-library" size={40} color="#fff" />
              </View>
              <Text style={styles.createOptionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createOption} onPress={handleCreatePost}>
              <View style={[styles.createIconBadge, { backgroundColor: '#ef4444' }]}>
                <MaterialIcons name="videocam" size={40} color="#fff" />
              </View>
              <Text style={styles.createOptionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    width: width,
    height: height,
  },
  videoContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
    position: 'relative',
  },
  playerContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  thumbnailContainer: {
    width: width,
    height: height,
  },
  thumbnail: {
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  doubleTapLike: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -60,
    marginTop: -60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionCount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profilePictureContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#fff',
  },
  followBadge: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 90, // Leave room for right actions
    padding: 16,
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
  },
  userInfo: {
    gap: 8,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  followTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    color: '#eee',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  musicText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },

  // Header
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  headerIcon: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  headerTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 30,
    padding: 4,
    gap: 4,
  },
  headerTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  headerTabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerEmoji: {
    fontSize: 22,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  profileModal: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileContent: {
    padding: 20,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ef4444',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  followButtonLarge: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
  },
  followingButtonLarge: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Create Modal
  createModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  closeCreateButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 10,
  },
  createTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  createOption: {
    alignItems: 'center',
    gap: 12,
  },
  createIconBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  createOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },

  // Comments Modal Style
  commentsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
    flexDirection: 'column',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    opacity: 0.6,
  },
  noCommentsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#9ca3af',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
});

export default SafetyShorts;