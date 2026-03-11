import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, ImageBackground, Image, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import api, { BASE_URL } from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import SOSButton from '../../components/sos/SOSButton';
import { changeLanguage } from '../../i18n';

const { width, height } = Dimensions.get('window');

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const [stats, setStats] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { t } = useTranslation();
    const [updatedUser, setUpdatedUser] = useState(user);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/behavior/snapshots/me?limit=1');
            if (response.data?.data?.latest) {
                setStats(response.data.data.latest);
            }

            // Fetch User Posts for Profile Grid
            const postsRes = await api.get(`/posts/user/${user._id}`);
            setMyPosts(postsRes.data || []);

            // Fetch fresh user profile for following counts (Assuming endpoint exists or we use auth/me)
            // Ideally should be GET /api/users/profile or similar.
            // But we don't have a specific point for that. 
            // We can rely on user object IF we had refreshed it.
            // Let's assume user.followers and user.following are present in token/context?
            // Actually, context user might be old.
            // Let's try to trust user object for now, or fetch if needed.
            if (user) {
                // In a real app, you'd call api.get('/auth/me') to refresh "user"
                setUpdatedUser(user);
            }

        } catch (error) {
            console.log('Error fetching profile stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const onLanguageSelect = async (langCode) => {
        await changeLanguage(langCode);
        setLanguageModalVisible(false);
        // Stats and other data might need refresh or re-render is handled by hook
    };

    const renderLanguageItem = ({ item }) => (
        <TouchableOpacity
            style={styles.languageItem}
            onPress={() => onLanguageSelect(item.code)}
        >
            <Text style={styles.languageLabel}>{item.label}</Text>
            <Text style={styles.languageNative}>{item.native}</Text>
            {/* You could add a checkmark if it's the current language */}
        </TouchableOpacity>
    );

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return ['#10b981', '#059669']; // Green
            case 'medium': return ['#f59e0b', '#d97706']; // Amber
            case 'high': return ['#ef4444', '#dc2626']; // Red
            default: return ['#3b82f6', '#2563eb']; // Blue default
        }
    };

    const riskColors = getRiskColor(stats?.riskLevel);

    // Initial generated avatar based on name
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=200`;

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                style={styles.background}
            />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <SafeAreaView edges={['top']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.iconButton}>
                            <MaterialIcons name="menu" size={32} color="#1e293b" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setLanguageModalVisible(true)}>
                                <MaterialIcons name="language" size={28} color="#3b82f6" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={logout}>
                                <MaterialIcons name="logout" size={28} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.profileHero}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            <View style={[styles.statusIndicator, { backgroundColor: riskColors[0] }]} />
                        </View>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <View style={styles.roleBadge}>
                            <MaterialIcons name="verified-user" size={16} color="#fff" />
                            <Text style={styles.roleText}>{user?.role?.replace('_', ' ').toUpperCase() || 'MEMBER'}</Text>
                        </View>
                        <View style={styles.followStats}>
                            <Text style={styles.followText}>
                                <Text style={styles.followCount}>{updatedUser?.followers?.length || 0}</Text> {t('followers', { defaultValue: 'Followers' })}
                            </Text>
                            <Text style={styles.followDivider}>•</Text>
                            <Text style={styles.followText}>
                                <Text style={styles.followCount}>{updatedUser?.following?.length || 0}</Text> {t('following', { defaultValue: 'Following' })}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>

                {/* Visual Stats Dashboard - Only for Employees/Workers */}
                {user?.role !== 'admin' && user?.role !== 'supervisor' && (
                    <View style={styles.statsGrid}>
                        <LinearGradient
                            colors={riskColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.mainStatCard}
                        >
                            <View style={styles.statIconContainer}>
                                <MaterialCommunityIcons name="shield-check" size={40} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.statTitle}>{t('safety_score', { defaultValue: 'Safety Score' })}</Text>
                                <Text style={styles.statBigValue}>{stats?.complianceScore || '100'}%</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.secondaryStats}>
                            <View style={styles.smallStatCard}>
                                <MaterialCommunityIcons name="fire" size={28} color="#f59e0b" />
                                <Text style={styles.statValue}>{stats?.streakCount || 0}</Text>
                                <Text style={styles.statLabel}>{t('days_streak', { defaultValue: 'Streak' })}</Text>
                            </View>
                            <View style={styles.smallStatCard}>
                                <MaterialCommunityIcons name="star" size={28} color="#fbbf24" />
                                <Text style={styles.statValue}>Gold</Text>
                                <Text style={styles.statLabel}>{t('level', { defaultValue: 'Level' })}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* My Posts Section (Replaces Action Grid for space, or keeping it below) */}
                {/* Let's keep Action Grid as it's useful, and put My Posts below it */}

                <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DailyChecklist')}>
                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionIcon}>
                            <MaterialCommunityIcons name="clipboard-check" size={40} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.actionText}>{t('daily_checklist')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('HazardReport')}>
                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.actionIcon}>
                            <MaterialCommunityIcons name="alert-octagon" size={40} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.actionText}>{t('report_hazard')}</Text>
                    </TouchableOpacity>
                </View>

                {/* My Safety Posts */}
                <Text style={styles.sectionTitle}>{t('my_safety_posts', { defaultValue: 'My Safety Posts' })}</Text>
                {myPosts.length === 0 ? (
                    <Text style={styles.emptyText}>{t('no_posts_yet', { defaultValue: 'No posts yet.' })}</Text>
                ) : (
                    <View style={styles.postsGrid}>
                        {myPosts.map((post) => (
                            <TouchableOpacity
                                key={post._id}
                                style={styles.postThumb}
                                onPress={() => navigation.navigate('EditPost', { post })} // Editing shortcut
                            >
                                {post.mediaType === 'video' ? (
                                    <View style={[styles.thumbImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                                        <MaterialIcons name="play-circle-filled" size={32} color="#fff" opacity={0.8} />
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: getFullUrl(post.mediaUrl) }}
                                        style={styles.thumbImage}
                                        resizeMode="cover"
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

            </ScrollView>
            <SOSButton />

            {/* Language Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={languageModalVisible}
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('language', { defaultValue: 'Language' })}</Text>
                            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={LANGUAGES}
                            renderItem={renderLanguageItem}
                            keyExtractor={item => item.code}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    background: {
        position: 'absolute',
        top: 0, left: 0, right: 0, height: height * 0.4,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    iconButton: {
        padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12,
    },
    profileHero: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative', marginBottom: 16,
    },
    avatar: {
        width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: 'rgba(0,0,0,0.1)',
    },
    statusIndicator: {
        position: 'absolute', bottom: 8, right: 8, width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderColor: '#ffffff',
    },
    userName: {
        fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6,
    },
    roleText: {
        color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1,
    },
    followStats: {
        flexDirection: 'row',
        marginTop: 15,
        alignItems: 'center'
    },
    followText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '500'
    },
    followCount: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 16
    },
    followDivider: {
        marginHorizontal: 10,
        color: '#cbd5e1'
    },
    statsGrid: {
        flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 32,
    },
    mainStatCard: {
        flex: 2, borderRadius: 24, padding: 20, justifyContent: 'space-between', height: 160,
    },
    statIconContainer: {
        alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 16,
    },
    statTitle: {
        color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginBottom: 4,
    },
    statBigValue: {
        color: '#fff', fontSize: 42, fontWeight: 'bold',
    },
    secondaryStats: {
        flex: 1, gap: 12,
    },
    smallStatCard: {
        flex: 1, backgroundColor: '#ffffff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    },
    statValue: {
        color: '#0f172a', fontSize: 20, fontWeight: 'bold', marginTop: 4,
    },
    statLabel: {
        color: '#64748b', fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginLeft: 20, marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 16, marginBottom: 32,
    },
    actionCard: {
        width: (width - 56) / 2, backgroundColor: '#ffffff', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
    },
    actionIcon: {
        width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
    },
    actionText: {
        color: '#1e293b', fontSize: 16, fontWeight: '600', textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center', color: '#999', marginBottom: 20,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 10,
    },
    postThumb: {
        width: (width - 60) / 3, // 3 column grid considering gaps
        height: (width - 60) / 3,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#eee',
        marginBottom: 10
    },
    thumbImage: {
        width: '100%',
        height: '100%'
    },
    // New Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20, fontWeight: 'bold', color: '#0f172a',
    },
    languageItem: {
        paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    languageLabel: {
        fontSize: 16, fontWeight: '500', color: '#0f172a',
    },
    languageNative: {
        fontSize: 14, color: '#64748b',
    },
    separator: {
        height: 1, backgroundColor: '#f1f5f9',
    },
});

export default ProfileScreen;
