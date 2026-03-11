import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getQuestions,
    submitAssessment,
    getMyLatestAssessment,
    getTeamAssessments,
    getTeamStats,
} from '../controllers/mentalFitnessController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get questions
router.get('/questions', getQuestions);

// Submit assessment (all authenticated users)
router.post('/', submitAssessment);

// Get my latest assessment
router.get('/my-latest', getMyLatestAssessment);

// Team routes - temporarily open to all authenticated users for debugging
router.get('/team', getTeamAssessments);
router.get('/stats', getTeamStats);

export default router;
