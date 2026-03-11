import express from 'express';
import { protect as auth } from '../middleware/authMiddleware.js';
import { toggleFollowUser, getSocialProfile } from '../controllers/socialController.js';

const router = express.Router();

router.post('/follow/:userId', auth, toggleFollowUser);
router.get('/profile/:userId', auth, getSocialProfile);

export default router;
