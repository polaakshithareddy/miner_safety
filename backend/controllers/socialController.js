import User from '../models/User.js';
import SafetyShort from '../models/SafetyShort.js';

// POST /api/social/follow/:userId
export const toggleFollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (String(targetUserId) === String(currentUserId)) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let isFollowing = false;

    const alreadyFollowing = currentUser.following?.some(
      (id) => id.toString() === String(targetUser._id)
    );

    if (alreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== String(targetUser._id)
      );
      currentUser.followingCount = Math.max(
        0,
        (currentUser.followingCount || 0) - 1
      );

      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== String(currentUser._id)
      );
      targetUser.followersCount = Math.max(
        0,
        (targetUser.followersCount || 0) - 1
      );

      isFollowing = false;
    } else {
      // Follow
      currentUser.following = currentUser.following || [];
      targetUser.followers = targetUser.followers || [];

      currentUser.following.push(targetUser._id);
      currentUser.followingCount = (currentUser.followingCount || 0) + 1;

      targetUser.followers.push(currentUser._id);
      targetUser.followersCount = (targetUser.followersCount || 0) + 1;

      isFollowing = true;
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      isFollowing,
      targetUser: {
        _id: targetUser._id,
        name: targetUser.name,
        role: targetUser.role,
        followersCount: targetUser.followersCount || 0,
      },
      currentUser: {
        _id: currentUser._id,
        followingCount: currentUser.followingCount || 0,
      },
    });
  } catch (err) {
    console.error('Error toggling follow:', err);
    res.status(500).json({ message: 'Failed to update follow status' });
  }
};

// GET /api/social/profile/:userId
export const getSocialProfile = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const user = await User.findById(targetUserId).select(
      'name role operationRole followersCount followingCount followers'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = user.followers?.some(
      (id) => id.toString() === String(currentUserId)
    );

    const recentShorts = await SafetyShort.find({ postedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(12);

    const shortsResponse = recentShorts.map((short) => ({
      _id: short._id,
      videoUrl: short.videoUrl,
      thumbnailUrl: short.thumbnailUrl,
      caption: short.caption,
      category: short.category,
      likesCount: short.likesCount || 0,
      commentsCount: short.commentsCount || 0,
      createdAt: short.createdAt,
    }));

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      operationRole: user.operationRole,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      isFollowing,
      shorts: shortsResponse,
    });
  } catch (err) {
    console.error('Error fetching social profile:', err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
};
