import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/axiosConfig';

const TeamMentalFitness = () => {
    const [teamData, setTeamData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamMentalFitness();
    }, []);

    const fetchTeamMentalFitness = async () => {
        try {
            const [teamResponse, statsResponse] = await Promise.all([
                api.get('/mental-fitness/team'),
                api.get('/mental-fitness/stats'),
            ]);
            setTeamData(teamResponse.data.data);
            setStats(statsResponse.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch team mental fitness:', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'fit':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'caution':
                return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'unfit':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'fit':
                return '✓';
            case 'caution':
                return '⚠';
            case 'unfit':
                return '✕';
            default:
                return '-';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase">Total Workers</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-200">
                        <p className="text-xs text-emerald-600 uppercase">Fit to Work</p>
                        <p className="text-2xl font-bold text-emerald-700">{stats.fit}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-200">
                        <p className="text-xs text-amber-600 uppercase">Caution</p>
                        <p className="text-2xl font-bold text-amber-700">{stats.caution}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200">
                        <p className="text-xs text-red-600 uppercase">Unfit</p>
                        <p className="text-2xl font-bold text-red-700">{stats.unfit}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-xs text-slate-600 uppercase">Pending</p>
                        <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
                    </div>
                </div>
            )}

            {/* Team Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900">Team Mental Fitness - Today</h3>
                    <p className="text-sm text-slate-600 mt-1">Monitor your team's mental readiness for work</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Worker
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Completed At
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {teamData.map((worker) => (
                                <motion.tr
                                    key={worker.userId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-slate-50 transition"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="font-medium text-slate-900">{worker.name}</p>
                                            <p className="text-xs text-slate-500">{worker.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        {worker.score !== null ? (
                                            <span className="text-2xl font-bold text-slate-900">{worker.score}</span>
                                        ) : (
                                            <span className="text-2xl text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(worker.status)}`}>
                                            <span className="text-lg">{getStatusIcon(worker.status)}</span>
                                            {worker.status === 'not_completed' ? 'Not Completed' : worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {worker.completedAt ? new Date(worker.completedAt).toLocaleTimeString() : '-'}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Alert for Unfit Workers */}
            {stats && stats.unfit > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border-2 border-red-300 rounded-xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-600 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-red-900">Immediate Action Required</h4>
                            <p className="mt-1 text-sm text-red-700">
                                {stats.unfit} worker{stats.unfit > 1 ? 's are' : ' is'} marked as unfit to work today. Please speak with them immediately to provide support and ensure they do not work in unsafe conditions.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default TeamMentalFitness;
