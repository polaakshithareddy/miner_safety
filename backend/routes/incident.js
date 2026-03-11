import express from 'express';
import { getIncidents, createIncident, getIncidentById, updateIncidentStatus } from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getIncidents);
router.post('/', protect, createIncident);
router.get('/:id', protect, getIncidentById);
router.put('/:id/status', protect, authorize('admin', 'supervisor'), updateIncidentStatus);

export default router;