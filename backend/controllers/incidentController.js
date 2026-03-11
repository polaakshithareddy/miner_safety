
import Incident from '../models/Incident.js';

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
export const getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find()
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: incidents.length,
            data: incidents
        });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
export const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('reportedBy', 'name email')
            .populate('resolvedBy', 'name');

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        console.error('Error fetching incident:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
export const createIncident = async (req, res) => {
    try {
        req.body.reportedBy = req.user._id;

        const incident = await Incident.create(req.body);

        res.status(201).json({
            success: true,
            data: incident
        });
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(400).json({
            success: false,
            message: 'Invalid data',
            error: error.message
        });
    }
};

// @desc    Update incident status
// @route   PUT /api/incidents/:id/status
// @access  Private (Admin/Supervisor)
export const updateIncidentStatus = async (req, res) => {
    try {
        const { status, resolution } = req.body;

        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: 'Incident not found'
            });
        }

        incident.status = status;
        if (status === 'resolved') {
            incident.resolvedAt = Date.now();
            incident.resolvedBy = req.user._id;
            if (resolution) incident.resolution = resolution;
        }

        await incident.save();

        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
