import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

const MentalFitnessQuestionnaire = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuestions();
        checkExistingAssessment();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await api.get('/mental-fitness/questions');
            setQuestions(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            toast.error('Failed to load questionnaire');
            setLoading(false);
        }
    };

    const checkExistingAssessment = async () => {
        try {
            const response = await api.get('/mental-fitness/my-latest');
            if (response.data.data) {
                setResult(response.data.data);
                setShowResult(true);
            }
        } catch (error) {
            console.error('Failed to check existing assessment:', error);
        }
    };

    const handleAnswer = (questionIndex, answer) => {
        setResponses({
            ...responses,
            [questionIndex]: answer,
        });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        if (Object.keys(responses).length !== questions.length) {
            toast.error('Please answer all questions');
            return;
        }

        setSubmitting(true);
        try {
            const formattedResponses = questions.map((q, index) => ({
                question: q.question,
                answer: responses[index],
            }));

            const response = await api.post('/mental-fitness', {
                responses: formattedResponses,
            });

            setResult(response.data.data);
            setShowResult(true);
            toast.success('Assessment completed successfully');
        } catch (error) {
            console.error('Failed to submit assessment:', error);
            toast.error('Failed to submit assessment');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'fit':
                return 'bg-emerald-500';
            case 'caution':
                return 'bg-amber-500';
            case 'unfit':
                return 'bg-red-500';
            default:
                return 'bg-slate-500';
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'fit':
                return {
                    title: 'Fit to Work',
                    message: 'You are in good mental condition to work safely today. Stay focused and follow all safety protocols.',
                    icon: '✓',
                };
            case 'caution':
                return {
                    title: 'Proceed with Caution',
                    message: 'You may be experiencing some stress or fatigue. Please be extra careful and inform your supervisor if you feel overwhelmed.',
                    icon: '⚠',
                };
            case 'unfit':
                return {
                    title: 'Not Fit to Work',
                    message: 'Your mental state indicates you should not work today. Please speak with your supervisor immediately for support and rest.',
                    icon: '✕',
                };
            default:
                return {
                    title: 'Assessment Pending',
                    message: 'Complete the questionnaire to assess your work readiness.',
                    icon: '?',
                };
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (showResult && result) {
        const statusInfo = getStatusMessage(result.status);
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="mx-auto max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
                    >
                        <div className="text-center">
                            <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${getStatusColor(result.status)} text-4xl text-white shadow-lg`}>
                                {statusInfo.icon}
                            </div>
                            <h1 className="mt-6 text-3xl font-black text-slate-900">{statusInfo.title}</h1>
                            <div className="mt-4 rounded-2xl bg-slate-50 p-6">
                                <p className="text-6xl font-black text-slate-900">{result.score}</p>
                                <p className="mt-2 text-sm uppercase tracking-wider text-slate-500">Mental Fitness Score</p>
                            </div>
                            <p className="mt-6 text-base text-slate-600">{statusInfo.message}</p>
                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowResult(false);
                                        setResponses({});
                                        setCurrentQuestion(0);
                                    }}
                                    className="flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                    Retake Assessment
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1 rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg hover:bg-black"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const isAnswered = responses[currentQuestion] !== undefined;
    const allAnswered = Object.keys(responses).length === questions.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-slate-900">Mental Fitness Assessment</h1>
                    <p className="mt-2 text-slate-600">Answer honestly to help us ensure your safety</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Question {currentQuestion + 1} of {questions.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
                    >
                        <div className="mb-2 inline-block rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                            {currentQ?.category}
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">{currentQ?.question}</h2>

                        <div className="mt-8 space-y-3">
                            {currentQ?.options.map((option, index) => {
                                const value = index + 1;
                                const isSelected = responses[currentQuestion] === value;
                                return (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(currentQuestion, value)}
                                        className={`w-full rounded-2xl border-2 p-4 text-left transition ${isSelected
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                                }`}>
                                                {isSelected && <span className="text-white font-bold">{value}</span>}
                                                {!isSelected && <span className="text-slate-400 font-bold">{value}</span>}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                {option}
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Navigation */}
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0}
                                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={!isAnswered}
                                    className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!allAnswered || submitting}
                                    className="flex-1 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MentalFitnessQuestionnaire;
