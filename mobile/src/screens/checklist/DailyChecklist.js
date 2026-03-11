import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Animated,
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Assuming this is available
import api from '../../services/api';
import SOSButton from '../../components/sos/SOSButton';
import { useAuth } from '../../context/AuthContext';


const { width } = Dimensions.get('window');

const DailyChecklist = ({ navigation }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [checklist, setChecklist] = useState({
        items: [],
        date: new Date().toISOString().split('T')[0],
        checklistId: null,
        completionBonus: 0,
        type: 'daily'
    });
    const [streak, setStreak] = useState(0);
    const [saving, setSaving] = useState(false);

    // Animation refs for cards
    const cardScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchChecklist();
        loadStreak();
    }, []);

    const fetchChecklist = async () => {
        try {
            if (!user?._id) return;
            const response = await api.get(`/checklist/${user._id}`);

            if (response.data.success && response.data.data?.items?.length > 0) {
                setChecklist({
                    items: response.data.data.items,
                    date: response.data.data.date,
                    checklistId: response.data.data._id,
                    completionBonus: response.data.data.completionBonus,
                    type: response.data.data.type
                });
            } else {
                loadOfflineChecklist();
            }
        } catch (error) {
            loadOfflineChecklist();
        } finally {
            setLoading(false);
        }
    };

    // ... (Keep existing helpers like normalizedTask, loadOfflineChecklist etc. to ensure logic works) ...
    // Re-implementing them briefly for self-containment
    const taskMapping = {
        'Put on hard hat, safety boots, and high-visibility vest': 'checklist_ppe',
        'Check personal gas detector is functioning': 'checklist_gas',
        'Review assigned tasks and safety procedures': 'checklist_tasks',
        'Verify communication device (radio/phone) is working': 'checklist_comms',
        'Confirm ventilation system is operating in work area': 'checklist_vent',
        'Inspect tools and equipment for damage or defects': 'checklist_tools',
        'Inspect immediate work area for hazards': 'checklist_area',
        'Verify emergency exit routes are clear': 'checklist_exit',
        'Report any unsafe conditions to supervisor': 'checklist_report'
    };

    const normalizeTask = (task) => taskMapping[task] || task;

    const getIconForTask = (taskKey) => {
        const key = normalizeTask(taskKey);
        switch (key) {
            case 'checklist_ppe': return 'security';
            case 'checklist_gas': return 'sensors';
            case 'checklist_tasks': return 'assignment';
            case 'checklist_comms': return 'radio';
            case 'checklist_vent': return 'air';
            case 'checklist_tools': return 'build';
            case 'checklist_area': return 'warning';
            case 'checklist_exit': return 'exit-to-app';
            case 'checklist_report': return 'report-problem';
            default: return 'check-circle';
        }
    };

    const getColorForTask = (taskKey) => {
        const key = normalizeTask(taskKey);
        switch (key) {
            case 'checklist_ppe': return ['#3b82f6', '#2563eb']; // Blue
            case 'checklist_gas': return ['#8b5cf6', '#7c3aed']; // Purple
            case 'checklist_tools': return ['#f97316', '#ea580c']; // Orange
            case 'checklist_area': return ['#10b981', '#059669']; // Green
            case 'checklist_report': return ['#ef4444', '#dc2626']; // Red
            default: return ['#6b7280', '#4b5563']; // Gray
        }
    };

    const checklistTemplates = {
        // Generic Roles
        employee: [
            { _id: 'e1', task: 'checklist_ppe', category: 'PPE', completed: false },
            { _id: 'e2', task: 'checklist_gas', category: 'Equipment', completed: false },
            { _id: 'e3', task: 'checklist_tools', category: 'Equipment', completed: false },
            { _id: 'e4', task: 'checklist_area', category: 'Environment', completed: false },
        ],
        supervisor: [
            { _id: 's1', task: 'Conduct pre-shift safety briefing', category: 'Team', completed: false },
            { _id: 's2', task: 'Verify employee PPE compliance', category: 'Compliance', completed: false },
            { _id: 's3', task: 'Review hazard reports', category: 'Reporting', completed: false },
            { _id: 's4', task: 'Inspect emergency equipment', category: 'Safety', completed: false }
        ],

        // Operational Roles (Dynamic Selection)
        blaster: [
            { _id: 'b1', task: 'Inspect blast area clearance', category: 'Site Prep', completed: false },
            { _id: 'b2', task: 'Verify warning signals operational', category: 'Signals', completed: false },
            { _id: 'b3', task: 'Check detention cord integrity', category: 'Equipment', completed: false },
            { _id: 'b4', task: 'checklist_ppe', category: 'PPE', completed: false }
        ],
        driller: [
            { _id: 'd1', task: 'Inspect rig hydraulics', category: 'Equipment', completed: false },
            { _id: 'd2', task: 'Check emergency stop functionality', category: 'Safety', completed: false },
            { _id: 'd3', task: 'Verify water suppression system', category: 'Dust Control', completed: false },
            { _id: 'd4', task: 'checklist_area', category: 'Site', completed: false }
        ],
        electrician: [
            { _id: 'el1', task: 'Lockout/Tagout verification', category: 'LOTO', completed: false },
            { _id: 'el2', task: 'Inspect insulation tools', category: 'Equipment', completed: false },
            { _id: 'el3', task: 'Test voltage detectors', category: 'Testing', completed: false },
            { _id: 'el4', task: 'checklist_ppe', category: 'PPE', completed: false }
        ],
        driver: [
            { _id: 'dr1', task: 'Check brakes and steering', category: 'Vehicle', completed: false },
            { _id: 'dr2', task: 'Inspect tires and lights', category: 'Vehicle', completed: false },
            { _id: 'dr3', task: 'Clean mirrors and windows', category: 'Visibility', completed: false },
            { _id: 'dr4', task: 'Verify radio communication', category: 'Comms', completed: false }
        ],
        loader: [
            { _id: 'l1', task: 'Inspect bucket and teeth', category: 'Equipment', completed: false },
            { _id: 'l2', task: 'Check hydraulic levels', category: 'Maintenance', completed: false },
            { _id: 'l3', task: 'Verify backup alarm', category: 'Safety', completed: false },
            { _id: 'l4', task: 'checklist_area', category: 'Site', completed: false }
        ]
    };

    const loadOfflineChecklist = async () => {
        const userRole = user?.role || 'employee';
        const opRole = user?.operationRole?.toLowerCase();

        // Dynamic Selection Priority:
        // 1. Operational Role (e.g. "blaster")
        // 2. System Role (e.g. "supervisor")
        // 3. Fallback to "employee"

        let template = checklistTemplates.employee;

        if (opRole && checklistTemplates[opRole]) {
            console.log(`Loading dynamic checklist for operation role: ${opRole} `);
            template = checklistTemplates[opRole];
        } else if (checklistTemplates[userRole]) {
            console.log(`Loading standard checklist for role: ${userRole} `);
            template = checklistTemplates[userRole];
        }

        setChecklist(prev => ({ ...prev, items: template, checklistId: 'offline-mode' }));
    };

    const loadStreak = async () => {
        const saved = await AsyncStorage.getItem(`checklist_streak_${user?._id} `);
        if (saved) setStreak(parseInt(saved));
    };

    const handleCheckItem = async (itemId, status) => {
        setSaving(true);
        // Animate press
        Animated.sequence([
            Animated.timing(cardScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(cardScale, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();

        const updatedItems = checklist.items.map(item =>
            item._id === itemId ? { ...item, completed: status } : item
        );

        setChecklist(prev => ({ ...prev, items: updatedItems }));

        // Optimistic only for now to ensure speed
        if (checklist.checklistId !== 'offline-mode') {
            api.patch('/checklist/complete', { checklistId: checklist.checklistId, itemId }).catch(console.error);
        }

        const allCompleted = updatedItems.every(i => i.completed);
        if (allCompleted) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            AsyncStorage.setItem(`checklist_streak_${user?._id} `, newStreak.toString());
            // Could trigger celebration modal here
        }
        setSaving(false);
    };

    const calculateProgress = () => {
        if (!checklist.items.length) return 0;
        const completed = checklist.items.filter(i => i.completed).length;
        return Math.round((completed / checklist.items.length) * 100);
    };

    // --- RENDERERS ---

    const renderEmployeeCard = (item, index) => {
        const colors = getColorForTask(item.task);
        const isCompleted = item.completed;

        return (
            <Animated.View key={item._id} style={[styles.cardContainer, { transform: [{ scale: 1 }] }]}>
                <LinearGradient
                    colors={isCompleted ? ['#ecfdf5', '#d1fae5'] : ['#ffffff', '#ffffff']}
                    style={[styles.bigCard, isCompleted && styles.bigCardCompleted]}
                >
                    {/* Header: Step Number & Category */}
                    <View style={styles.cardHeader}>
                        <View style={styles.stepBadge}>
                            <Text style={styles.stepText}>{t('step', { defaultValue: 'STEP' })} {index + 1}</Text>
                        </View>
                        <Text style={styles.cardCategory}>{item.category || t('safety_check', { defaultValue: 'Safety Check' })}</Text>
                    </View>

                    {/* Giant Icon */}
                    <View style={[styles.iconBubble, { backgroundColor: isCompleted ? '#10b981' : colors[0] + '20' }]}>
                        <MaterialIcons
                            name={isCompleted ? "check" : getIconForTask(item.task)}
                            size={80}
                            color={isCompleted ? "#fff" : colors[0]}
                        />
                    </View>

                    {/* Question Text */}
                    <Text style={styles.questionText}>
                        {t(normalizeTask(item.task))}?
                    </Text>

                    {/* Action Buttons */}
                    {!isCompleted ? (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.noButton]}
                                onPress={() => Alert.alert(
                                    t('report_issue', { defaultValue: "Report Issue" }),
                                    t('report_supervisor_msg', { defaultValue: "Please report this to your supervisor immediately." })
                                )}
                            >
                                <MaterialIcons name="thumb-down" size={48} color="#ef4444" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.yesButton]}
                                onPress={() => handleCheckItem(item._id, true)}
                            >
                                <MaterialIcons name="thumb-up" size={48} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.completedState}>
                            <Text style={styles.completedText}>✅ {t('checked_safe', { defaultValue: 'CHECKED SAFE' })}</Text>
                            <TouchableOpacity onPress={() => handleCheckItem(item._id, false)}>
                                <Text style={styles.undoText}>{t('undo', { defaultValue: 'Undo' })}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </LinearGradient>
            </Animated.View>
        );
    };

    const renderSupervisorList = () => (
        <View style={styles.listContainer}>
            {checklist.items.map(item => (
                <TouchableOpacity
                    key={item._id}
                    style={[styles.listCard, item.completed && styles.listCardCompleted]}
                    onPress={() => handleCheckItem(item._id, !item.completed)}
                >
                    <MaterialIcons
                        name={item.completed ? "check-box" : "check-box-outline-blank"}
                        size={28}
                        color={item.completed ? "#10b981" : "#6b7280"}
                    />
                    <Text style={[styles.listText, item.completed && styles.listTextCompleted]}>
                        {t(normalizeTask(item.task))}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const isEmployee = user?.role === 'employee' || user?.role === 'worker';
    const progress = calculateProgress();

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Bar */}

            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
                    <MaterialIcons name="arrow-back" size={28} color="#1a1a1a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{t('daily_checklist')}</Text>
                    <Text style={styles.headerDate}>{new Date().toLocaleDateString()}</Text>
                </View>
                <View style={styles.streakBadge}>
                    <Text>🔥 {streak}</Text>
                </View>
            </View>



            {
                loading ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Progress Header */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressInfo}>
                                <Text style={styles.progressLabel}>{t('your_progress', { defaultValue: 'Your Progress' })}</Text>
                                <Text style={styles.progressValue}>{progress}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[
                                    styles.progressBarFill,
                                    { width: `${progress}% `, backgroundColor: progress === 100 ? '#10b981' : '#3b82f6' }
                                ]} />
                            </View>
                        </View>

                        {/* Content Based on Role */}
                        {isEmployee ? (
                            <View style={styles.cardsContainer}>
                                {checklist.items.map((item, index) => renderEmployeeCard(item, index))}

                                {progress === 100 && (
                                    <View style={styles.celebrationCard}>
                                        <Text style={styles.celebrationEmoji}>🎉</Text>
                                        <Text style={styles.celebrationTitle}>{t('all_clear', { defaultValue: 'All Clear!' })}</Text>
                                        <Text style={styles.celebrationText}>{t('safe_start_work', { defaultValue: 'You are safe to start work.' })}</Text>
                                        <TouchableOpacity
                                            style={styles.homeButton}
                                            onPress={() => navigation.navigate('WorkerDashboard')}
                                        >
                                            <Text style={styles.homeButtonText}>{t('go_to_dashboard', { defaultValue: 'GO TO DASHBOARD' })}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ) : (
                            renderSupervisorList()
                        )}

                    </ScrollView>
                )
            }
            <SOSButton />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        justifyContent: 'space-between'
    },
    menuButton: {
        padding: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerDate: {
        fontSize: 12,
        color: '#6b7280',
    },
    streakBadge: {
        backgroundColor: '#fffbeb',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    progressSection: {
        marginBottom: 24,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontWeight: '600',
        color: '#4b5563',
    },
    progressValue: {
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    progressBarBg: {
        height: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },

    // --- EMPLOYEE CARDS ---
    cardsContainer: {
        gap: 20,
    },
    cardContainer: {
        marginBottom: 4,
    },
    bigCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    bigCardCompleted: {
        borderColor: '#10b981',
        borderWidth: 2,
    },
    cardHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    stepBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stepText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    cardCategory: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3b82f6',
        textTransform: 'uppercase',
    },
    iconBubble: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    questionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 32,
    },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 16,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    noButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 2,
        borderColor: '#fee2e2',
    },
    yesButton: {
        backgroundColor: '#10b981', // Solid Green
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    noText: {
        color: '#ef4444',
        fontSize: 18,
        fontWeight: 'bold',
    },
    yesText: {
        color: '#fff',
        fontSize: 20, // Slightly larger
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    completedState: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    completedText: {
        color: '#10b981',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    undoText: {
        color: '#9ca3af',
        textDecorationLine: 'underline',
    },

    // --- CELEBRATION ---
    celebrationCard: {
        backgroundColor: '#ecfdf5',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#10b981',
        marginTop: 20,
    },
    celebrationEmoji: {
        fontSize: 60,
        marginBottom: 16,
    },
    celebrationTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#065f46',
        marginBottom: 8,
    },
    celebrationText: {
        color: '#047857',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    homeButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    homeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // --- SUPERVISOR LIST ---
    listContainer: {
        gap: 12,
    },
    listCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    listCardCompleted: {
        backgroundColor: '#f9fafb',
    },
    listText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    listTextCompleted: {
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
});

export default DailyChecklist;
