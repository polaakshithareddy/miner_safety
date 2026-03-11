import MentalFitnessAssessment from '../models/MentalFitnessAssessment.js';
import User from '../models/User.js';

// Mental fitness questions
export const MENTAL_FITNESS_QUESTIONS = [
    {
        id: 1,
        category: 'Sleep',
        question: 'How well did you sleep last night?',
        options: [
            'Less than 4 hours / Very poor quality',
            '4-5 hours / Poor quality',
            '5-6 hours / Fair quality',
            '6-7 hours / Good quality',
            '7+ hours / Excellent quality',
        ],
    },
    {
        id: 2,
        category: 'Stress',
        question: 'How stressed or anxious do you feel right now?',
        options: [
            'Extremely stressed',
            'Very stressed',
            'Moderately stressed',
            'Slightly stressed',
            'Not stressed at all',
        ],
    },
    {
        id: 3,
        category: 'Focus',
        question: 'How well can you concentrate today?',
        options: [
            'Cannot focus at all',
            'Very difficult to focus',
            'Somewhat difficult',
            'Can focus well',
            'Excellent focus',
        ],
    },
    {
        id: 4,
        category: 'Physical',
        question: 'How do you feel physically?',
        options: [
            'Severe pain/discomfort',
            'Moderate discomfort',
            'Minor discomfort',
            'Good',
            'Excellent',
        ],
    },
    {
        id: 5,
        category: 'Emotional',
        question: 'How would you describe your mood today?',
        options: [
            'Very negative/depressed',
            'Somewhat negative',
            'Neutral',
            'Positive',
            'Very positive',
        ],
    },
    {
        id: 6,
        category: 'Energy',
        question: 'How energetic do you feel?',
        options: [
            'Completely exhausted',
            'Very tired',
            'Somewhat tired',
            'Energetic',
            'Very energetic',
        ],
    },
    {
        id: 7,
        category: 'Alertness',
        question: 'How alert and aware do you feel?',
        options: [
            'Very drowsy/foggy',
            'Drowsy',
            'Somewhat alert',
            'Alert',
            'Very alert',
        ],
    },
    {
        id: 8,
        category: 'Confidence',
        question: 'How confident do you feel about working safely today?',
        options: [
            'Not confident at all',
            'Not very confident',
            'Somewhat confident',
            'Confident',
            'Very confident',
        ],
    },
    {
        id: 9,
        category: 'Personal',
        question: 'Are personal problems affecting your ability to work?',
        options: [
            'Severely affecting',
            'Significantly affecting',
            'Moderately affecting',
            'Slightly affecting',
            'Not affecting at all',
        ],
    },
    {
        id: 10,
        category: 'Readiness',
        question: 'Overall, how ready do you feel to work safely today?',
        options: [
            'Not ready at all',
            'Not very ready',
            'Somewhat ready',
            'Ready',
            'Completely ready',
        ],
    },
];

// Calculate score and status from responses
const calculateScoreAndStatus = (responses) => {
    const totalScore = responses.reduce((sum, r) => sum + r.answer, 0);
    const maxScore = responses.length * 5;
    const score = Math.round((totalScore / maxScore) * 100);

    let status;
    if (score >= 80) {
        status = 'fit';
    } else if (score >= 60) {
        status = 'caution';
    } else {
        status = 'unfit';
    }

    return { score, status };
};

// Get questions
export const getQuestions = async (req, res) => {
    try {
        res.json({
            success: true,
            data: MENTAL_FITNESS_QUESTIONS,
        });
    } catch (error) {
        console.error('Error fetching mental fitness questions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch questions' });
    }
};

// Submit assessment
export const submitAssessment = async (req, res) => {
    try {
        const { responses } = req.body;
        const userId = req.user._id;

        if (!responses || responses.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'All 10 questions must be answered',
            });
        }

        // Validate responses
        for (const response of responses) {
            if (!response.question || !response.answer || response.answer < 1 || response.answer > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid response format',
                });
            }
        }

        const { score, status } = calculateScoreAndStatus(responses);

        // Check if assessment already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAssessment = await MentalFitnessAssessment.findOne({
            user: userId,
            date: today,
        });

        let assessment;
        if (existingAssessment) {
            // Update existing assessment
            existingAssessment.responses = responses;
            existingAssessment.score = score;
            existingAssessment.status = status;
            existingAssessment.completedAt = new Date();
            assessment = await existingAssessment.save();
        } else {
            // Create new assessment
            assessment = await MentalFitnessAssessment.create({
                user: userId,
                date: today,
                responses,
                score,
                status,
            });
        }

        res.json({
            success: true,
            message: 'Assessment submitted successfully',
            data: {
                score,
                status,
                completedAt: assessment.completedAt,
            },
        });
    } catch (error) {
        console.error('Error submitting mental fitness assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to submit assessment' });
    }
};

// Get user's latest assessment
export const getMyLatestAssessment = async (req, res) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const assessment = await MentalFitnessAssessment.findOne({
            user: userId,
            date: today,
        }).sort({ completedAt: -1 });

        if (!assessment) {
            return res.json({
                success: true,
                data: null,
            });
        }

        res.json({
            success: true,
            data: {
                score: assessment.score,
                status: assessment.status,
                completedAt: assessment.completedAt,
                responses: assessment.responses,
            },
        });
    } catch (error) {
        console.error('Error fetching latest assessment:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assessment' });
    }
};

// Get team assessments (supervisor only)
export const getTeamAssessments = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Get all workers
        const workers = await User.find({ role: 'worker' }).select('name email');

        // Get assessments for the date
        const assessments = await MentalFitnessAssessment.find({
            date: targetDate,
        }).populate('user', 'name email');

        // Create a map of user assessments
        const assessmentMap = new Map();
        assessments.forEach((assessment) => {
            assessmentMap.set(assessment.user._id.toString(), {
                score: assessment.score,
                status: assessment.status,
                completedAt: assessment.completedAt,
            });
        });

        // Build response with all workers
        const teamData = workers.map((worker) => {
            const assessment = assessmentMap.get(worker._id.toString());
            return {
                userId: worker._id,
                name: worker.name,
                email: worker.email,
                score: assessment ? assessment.score : null,
                status: assessment ? assessment.status : 'not_completed',
                completedAt: assessment ? assessment.completedAt : null,
            };
        });

        res.json({
            success: true,
            data: teamData,
            meta: {
                date: targetDate,
                totalWorkers: workers.length,
                completed: assessments.length,
                pending: workers.length - assessments.length,
            },
        });
    } catch (error) {
        console.error('Error fetching team assessments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch team assessments' });
    }
};

// Get team statistics (supervisor only)
export const getTeamStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const assessments = await MentalFitnessAssessment.find({ date: today });
        const totalWorkers = await User.countDocuments({ role: 'worker' });

        const stats = {
            total: totalWorkers,
            completed: assessments.length,
            pending: totalWorkers - assessments.length,
            fit: assessments.filter((a) => a.status === 'fit').length,
            caution: assessments.filter((a) => a.status === 'caution').length,
            unfit: assessments.filter((a) => a.status === 'unfit').length,
            averageScore: assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
                : 0,
        };

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching team stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
};
