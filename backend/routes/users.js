import express from 'express';
import { getAllUsers, updateUserShift, updateUserOperationRole, updateUserSystemRole, getOperationRoles, followUser, unfollowUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// List all employees and supervisors
router.get('/', protect, authorize('admin'), getAllUsers);

// Update shift location/date for a specific user
router.put('/:id/shift', protect, authorize('admin'), updateUserShift);

// Update employee operational role
router.put('/:id/role', protect, authorize('admin'), updateUserOperationRole);

// Update user system role
router.put('/:id/system-role', protect, authorize('admin'), updateUserSystemRole);

// Get all operational roles
router.get('/operational-roles', protect, authorize('admin'), getOperationRoles);

// Follow/Unfollow
router.put('/:id/follow', protect, followUser);
router.put('/:id/unfollow', protect, unfollowUser);

export default router;
