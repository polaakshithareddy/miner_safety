import { useState, useRef, useEffect, useContext } from 'react';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AuthContext } from '../../context/AuthContext';

// Helper to normalize video URLs
const getPlayableUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/shorts/')) {
    return url.replace('youtube.com/shorts/', 'youtube.com/watch?v=');
  }
  return url;
};

const SafetyShortsPage = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [bufferingId, setBufferingId] = useState(null); // ID of video currently buffering
  const [likedAnimation, setLikedAnimation] = useState(null); // ID of video showing heart animation
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState('for-you'); // 'for-you' | 'following'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [currentShort, setCurrentShort] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const containerRef = useRef(null);

  // Load feed when viewMode changes
  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/safety-shorts/feed', {
          params: { mode: viewMode },
        });
        const data = res.data || [];
        setVideos(data);
        if (data.length > 0) {
          setActiveVideoId(data[0]._id);
          setPlayingId(data[0]._id);
        } else {
          setActiveVideoId(null);
          setPlayingId(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load safety shorts');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [viewMode]);

  // Observer for scrolling
  useEffect(() => {
    if (!videos.length) return;

    const options = {
      root: containerRef.current,
      threshold: 0.6,
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const videoId = entry.target.dataset.id;
          setActiveVideoId((prev) => {
            if (prev !== videoId) {
              setIsMuted(true);
              setProgress(0); // Reset progress
              return videoId;
            }
            return prev;
          });
          setPlayingId(videoId);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);
    const containers = document.querySelectorAll('.video-container');
    containers.forEach((container) => observer.observe(container));

    return () => observer.disconnect();
  }, [videos]);

  const toggleMute = () => {
    setIsMuted((m) => !m);
  };

  const handleDoubleTap = (id) => {
    handleLike(id, true); // Force like
    setLikedAnimation(id);
    setTimeout(() => setLikedAnimation(null), 800);
  };

  const handleLike = async (id, forceLike = false) => {
    const target = videos.find((v) => v._id === id);
    if (!target) return;
    if (forceLike && target.likedByCurrentUser) return;

    // Optimistic update
    setVideos((prev) =>
      prev.map((video) => {
        if (video._id !== id) return video;
        const currentlyLiked = video.likedByCurrentUser;
        const nextLiked = !currentlyLiked;
        return {
          ...video,
          likedByCurrentUser: nextLiked,
          likesCount: (video.likesCount || 0) + (nextLiked ? 1 : -1),
        };
      })
    );

    try {
      const res = await api.post(`/safety-shorts/${id}/like`);
      const updated = res.data;
      setVideos((prev) =>
        prev.map((video) => (video._id === id ? { ...video, ...updated } : video))
      );
    } catch (err) {
      // Revert on error
      setVideos((prev) =>
        prev.map((video) => {
          if (video._id !== id) return video;
          return target;
        })
      );
    }
  };

  const handleSave = () => {
    // Local-only save flag could be added later if needed
  };

  const handleShare = (video) => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Safety Short',
          text: video.caption || 'Safety short',
          url: window.location.href,
        })
        .catch(() => undefined);
    } else {
      alert('Share this safety short link with your team.');
    }
  };

  const handleProgress = (state) => {
    // Only update progress for active video
    if (playingId === activeVideoId) {
      setProgress(state.played * 100);
    }
  };

  const openComments = async (short) => {
    setCurrentShort(short);
    setCommentsOpen(true);
    setComments([]);
    setNewComment('');
    setCommentsError(null);
    setCommentsLoading(true);
    try {
      const res = await api.get(`/safety-shorts/${short._id}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      setCommentsError(err.response?.data?.message || 'Could not load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async (e) => {
    e?.preventDefault?.();
    if (!currentShort || !newComment.trim()) return;
    setCommentSubmitting(true);
    setCommentsError(null);
    try {
      const res = await api.post(`/safety-shorts/${currentShort._id}/comments`, {
        text: newComment.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      // update count in main list
      setVideos((prev) =>
        prev.map((v) =>
          v._id === currentShort._id
            ? { ...v, commentsCount: res.data.commentsCount }
            : v
        )
      );
    } catch (err) {
      setCommentsError(err.response?.data?.message || 'Could not add comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const hasVideos = videos && videos.length > 0;

  return (
    <div className="bg-black h-screen w-full flex justify-center overflow-hidden font-sans">
      {/* Back Button */}
      <Link
        to="/video-library"
        className="absolute top-6 left-4 z-50 p-2 bg-white/10 border border-white/20 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      {/* Top header: For You / Following + actions */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-center z-40 pointer-events-none">
        <div className="flex items-center justify-between w-full max-w-md px-4">
          <div className="pointer-events-auto flex gap-1 bg-black/40 rounded-full px-1 py-1 border border-white/10">
            <button
              onClick={() => setViewMode('for-you')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${
                viewMode === 'for-you'
                  ? 'bg-white text-black'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setViewMode('following')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${
                viewMode === 'following'
                  ? 'bg-white text-black'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              Following
            </button>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <Link
              to="/safety-shorts/create"
              className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              <span className="sr-only">Create safety short</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
              </svg>
            </Link>
            <Link
              to="/safety-shorts/profile"
              className="p-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              <span className="sr-only">My safety profile</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 16a6 6 0 1112 0H2z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Loading / empty states */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
          <div className="h-10 w-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && !loading && (
        <div className="absolute top-20 left-0 right-0 flex justify-center z-30">
          <div className="max-w-sm mx-auto bg-red-900/70 border border-red-600 rounded-xl px-3 py-2 text-xs text-red-100 text-center">
            {error}
          </div>
        </div>
      )}
      {!loading && !hasVideos && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-200 px-6 z-20">
          <p className="text-sm font-semibold mb-1">No safety shorts yet</p>
          <p className="text-xs text-gray-400 mb-3">
            Be the first to share a 15–30 second safety video with your team.
          </p>
          <Link
            to="/safety-shorts/create"
            className="px-4 py-2 rounded-full bg-yellow-400 text-black text-xs font-bold shadow-lg"
          >
            Create Safety Short
          </Link>
        </div>
      )}

      {/* Main Feed Container */}
      <div
        ref={containerRef}
        className="h-full w-full max-w-md bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video) => (
          <div
            key={video._id}
            data-id={video._id}
            className="video-container relative h-full w-full snap-start snap-always shrink-0 flex items-center justify-center bg-gray-900 overflow-hidden"
          >
            {/* React Player Wrapper */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-auto"
              onClick={toggleMute}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleDoubleTap(video._id);
              }}
            >
              <ReactPlayer
                url={getPlayableUrl(video.videoUrl)}
                width="100%"
                height="100%"
                playing={playingId === video._id}
                muted={isMuted || playingId !== video._id}
                loop={true}
                playsinline={true}
                onProgress={handleProgress}
                onBuffer={() => setBufferingId(video._id)}
                onBufferEnd={() => setBufferingId(null)}
                controls={false}
                config={{
                  youtube: {
                    playerVars: {
                      showinfo: 0,
                      controls: 0,
                      modestbranding: 1,
                      rel: 0,
                      playsinline: 1,
                      iv_load_policy: 3,
                      fs: 0,
                      disablekb: 1,
                    },
                  },
                  file: {
                    attributes: {
                      style: { objectFit: 'cover', width: '100%', height: '100%' },
                    },
                  },
                }}
                style={{ pointerEvents: 'none' }}
              />
            </div>

            {/* Loading/Buffering Indicator */}
            {bufferingId === video._id && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin backdrop-blur-sm" />
              </div>
            )}

            {/* Big Heart Animation on Double Tap */}
            <AnimatePresence>
              {likedAnimation === video._id && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 20 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-red-500 drop-shadow-2xl filter" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Mute/Unmute Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute top-6 right-4 z-50 p-3 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>

            {/* Initial Mute Overlay Hint */}
            <AnimatePresence>
              {isMuted && playingId === video._id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-10"
                >
                  <div className="bg-black/60 px-6 py-3 rounded-full backdrop-blur-md flex flex-col items-center shadow-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                        />
                      </svg>

                      <p className="text-white text-sm font-bold tracking-wider uppercase">
                        Tap to Unmute
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none" />

            {/* Right Side Actions Panel */}
            <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(video._id);
                }}
                className="flex flex-col items-center gap-1 group relative"
              >
                <div
                  className={`p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 active:scale-90 ${
                    video.likedByCurrentUser ? 'text-red-500' : 'text-white'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-8 w-8 transition-transform duration-300 ${
                      video.likedByCurrentUser ? 'fill-current scale-110' : ''
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">
                  {video.likesCount ?? 0}
                </span>
              </button>

              {/* Comment Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openComments(video);
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 active:scale-90 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 fill-current"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">
                  {video.commentsCount ?? 0}
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(video);
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 active:scale-90 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
              </button>

              {/* Save Button (local only for now) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <span className="p-3 rounded-full bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 active:scale-90 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 fill-current"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                </span>
                <span className="text-white text-xs font-semibold drop-shadow-md">Save</span>
              </button>
            </div>

            {/* Bottom Information Panel */}
            <div className="absolute left-0 bottom-0 w-full p-4 pb-6 z-20">
              {/* Progress Bar (Only for active video) */}
              {playingId === video._id && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-600/50">
                  <motion.div
                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.7)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'linear', duration: 0.1 }}
                  />
                </div>
              )}

              <div className="flex flex-col items-start gap-2 mt-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="bg-yellow-500/90 text-black text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-lg">
                    {video.category || 'Safety'}
                  </span>
                  <span className="flex items-center gap-1 text-white/80 text-xs font-medium bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Safety Shorts
                  </span>
                </motion.div>

                {video.postedBy && (
                  <p className="text-[11px] text-gray-200 font-semibold flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase">
                      {(video.postedBy.name || 'U')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0]?.toUpperCase())
                        .join('')}
                    </span>
                    <span>@{video.postedBy.name}</span>
                  </p>
                )}

                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-white text-xl font-bold leading-tight drop-shadow-lg max-w-[85%]"
                >
                  {video.caption || 'Safety Short'}
                </motion.h2>

                {video.caption && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-200 text-sm line-clamp-2 max-w-[80%] font-medium drop-shadow-md leading-relaxed"
                  >
                    {video.caption}
                  </motion.p>
                )}

                {/* Audio Waveform Visualizer */}
                {playingId === video._id && !isMuted && (
                  <div className="flex items-center gap-2 mt-3 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
                    <div className="flex gap-0.5 items-end h-3">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 12, 6, 14, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: 'easeInOut' }}
                          className="w-0.5 bg-white/90 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-white/90 font-medium tracking-wide">
                      Original Safety Sound
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comments modal */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex justify-center items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-md bg-gray-900 rounded-t-3xl border-t border-gray-700 p-4 max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-200 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Comments
                </p>
                <button
                  onClick={() => setCommentsOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 text-gray-200 hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-1">
                {commentsLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {commentsError && !commentsLoading && (
                  <p className="text-xs text-red-400">{commentsError}</p>
                )}
                {!commentsLoading && !commentsError && comments.length === 0 && (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    No comments yet. Start the safety discussion.
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c._id} className="flex gap-2">
                    <div className="mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                        {((c.author?.name || 'U')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n) => n[0]?.toUpperCase()) || ['U']
                        ).join('')}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-300 font-semibold">
                        {c.author?.name || 'Worker'}
                      </p>
                      <p className="text-xs text-gray-100 leading-snug">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={submitComment} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a safety comment"
                  className="flex-1 rounded-full bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !newComment.trim()}
                  className="px-3 py-1.5 rounded-full bg-yellow-400 text-black text-xs font-bold disabled:bg-gray-600 disabled:text-gray-200"
                >
                  Send
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafetyShortsPage;
