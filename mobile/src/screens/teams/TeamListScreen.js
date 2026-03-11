
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const TeamListScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            // In a real app, adjust endpoint to get strictly "my team" or all employees
            // For now, fetching compliance overview which typically returns employee data
            const response = await api.get('/behavior/supervisor/overview');

            if (response.data.success) {
                // Combine top performers + at risk + others if available, or fetch direct user list
                // Since overview might not include ALL users, let's try a dedicated users endpoint if available,
                // otherwise extract unique users from the dashboard data.

                // Constructing a list from dashboard data as a fallback to ensure we show RELEVANT people
                const allWorkers = [
                    ...(response.data.data.topCompliantWorkers || []),
                    ...(response.data.data.atRiskWorkers || [])
                ];

                // Deduplicate by ID
                const uniqueWorkers = Array.from(new Map(allWorkers.map(item => [item.user._id, item])).values());

                // If the list is too small, we might want to fetch a full user list (optional enhancement)
                setTeam(uniqueWorkers);
            }
        } catch (error) {
            console.error(error);
            Alert.alert(t('error', { defaultValue: 'Error' }), t('fetch_team_failed', { defaultValue: 'Failed to load team data' }));
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phoneNumber) => {
        if (!phoneNumber) {
            Alert.alert("No Number", "This worker hasn't listed a phone number.");
            return;
        }
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleMessage = (userId) => {
        // Navigate to chat or mock alert
        Alert.alert("Message", "Messaging feature coming soon!");
    };

    const filteredTeam = team.filter(worker =>
        worker.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.user?.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderTeamMember = ({ item }) => {
        const user = item.user || {};
        const score = item.complianceScore || 0;
        const risk = item.riskLevel || 'low';

        return (
            <View style={styles.card}>
                <View style={[styles.avatarContainer, { backgroundColor: risk === 'high' ? '#fee2e2' : '#ecfdf5' }]}>
                    <Text style={[styles.avatarText, { color: risk === 'high' ? '#ef4444' : '#10b981' }]}>
                        {user.name?.charAt(0) || '?'}
                    </Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{user.name || 'Unknown Worker'}</Text>
                    <Text style={styles.role}>{user.role || 'Employee'} • {user.operationRole || 'General'}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                            <MaterialIcons name="security" size={14} color={score >= 80 ? "#10b981" : "#f59e0b"} />
                            <Text style={styles.statText}>Score: {score}</Text>
                        </View>
                        {risk === 'high' && (
                            <View style={[styles.statChip, styles.riskChip]}>
                                <Text style={styles.riskText}>⚠️ At Risk</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e0f2fe' }]} onPress={() => handleMessage(user._id)}>
                        <MaterialIcons name="chat" size={20} color="#0284c7" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleCall(user.phone)}>
                        <MaterialIcons name="phone" size={20} color="#16a34a" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('my_team', { defaultValue: 'My Team' })}</Text>
                <TouchableOpacity style={styles.addButton}>
                    <MaterialIcons name="person-add" size={24} color="#1a1a1a" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('search_team', { defaultValue: 'Search workers...' })}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredTeam}
                    keyExtractor={(item, index) => item.user?._id || index.toString()}
                    renderItem={renderTeamMember}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{t('no_workers_found', { defaultValue: 'No team members found.' })}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    addButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    role: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    riskChip: {
        backgroundColor: '#fef2f2',
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    riskText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 10,
        borderRadius: 12,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    },
});

export default TeamListScreen;
