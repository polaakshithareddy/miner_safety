import mongoose from 'mongoose';

const { Schema } = mongoose;

const responseSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: Number, required: true, min: 1, max: 5 },
}, { _id: false });

const mentalFitnessAssessmentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        default: () => {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        },
    },
    responses: [responseSchema],
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    status: {
        type: String,
        enum: ['fit', 'caution', 'unfit'],
        required: true,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Index for efficient queries
mentalFitnessAssessmentSchema.index({ user: 1, date: -1 });
mentalFitnessAssessmentSchema.index({ date: -1 });

export default mongoose.model('MentalFitnessAssessment', mentalFitnessAssessmentSchema);
