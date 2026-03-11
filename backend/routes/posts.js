import express from 'express';
import { protect } from '../middleware/authMiddleware.js'; // Assuming this exists
import {
    createPost,
    getFeed,
    updatePost,
    deletePost,
    getUserPosts,
    getPost, // Import this
    toggleLike,
    addComment,
    deleteComment
} from '../controllers/postController.js';

const router = express.Router();

router.route('/')
    .post(protect, createPost)
    .get(protect, getFeed);

router.get('/user/:userId', protect, getUserPosts);

router.route('/:id')
    .get(protect, getPost)
    .put(protect, updatePost)
    .delete(protect, deletePost);

router.put('/:id/like', protect, toggleLike);

router.route('/:id/comments')
    .post(protect, addComment);

router.route('/:id/comments/:commentId')
    .delete(protect, deleteComment);

export default router;
