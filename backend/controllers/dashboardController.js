import DailyComplianceSnapshot from '../models/DailyComplianceSnapshot.js';
import User from '../models/User.js';
import Hazard from '../models/Hazard.js';
import Checklist from '../models/Checklist.js';
import { EMPLOYEE_ROLE_FILTER } from '../utils/roleUtils.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
export const getAdminDashboardStats = async (req, res) => {
    try {
        console.log('Fetching admin dashboard stats...');
        // 1. Total Workforce Enrolled (Employees + Supervisors)
        console.log('Step 1: Counting Users...');
        const totalUsers = await User.countDocuments({
            role: { $in: [...EMPLOYEE_ROLE_FILTER, 'supervisor'] }
        });
        console.log('Total Users:', totalUsers);

        // 2. Active Hazards (Open or In Progress)
        console.log('Step 2: Counting Active Hazards...');
        const activeHazards = await Hazard.countDocuments({
            status: { $in: ['open', 'in_progress'] }
        });
        console.log('Active Hazards:', activeHazards);

        // 3. Checklist Completion Rate (Today)
        console.log('Step 3: Calculating Checklist Completion...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayDateStr = today.toISOString().split('T')[0];

        const totalChecklistsToday = await Checklist.countDocuments({
            date: { $gte: today, $lt: tomorrow }
        });
        console.log('Total Checklists:', totalChecklistsToday);

        const checklistCompletionRate = totalUsers > 0
            ? Math.round((totalChecklistsToday / totalUsers) * 100)
            : 0;

        // 4. Calculate Site-Wide Average Safety Score
        console.log('Step 4: Calculating Average Score...');
        const todaySnapshots = await DailyComplianceSnapshot.find({
            date: todayDateStr
        });
        console.log('Today Snapshots Found:', todaySnapshots.length);

        const totalScore = todaySnapshots.reduce((acc, curr) => acc + (curr.complianceScore || 0), 0);
        const averageScore = todaySnapshots.length > 0
            ? Math.round(totalScore / todaySnapshots.length)
            : 0;

        // 5. Languages Live
        const languages = ['English', 'Hindi', 'Odia', 'Marathi'];

        res.json({
            success: true,
            data: {
                totalUsers,
                activeHazards,
                checklistCompletion: checklistCompletionRate,
                averageScore, // Added this field
                languages
            }
        });

    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard stats',
            error: error.message
        });
    }
};