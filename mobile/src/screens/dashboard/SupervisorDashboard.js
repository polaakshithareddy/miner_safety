
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import SOSButton from '../../components/sos/SOSButton';
import LanguageSelector from '../../components/common/LanguageSelector';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SupervisorDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [data, setData] = useState({
        summary: {
            totalWorkers: 0,
            averageScore: 0,
            highRiskCount: 0,
            lowRiskCount: 0,
        },
        alerts: [],
        topCompliantWorkers: [],
        atRiskWorkers: []
    });
    const [incompleteChecklists, setIncompleteChecklists] = useState([]);

    const loadData = async () => {
        try {
            const response = await api.get('/behavior/supervisor/overview').catch(e => ({ data: { success: false } }));
            if (response.data?.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load supervisor data', error);
        }
    };

    const loadIncompleteChecklists = async () => {
        try {
            const response = await api.get('/checklist/incomplete').catch(e => ({ data: { success: false } }));
            if (response.data?.success) {
                setIncompleteChecklists(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to load incomplete checklists', error);
        }
    };

    useEffect(() => {
        loadData();
        loadIncompleteChecklists();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
        loadIncompleteChecklists();
        setRefreshing(false);
    };

    const handleResolveAlert = async (alertId) => {
        try {
            const response = await api.post(`/behavior/alerts/${alertId}/notify`);
            if (response.data.success) {
                Alert.alert("Success", response.data.message);
                loadData(); // Reload data to update UI
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to notify employee");
        }
    };

    const handleNudge = async (userId, userName) => {
        try {
            const response = await api.post('/checklist/nudge', { userId });
            if (response.data.success) {
                Alert.alert("Sent!", `Nudge sent to ${userName}`);
            }
        } catch (error) {
            console.error(error);
            // Handle specific restriction error msg
            const msg = error.response?.data?.message || "Failed to send nudge";
            Alert.alert("Error", msg);
        }
    };

    const handleAppreciate = async (userId, userName) => {
        try {
            // In a real app, this would send a notification/badge/reward to the employee
            // For now, we'll show a confirmation and could log it
            Alert.alert(
                "🏆 Appreciate Employee",
                `Send appreciation to ${userName} for excellent safety performance?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Send",
                        onPress: async () => {
                            // Could call an API endpoint like /appreciation/send
                            // For now, just show success
                            Alert.alert("✅ Sent!", `${userName} has been notified of your appreciation!`);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to send appreciation");
        }
    };

    // --- COMPONENTS ---

    // Giant Icon Action Button (Same as Worker Dashboard)
    const IconAction = ({ icon, label, color, route, badge }) => (
        <TouchableOpacity
            style={styles.iconAction}
            onPress={() => route && navigation.navigate(route)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
                <MaterialIcons name={icon} size={48} color={color} />
                {badge > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.iconLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const StatTile = ({ label, value, icon, color }) => (
        <View style={styles.statTile}>
            <View style={[styles.statIconBox, { backgroundColor: color + '20' }]}>
                <MaterialIcons name={icon} size={28} color={color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
                        <MaterialIcons name="menu" size={28} color="#1a1a1a" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{t('supervisor_panel', { defaultValue: 'Supervisor' })}</Text>
                        <Text style={styles.headerName}>{user?.name}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => setLangModalVisible(true)} style={styles.langButton}>
                    <MaterialIcons name="language" size={28} color="#1a1a1a" />
                </TouchableOpacity>
            </View>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <LanguageSelector visible={langModalVisible} onClose={() => setLangModalVisible(false)} />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Stats Row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                    <StatTile
                        label={t('team_size', { defaultValue: 'Team' })}
                        value={data.summary.totalWorkers}
                        icon="groups"
                        color="#3b82f6"
                    />
                    <StatTile
                        label={t('avg_score', { defaultValue: 'Avg Score' })}
                        value={`${Math.round(data.summary.averageScore)}%`}
                        icon="speed"
                        color="#10b981"
                    />
                    <StatTile
                        label={t('at_risk', { defaultValue: 'At Risk' })}
                        value={data.summary.highRiskCount}
                        icon="warning"
                        color="#ef4444"
                    />
                </ScrollView>

                {/* Primary Actions Grid */}
                <Text style={styles.sectionTitle}>{t('manage_team', { defaultValue: 'Manage Team' })}</Text>
                <View style={styles.iconGrid}>
                    <IconAction
                        icon="assignment"
                        label={t('checklist_status', { defaultValue: 'Checklists' })}
                        color="#3b82f6"
                        route="DailyChecklist" // Could act as reviewer view
                        badge={incompleteChecklists.length}
                    />
                    <IconAction
                        icon="report-problem"
                        label={t('hazard_reports', { defaultValue: 'Reports' })}
                        color="#ef4444"
                        route="HazardReport" // Should verify/review
                        badge={data.alerts.length}
                    />
                    <IconAction
                        icon="campaign"
                        label={t('broadcast', { defaultValue: 'Broadcast' })}
                        color="#8b5cf6"
                        route="FeedScreen"
                    />
                    <IconAction
                        icon="people"
                        label={t('team_list', { defaultValue: 'My Team' })}
                        color="#10b981"
                        route="TeamList"
                    />
                </View>

                {data.alerts.length > 0 && (
                    <View style={styles.alertSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="notifications-active" size={24} color="#ef4444" />
                            <Text style={[styles.sectionTitle, { marginBottom: 0, color: '#ef4444' }]}>{t('active_behavioral_alerts', { defaultValue: 'Active Behavioural Alerts' })}</Text>
                        </View>
                        {data.alerts.map((alert, index) => (
                            <View key={index} style={styles.alertCard}>
                                <View style={styles.alertIcon}>
                                    <MaterialIcons name="warning" size={24} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.alertTitle}>{alert.type?.replace('_', ' ') || 'Alert'}</Text>
                                    <Text style={styles.alertText}>{alert.user?.name} - {alert.severity}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.resolveButton}
                                    onPress={() => handleResolveAlert(alert._id)}
                                >
                                    <Text style={styles.resolveText}>{t('resolve', { defaultValue: 'RESOLVE' })}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Pending Checklists List */}
                <Text style={styles.sectionTitle}>{t('pending_checklists', { defaultValue: 'Pending Checklists' })}</Text>
                {incompleteChecklists.length === 0 ? (
                    <View style={styles.successState}>
                        <MaterialIcons name="check-circle" size={48} color="#10b981" />
                        <Text style={styles.successText}>{t('all_checked_in', { defaultValue: 'Everyone Checked In!' })}</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {incompleteChecklists.slice(0, 5).map((item, idx) => (
                            <View key={idx} style={styles.listItem}>
                                <View style={[styles.avatar, { backgroundColor: '#f3f4f6' }]}>
                                    <Text style={styles.avatarText}>{item.user?.name?.charAt(0) || '?'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{item.user?.name}</Text>
                                    <Text style={styles.itemSub}>{item.items?.filter(i => !i.completed).length} tasks remaining</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.nudgeButton}
                                    onPress={() => handleNudge(item.user?._id, item.user?.name)}
                                >
                                    <MaterialIcons name="notifications" size={20} color="#f59e0b" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Top Performers (Compact) */}
                <Text style={styles.sectionTitle}>{t('top_performers', { defaultValue: 'Top Performers' })}</Text>
                <View style={[styles.listContainer, { marginBottom: 40 }]}>
                    {data.topCompliantWorkers.slice(0, 3).map((worker, idx) => (
                        <View key={idx} style={styles.listItem}>
                            <Text style={styles.rank}>#{idx + 1}</Text>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.itemName}>{worker.user?.name}</Text>
                                <Text style={styles.itemSub}>{worker.user?.operationRole || 'Worker'}</Text>
                            </View>
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>{worker.complianceScore}</Text>
                            </View>
                            {idx === 0 && (
                                <TouchableOpacity
                                    style={styles.appreciateButton}
                                    onPress={() => handleAppreciate(worker.user?._id, worker.user?.name)}
                                >
                                    <MaterialIcons name="emoji-events" size={20} color="#fbbf24" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

            </ScrollView>
            <SOSButton />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuButton: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    langButton: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    headerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    statsRow: {
        marginBottom: 32,
        flexGrow: 0,
    },
    statTile: {
        backgroundColor: '#fff',
        padding: 16,
        paddingRight: 24,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        minWidth: 140,
    },
    statIconBox: {
        padding: 10,
        borderRadius: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
        marginLeft: 4,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    iconAction: {
        width: (width - 52) / 2,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#ef4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    iconLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 32,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748b',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    itemSub: {
        fontSize: 13,
        color: '#ef4444',
        marginTop: 2,
    },
    nudgeButton: {
        padding: 8,
        backgroundColor: '#fffbeb',
        borderRadius: 8,
    },
    rank: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#94a3b8',
        width: 28,
    },
    scoreBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scoreText: {
        color: '#059669',
        fontWeight: 'bold',
    },
    successState: {
        backgroundColor: '#ecfdf5',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        gap: 12,
    },
    successText: {
        color: '#059669',
        fontSize: 16,
        fontWeight: 'bold',
    },
    alertSection: {
        backgroundColor: '#fef2f2',
        borderRadius: 20,
        padding: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    alertCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 8,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    alertText: {
        fontSize: 13,
        color: '#64748b',
    },
    resolveButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    resolveText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
    },
    appreciateButton: {
        backgroundColor: '#fef3c7',
        padding: 10,
        borderRadius: 12,
        marginLeft: 8,
    }
});

export default SupervisorDashboard;
