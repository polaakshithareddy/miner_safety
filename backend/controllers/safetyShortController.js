import SafetyShort from '../models/SafetyShort.js';
import User from '../models/User.js';
import DEFAULT_SAFETY_SHORTS from '../data/defaultSafetyShorts.js';

// Helper: map SafetyShort to frontend-friendly response
const mapShortForResponse = (short, currentUserId, currentUserFollowingIds = []) => {
  const likedByCurrentUser = short.likedBy?.some((id) => id.toString() === String(currentUserId));
  const postedById = short.postedBy?._id || short.postedBy;
  const isFollowedByCurrentUser = currentUserFollowingIds.some(
    (id) => id.toString() === String(postedById)
  );

  const postedBy = short.postedBy && typeof short.postedBy === 'object'
    ? {
        _id: short.postedBy._id,
        name: short.postedBy.name,
        role: short.postedBy.role,
        operationRole: short.postedBy.operationRole,
        followersCount: short.postedBy.followersCount || 0,
      }
    : undefined;

  return {
    _id: short._id,
    videoUrl: short.videoUrl,
    thumbnailUrl: short.thumbnailUrl,
    caption: short.caption,
    category: short.category,
    durationSeconds: short.durationSeconds,
    likesCount: short.likesCount || 0,
    commentsCount: short.commentsCount || 0,
    likedByCurrentUser,
    postedBy,
    postedByFollowedByCurrentUser: isFollowedByCurrentUser,
    createdAt: short.createdAt,
  };
};

// Seed 5 default safety shorts for a new user
export const seedDefaultShortsForUser = async (userId) => {
  try {
    if (!userId) return;

    const total = DEFAULT_SAFETY_SHORTS.length;
    if (!total) return;

    // Pick up to 5 unique random shorts
    const indices = new Set();
    while (indices.size < Math.min(5, total)) {
      indices.add(Math.floor(Math.random() * total));
    }

    const docs = Array.from(indices).map((idx) => ({
      ...DEFAULT_SAFETY_SHORTS[idx],
      postedBy: userId,
    }));

    await SafetyShort.insertMany(docs);
  } catch (err) {
    // Do not fail user registration because of seeding issues
    console.error('Error seeding default safety shorts for user:', err);
  }
};

// GET /api/safety-shorts/feed?mode=for-you|following
export const getSafetyShortFeed = async (req, res) => {
  try {
    const mode = req.query.mode === 'following' ? 'following' : 'for-you';
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser?.following || [];

    const filter = {};
    if (mode === 'following') {
      filter.postedBy = { $in: followingIds };
    }

    const shorts = await SafetyShort.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('postedBy', 'name role operationRole followersCount');

    const response = shorts.map((short) =>
      mapShortForResponse(short, currentUserId, followingIds)
    );

    res.json(response);
  } catch (err) {
    console.error('Error fetching safety shorts feed:', err);
    res.status(500).json({ message: 'Failed to load safety shorts feed' });
  }
};

// POST /api/safety-shorts
export const createSafetyShort = async (req, res) => {
  try {
    const { videoUrl, thumbnailUrl, caption, category, durationSeconds } = req.body;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return res.status(400).json({ message: 'videoUrl is required' });
    }

    const doc = new SafetyShort({
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl?.trim(),
      caption: caption?.trim(),
      category: category?.trim() || 'general',
      durationSeconds,
      postedBy: req.user._id,
    });

    await doc.save();
    await doc.populate('postedBy', 'name role operationRole followersCount');

    const currentUser = await User.findById(req.user._id).select('following');
    const followingIds = currentUser?.following || [];

    res.status(201).json(mapShortForResponse(doc, req.user._id, followingIds));
  } catch (err) {
    console.error('Error creating safety short:', err);
    res.status(500).json({ message: 'Failed to create safety short' });
  }
};

// POST /api/safety-shorts/:id/like
export const toggleLikeSafetyShort = async (req, res) => {
  try {
    const short = await SafetyShort.findById(req.params.id);
    if (!short) {
      return res.status(404).json({ message: 'Safety short not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = short.likedBy.some((id) => id.toString() === String(userId));

    if (alreadyLiked) {
      short.likedBy = short.likedBy.filter((id) => id.toString() !== String(userId));
      short.likesCount = Math.max(0, (short.likesCount || 0) - 1);
    } else {
      short.likedBy.push(userId);
      short.likesCount = (short.likesCount || 0) + 1;
    }

    await short.save();
    await short.populate('postedBy', 'name role operationRole followersCount');

    const currentUser = await User.findById(userId).select('following');
    const followingIds = currentUser?.following || [];

    res.json(mapShortForResponse(short, userId, followingIds));
  } catch (err) {
    console.error('Error toggling like on safety short:', err);
    res.status(500).json({ message: 'Failed to like safety short' });
  }
};

// GET /api/safety-shorts/:id/comments
export const getShortComments = async (req, res) => {
  try {
    const short = await SafetyShort.findById(req.params.id).populate(
      'comments.author',
      'name role'
    );
    if (!short) {
      return res.status(404).json({ message: 'Safety short not found' });
    }

    const comments = short.comments.map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      author: c.author
        ? {
            _id: c.author._id,
            name: c.author.name,
            role: c.author.role,
          }
        : undefined,
    }));

    res.json({ comments, commentsCount: short.commentsCount || comments.length });
  } catch (err) {
    console.error('Error fetching safety short comments:', err);
    res.status(500).json({ message: 'Failed to load comments' });
  }
};

// POST /api/safety-shorts/:id/comments
export const addShortComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (text.trim().length > 300) {
      return res.status(400).json({ message: 'Comment too long (max 300 characters)' });
    }

    const short = await SafetyShort.findById(req.params.id);
    if (!short) {
      return res.status(404).json({ message: 'Safety short not found' });
    }

    const comment = {
      author: req.user._id,
      text: text.trim(),
    };

    short.comments.push(comment);
    short.commentsCount = (short.commentsCount || 0) + 1;
    await short.save();

    await short.populate('comments.author', 'name role');
    const savedComment = short.comments[short.comments.length - 1];

    res.status(201).json({
      _id: savedComment._id,
      text: savedComment.text,
      createdAt: savedComment.createdAt,
      author: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      commentsCount: short.commentsCount,
    });
  } catch (err) {
    console.error('Error adding safety short comment:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

// GET /api/safety-shorts/me
export const getMySafetyShorts = async (req, res) => {
  try {
    const userId = req.user._id;
    const shorts = await SafetyShort.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name role operationRole followersCount');

    const currentUser = await User.findById(userId).select('following');
    const followingIds = currentUser?.following || [];

    const response = shorts.map((short) =>
      mapShortForResponse(short, userId, followingIds)
    );

    res.json(response);
  } catch (err) {
    console.error('Error fetching my safety shorts:', err);
    res.status(500).json({ message: 'Failed to load your safety shorts' });
  }
};
