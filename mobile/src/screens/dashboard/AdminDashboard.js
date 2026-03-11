import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import SOSNotification from '../../components/sos/SOSNotification';
import LanguageSelector from '../../components/common/LanguageSelector';
import { LinearGradient } from 'expo-linear-gradient';
import { useSOS } from '../../context/SOSContext';

const { width } = Dimensions.get('window');

const AdminDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [langModalVisible, setLangModalVisible] = useState(false);
    const { sosNotification, dismissNotification, stopSOSSound } = useSOS();
    const [stats, setStats] = useState({
        totalUsers: 0,
        checklistCompletion: 0,
        activeHazards: 0,
        averageScore: 0
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [incompleteChecklists, setIncompleteChecklists] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [loadingChecklists, setLoadingChecklists] = useState(false);

    const loadData = async () => {
        try {
            const response = await api.get('/dashboard/admin');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load admin dashboard data', error);
        } finally {
            setRefreshing(false);
        }
    };

    const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        try {
            const response = await api.get('/behavior/supervisor/overview?range=7');
            if (response.data.success) {
                const topWorkers = response.data.data.topCompliantWorkers || [];
                setLeaderboard(topWorkers.slice(0, 10));
            }
        } catch (error) {
            console.error('Failed to load compliance leaderboard', error);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    const loadIncompleteChecklists = async () => {
        setLoadingChecklists(true);
        try {
            const response = await api.get('/checklist/incomplete');
            if (response.data.success) {
                setIncompleteChecklists(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to load incomplete checklists', error);
        } finally {
            setLoadingChecklists(false);
        }
    };

    useEffect(() => {
        loadData();
        loadLeaderboard();
        loadIncompleteChecklists();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
        loadLeaderboard();
        loadIncompleteChecklists();
    };

    const handleViewSOSDetails = () => {
        navigation.navigate('SOSAlertsManagement');
    };

    const handleDismissNotification = () => {
        dismissNotification();
    };

    // GIANT Stat Card Component
    const StatCard = ({ title, value, icon, gradient }) => (
        <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
            <LinearGradient
                colors={gradient}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <MaterialIcons name={icon} size={40} color="#fff" style={styles.statIcon} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    // GIANT Menu Button Component
    const MenuButton = ({ title, icon, gradient, onPress }) => (
        <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={gradient}
                style={styles.menuGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <MaterialIcons name={icon} size={56} color="#fff" />
                <Text style={styles.menuTitle}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuIconButton}>
                            <MaterialIcons name="menu" size={32} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <View>
                                <Text style={styles.headerTitle}>{t('admin_panel', { defaultValue: 'Admin Panel' })}</Text>
                                <Text style={styles.headerSubtitle}>{t('site_overview', { defaultValue: 'Site Overview' })}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setLangModalVisible(true)} style={styles.menuIconButton}>
                            <MaterialIcons name="language" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <LanguageSelector visible={langModalVisible} onClose={() => setLangModalVisible(false)} />

                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Welcome Banner */}
                    <View style={styles.welcomeBanner}>
                        <Text style={styles.welcomeText}>{t('welcome_admin', { defaultValue: 'Welcome, Admin!' })}</Text>
                        <Text style={styles.welcomeSubtext}>{t('admin_intro', { defaultValue: 'Manage your mining site safety' })}</Text>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard
                            title={t('total_users', { defaultValue: 'Total Users' })}
                            value={stats.totalUsers}
                            icon="people"
                            gradient={['#4facfe', '#00f2fe']}
                        />
                        <StatCard
                            title={t('avg_safety_score', { defaultValue: 'Avg Score' })}
                            value={stats.averageScore || 0}
                            icon="analytics"
                            gradient={['#a8edea', '#fed6e3']}
                        />
                        <StatCard
                            title={t('compliance', { defaultValue: 'Compliance' })}
                            value={`${stats.checklistCompletion}%`}
                            icon="check-circle"
                            gradient={['#30cfd0', '#330867']}
                        />
                        <StatCard
                            title={t('active_hazards', { defaultValue: 'Hazards' })}
                            value={stats.activeHazards}
                            icon="warning"
                            gradient={['#fa709a', '#fee140']}
                        />
                    </View>

                    {/* Management Menu */}
                    <Text style={styles.sectionTitle}>🎯 {t('management', { defaultValue: 'Management' })}</Text>
                    <View style={styles.menuGrid}>
                        <MenuButton
                            title={t('manage_users', { defaultValue: 'Users' })}
                            icon="manage-accounts"
                            gradient={['#667eea', '#764ba2']}
                            onPress={() => navigation.navigate('UserManagement')}
                        />
                        <MenuButton
                            title={t('manage_reports', { defaultValue: 'Reports' })}
                            icon="summarize"
                            gradient={['#f093fb', '#f5576c']}
                            onPress={() => navigation.navigate('Reports')}
                        />
                        <MenuButton
                            title={t('manage_sos', { defaultValue: 'SOS' })}
                            icon="emergency"
                            gradient={['#ff6b6b', '#ee5a6f']}
                            onPress={() => navigation.navigate('SOSAlertsManagement')}
                        />
                        <MenuButton
                            title={t('manage_heatmap', { defaultValue: 'Heatmap' })}
                            icon="map"
                            gradient={['#ffa751', '#ffe259']}
                            onPress={() => navigation.navigate('RiskHeatmapReport')}
                        />
                    </View>

                    {/* Leaderboard */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🏆 {t('compliance_leaderboard', { defaultValue: 'Top Performers' })}</Text>
                    </View>

                    {loadingLeaderboard ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingEmoji}>⏳</Text>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : leaderboard.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyEmoji}>🏅</Text>
                            <Text style={styles.emptyText}>No data yet</Text>
                        </View>
                    ) : (
                        <View style={styles.leaderboardContainer}>
                            {leaderboard.map((worker, index) => {
                                const isTop3 = index < 3;
                                const medals = ['🥇', '🥈', '🥉'];
                                const gradients = [
                                    ['#ffd89b', '#19547b'],
                                    ['#c0c0c0', '#808080'],
                                    ['#cd7f32', '#8b4513']
                                ];

                                return (
                                    <TouchableOpacity
                                        key={worker._id || index}
                                        style={styles.leaderCard}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={isTop3 ? gradients[index] : ['#f8f9fa', '#e9ecef']}
                                            style={styles.leaderGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.leaderRank}>
                                                <Text style={styles.leaderMedal}>{isTop3 ? medals[index] : `#${index + 1}`}</Text>
                                            </View>
                                            <View style={styles.leaderInfo}>
                                                <Text style={[styles.leaderName, isTop3 && styles.leaderNameTop]}>
                                                    {worker.user?.name || 'Unknown'}
                                                </Text>
                                                <Text style={[styles.leaderRole, isTop3 && styles.leaderRoleTop]}>
                                                    {worker.user?.role || 'employee'}
                                                </Text>
                                            </View>
                                            <View style={styles.leaderScore}>
                                                <Text style={[styles.leaderScoreValue, isTop3 && styles.leaderScoreTop]}>
                                                    {worker.complianceScore || 0}
                                                </Text>
                                                <MaterialIcons
                                                    name="star"
                                                    size={20}
                                                    color={isTop3 ? '#fff' : '#fbbf24'}
                                                />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* Incomplete Checklists */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📝 {t('incomplete_checklists', { defaultValue: 'Pending Tasks' })}</Text>
                    </View>

                    {loadingChecklists ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingEmoji}>⏳</Text>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : incompleteChecklists.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyEmoji}>✅</Text>
                            <Text style={styles.emptyText}>All done!</Text>
                        </View>
                    ) : (
                        <View style={styles.checklistContainer}>
                            {incompleteChecklists.map((checklist) => (
                                <View key={checklist._id} style={styles.checklistCard}>
                                    <View style={styles.checklistAvatar}>
                                        <Text style={styles.checklistAvatarText}>
                                            {checklist.user?.name?.charAt(0) || '?'}
                                        </Text>
                                    </View>
                                    <View style={styles.checklistInfo}>
                                        <Text style={styles.checklistName}>{checklist.user?.name || 'Unknown'}</Text>
                                        <Text style={styles.checklistRole}>{checklist.user?.role || 'employee'}</Text>
                                    </View>
                                    <View style={styles.checklistBadge}>
                                        <MaterialIcons name="pending-actions" size={16} color="#ef4444" />
                                        <Text style={styles.checklistCount}>
                                            {checklist.items?.filter(item => !item.completed).length || 0}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            {/* SOS Notification */}
            {sosNotification && (
                <SOSNotification
                    alert={sosNotification}
                    onDismiss={handleDismissNotification}
                    onViewDetails={() => {
                        stopSOSSound();
                        handleViewSOSDetails();
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    menuIconButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    headerEmoji: {
        fontSize: 32,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    welcomeBanner: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 20,
    },
    welcomeEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    welcomeSubtext: {
        fontSize: 15,
        color: '#64748b',
    },
    statsGrid: {
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    statGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    statIcon: {
        marginBottom: 12,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    sectionHeader: {
        marginTop: 8,
        marginBottom: 8,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    menuButton: {
        width: (width - 56) / 2,
        aspectRatio: 1,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    menuGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 8,
    },
    menuEmoji: {
        fontSize: 40,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginTop: 8,
    },
    leaderboardContainer: {
        gap: 12,
        marginBottom: 32,
    },
    leaderCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    leaderGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    leaderRank: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    leaderMedal: {
        fontSize: 28,
    },
    leaderInfo: {
        flex: 1,
    },
    leaderName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    leaderNameTop: {
        color: '#fff',
    },
    leaderRole: {
        fontSize: 13,
        color: '#64748b',
        textTransform: 'capitalize',
    },
    leaderRoleTop: {
        color: 'rgba(255,255,255,0.8)',
    },
    leaderScore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    leaderScoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
    },
    leaderScoreTop: {
        color: '#fff',
    },
    checklistContainer: {
        gap: 12,
        marginBottom: 32,
    },
    checklistCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    checklistAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checklistAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4f46e5',
    },
    checklistInfo: {
        flex: 1,
    },
    checklistName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    checklistRole: {
        fontSize: 13,
        color: '#64748b',
        textTransform: 'capitalize',
    },
    checklistBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    checklistCount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    loadingContainer: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 32,
    },
    loadingEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    loadingText: {
        fontSize: 15,
        color: '#64748b',
    },
    emptyCard: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 32,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
});

export default AdminDashboard;
