import express from 'express';
import { protect as auth } from '../middleware/authMiddleware.js';
import {
  getSafetyShortFeed,
  createSafetyShort,
  toggleLikeSafetyShort,
  getShortComments,
  addShortComment,
  getMySafetyShorts,
} from '../controllers/safetyShortController.js';

const router = express.Router();

// Feed
router.get('/feed', auth, getSafetyShortFeed);

// Create new safety short
router.post('/', auth, createSafetyShort);

// Like/unlike
router.post('/:id/like', auth, toggleLikeSafetyShort);

// Comments
router.get('/:id/comments', auth, getShortComments);
router.post('/:id/comments', auth, addShortComment);

// Current user's shorts
router.get('/me', auth, getMySafetyShorts);

export default router;
