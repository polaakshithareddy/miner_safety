import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';

const { width } = Dimensions.get('window');

const INCIDENT_TYPES = {
    injury: { emoji: '🩹', label: 'Injury', gradient: ['#ff6b6b', '#ee5a6f'] },
    near_miss: { emoji: '⚠️', label: 'Near Miss', gradient: ['#ffa751', '#ffe259'] },
    property_damage: { emoji: '🔨', label: 'Property', gradient: ['#667eea', '#764ba2'] },
    environmental: { emoji: '🌿', label: 'Environmental', gradient: ['#30cfd0', '#330867'] },
    other: { emoji: '📝', label: 'Other', gradient: ['#a8edea', '#fed6e3'] },
};

const STATUS_CONFIG = {
    open: { emoji: '🔴', label: 'Open', color: '#ef4444' },
    pending: { emoji: '🟡', label: 'Pending', color: '#f59e0b' },
    investigating: { emoji: '🔵', label: 'Investigating', color: '#3b82f6' },
    in_review: { emoji: '🟣', label: 'In Review', color: '#8b5cf6' },
    resolved: { emoji: '✅', label: 'Resolved', color: '#10b981' },
    closed: { emoji: '⚫', label: 'Closed', color: '#64748b' },
};

const SEVERITY_CONFIG = {
    low: { emoji: '🟢', gradient: ['#10b981', '#059669'] },
    medium: { emoji: '🟡', gradient: ['#f59e0b', '#d97706'] },
    high: { emoji: '🟠', gradient: ['#f97316', '#ea580c'] },
    critical: { emoji: '🔴', gradient: ['#ef4444', '#dc2626'] },
};

const IncidentList = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const fetchIncidents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/incidents');
            setIncidents(response.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch incidents', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchIncidents();
    }, []);

    const getFilteredIncidents = () => {
        let filtered = incidents;
        if (selectedType !== 'all') {
            filtered = filtered.filter(i => i.type === selectedType);
        }
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(i => i.status === selectedStatus);
        }
        return filtered;
    };

    const renderIncidentCard = ({ item }) => {
        const typeConfig = INCIDENT_TYPES[item.type] || INCIDENT_TYPES.other;
        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
        const severityConfig = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.low;

        return (
            <TouchableOpacity
                style={styles.incidentCard}
                onPress={() => navigation.navigate('IncidentDetail', { id: item._id })}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={typeConfig.gradient}
                    style={styles.incidentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Header */}
                    <View style={styles.incidentHeader}>
                        <View style={styles.typeContainer}>
                            <Text style={styles.typeEmoji}>{typeConfig.emoji}</Text>
                            <Text style={styles.typeLabel}>{typeConfig.label}</Text>
                        </View>
                        <View style={styles.severityBadge}>
                            <Text style={styles.severityEmoji}>{severityConfig.emoji}</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.incidentTitle} numberOfLines={2}>{item.title}</Text>

                    {/* Details */}
                    <View style={styles.incidentDetails}>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.detailText}>{item.location}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="person" size={16} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.detailText}>{item.reportedBy?.name || 'Unknown'}</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.incidentFooter}>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusEmoji}>{statusConfig.emoji}</Text>
                            <Text style={styles.statusText}>{statusConfig.label}</Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const filteredIncidents = getFilteredIncidents();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
                    <MaterialIcons name="menu" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerEmoji}>📋</Text>
                    <Text style={styles.headerTitle}>Incidents</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
                    <MaterialIcons name="close" size={28} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {/* Type Filter */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>🏷️ Type</Text>
                    <View style={styles.filterChips}>
                        <TouchableOpacity
                            style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
                            onPress={() => setSelectedType('all')}
                        >
                            <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        {Object.entries(INCIDENT_TYPES).map(([key, config]) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.filterChip, selectedType === key && styles.filterChipActive]}
                                onPress={() => setSelectedType(key)}
                            >
                                <Text style={styles.filterChipEmoji}>{config.emoji}</Text>
                                <Text style={[styles.filterChipText, selectedType === key && styles.filterChipTextActive]}>
                                    {config.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Status Filter */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>📊 Status</Text>
                    <View style={styles.filterChips}>
                        <TouchableOpacity
                            style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
                            onPress={() => setSelectedStatus('all')}
                        >
                            <Text style={[styles.filterChipText, selectedStatus === 'all' && styles.filterChipTextActive]}>
                                All
                            </Text>
                        </TouchableOpacity>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.filterChip, selectedStatus === key && styles.filterChipActive]}
                                onPress={() => setSelectedStatus(key)}
                            >
                                <Text style={styles.filterChipEmoji}>{config.emoji}</Text>
                                <Text style={[styles.filterChipText, selectedStatus === key && styles.filterChipTextActive]}>
                                    {config.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingEmoji}>⏳</Text>
                    <Text style={styles.loadingText}>Loading incidents...</Text>
                </View>
            ) : filteredIncidents.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📋</Text>
                    <Text style={styles.emptyText}>No incidents found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredIncidents}
                    renderItem={renderIncidentCard}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    menuButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    headerEmoji: {
        fontSize: 32,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    filtersContainer: {
        backgroundColor: '#fff',
        padding: 16,
        gap: 16,
    },
    filterSection: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    filterChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        gap: 4,
    },
    filterChipActive: {
        backgroundColor: '#667eea',
    },
    filterChipEmoji: {
        fontSize: 14,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    incidentCard: {
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    incidentGradient: {
        padding: 20,
    },
    incidentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeEmoji: {
        fontSize: 24,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    severityBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    severityEmoji: {
        fontSize: 20,
    },
    incidentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        lineHeight: 24,
    },
    incidentDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
    incidentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusEmoji: {
        fontSize: 14,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    dateText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#64748b',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
    },
});

export default IncidentList;
