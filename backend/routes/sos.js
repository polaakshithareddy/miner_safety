import express from 'express';
import {
  triggerSOS,
  getSOSAlerts,
  acknowledgeSOSAlert,
  resolveSOSAlert,
  deleteSOSAlert,
} from '../controllers/sosController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Trigger SOS alert (employees and supervisors can trigger)
router.post('/trigger', triggerSOS);

// Get SOS alerts (admin only)
router.get('/alerts', getSOSAlerts);

// Acknowledge SOS alert (admin only)
router.patch('/alerts/:id/acknowledge', acknowledgeSOSAlert);

// Resolve SOS alert (admin only)
router.patch('/alerts/:id/resolve', resolveSOSAlert);

// Delete SOS alert (admin only, only resolved alerts)
router.delete('/alerts/:id', deleteSOSAlert);

export default router;

