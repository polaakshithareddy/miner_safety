import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import { useSOS } from '../../context/SOSContext';

const HAZARD_ICONS = {
  underground_fire: '🔥',
  gas_leakage: '💨',
  water_leak: '💧',
  rock_fall: '⛰️',
  blasting_error: '💣',
};

const HAZARD_COLORS = {
  underground_fire: '#dc2626',
  gas_leakage: '#ea580c',
  water_leak: '#2563eb',
  rock_fall: '#475569',
  blasting_error: '#eab308',
};

const STATUS_COLORS = {
  active: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  acknowledged: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  resolved: { bg: '#d1fae5', text: '#059669', border: '#6ee7b7' },
};

const SOSAlertsManagement = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const { stopSOSSound } = useSOS();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return;
    }
    fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sos/alerts');
      if (response.data.success) {
        setAlerts(
          response.data.data.map((alert) => ({
            id: alert._id,
            hazardType: alert.hazardType,
            hazardLabel: alert.hazardType
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            employeeId: alert.triggeredBy?._id || alert.triggeredBy,
            employeeName: alert.triggeredBy?.name || 'Unknown',
            location: alert.location,
            timestamp: alert.createdAt,
            status: alert.status,
            acknowledgedBy: alert.acknowledgedBy?.name,
            acknowledgedAt: alert.acknowledgedAt,
            resolvedAt: alert.resolvedAt,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
      Alert.alert('Error', 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    if (processingId === alertId) return;

    // Stop the SOS sound when acknowledging
    stopSOSSound();

    setProcessingId(alertId);
    try {
      const response = await api.patch(`/sos/alerts/${alertId}/acknowledge`);
      if (response.data.success) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? {
                ...alert,
                status: 'acknowledged',
                acknowledgedBy: user.name,
                acknowledgedAt: new Date().toISOString(),
              }
              : alert
          )
        );
        Alert.alert('Success', 'SOS alert acknowledged successfully');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to acknowledge alert');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolve = async (alertId) => {
    if (processingId === alertId) return;

    setProcessingId(alertId);
    try {
      const response = await api.patch(`/sos/alerts/${alertId}/resolve`);
      if (response.data.success) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? {
                ...alert,
                status: 'resolved',
                resolvedAt: new Date().toISOString(),
              }
              : alert
          )
        );
        Alert.alert('Success', 'SOS alert resolved successfully');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to resolve alert');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (alertId) => {
    if (processingId === alertId) return;

    // Confirm deletion
    Alert.alert(
      'Delete SOS Alert',
      'Are you sure you want to delete this resolved SOS alert? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(alertId);
            try {
              const response = await api.delete(`/sos/alerts/${alertId}`);
              if (response.data.success) {
                // Remove alert from list
                setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
                Alert.alert('Success', 'SOS alert deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting alert:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete alert. Only resolved alerts can be deleted.'
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredAlerts =
    filterStatus === 'all'
      ? alerts
      : alerts.filter((alert) => alert.status === filterStatus);

  const statusCounts = {
    all: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SOS Alerts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>
            You don't have permission to view this page. Admin access required.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚨 SOS Emergency Alerts</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTitle}>🚨 SOS Emergency Alerts</Text>
          <Text style={styles.bannerSubtitle}>
            Manage and respond to emergency SOS alerts from employees
          </Text>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'acknowledged', label: 'Acknowledged' },
            { key: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filterStatus === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setFilterStatus(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.filterTabBadge,
                  filterStatus === tab.key && styles.filterTabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabBadgeText,
                    filterStatus === tab.key && styles.filterTabBadgeTextActive,
                  ]}
                >
                  {statusCounts[tab.key]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alerts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚨</Text>
            <Text style={styles.emptyText}>
              No {filterStatus !== 'all' ? filterStatus : ''} alerts found
            </Text>
            <Text style={styles.emptySubtext}>
              {filterStatus === 'all'
                ? 'No SOS alerts have been triggered yet.'
                : `No ${filterStatus} alerts at the moment.`}
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {filteredAlerts.map((alert) => {
              const statusStyle = STATUS_COLORS[alert.status] || STATUS_COLORS.active;
              const hazardColor = HAZARD_COLORS[alert.hazardType] || '#dc2626';

              return (
                <View
                  key={alert.id}
                  style={[styles.alertCard, { borderLeftColor: hazardColor }]}
                >
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertIcon}>
                      {HAZARD_ICONS[alert.hazardType] || '🚨'}
                    </Text>
                    <View style={styles.alertTitleContainer}>
                      <Text style={styles.alertTitle}>{alert.hazardLabel}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusStyle.bg,
                            borderColor: statusStyle.border,
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {alert.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.alertDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Employee:</Text>
                      <Text style={styles.detailValue}>{alert.employeeName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>
                        {alert.location?.description || 'Not specified'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Triggered:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    {alert.acknowledgedBy && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Acknowledged by:</Text>
                        <Text style={styles.detailValue}>
                          {alert.acknowledgedBy} at{' '}
                          {new Date(alert.acknowledgedAt).toLocaleString()}
                        </Text>
                      </View>
                    )}
                    {alert.resolvedAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Resolved:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(alert.resolvedAt).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.alertActions}>
                    {alert.status === 'active' && (
                      <>
                        <TouchableOpacity
                          style={styles.acknowledgeButton}
                          onPress={() => handleAcknowledge(alert.id)}
                          disabled={processingId === alert.id}
                        >
                          {processingId === alert.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <MaterialIcons name="check-circle" size={20} color="#fff" />
                              <Text style={styles.actionButtonText}>Acknowledge</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.resolveButton}
                          onPress={() => handleResolve(alert.id)}
                          disabled={processingId === alert.id}
                        >
                          {processingId === alert.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <MaterialIcons name="done" size={20} color="#fff" />
                              <Text style={styles.actionButtonText}>Resolve</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <TouchableOpacity
                        style={styles.resolveButton}
                        onPress={() => handleResolve(alert.id)}
                        disabled={processingId === alert.id}
                      >
                        {processingId === alert.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <MaterialIcons name="done" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Resolve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                    {alert.status === 'resolved' && (
                      <>
                        <View style={styles.resolvedBadge}>
                          <MaterialIcons name="check-circle" size={20} color="#059669" />
                          <Text style={styles.resolvedText}>✓ Resolved</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(alert.id)}
                          disabled={processingId === alert.id}
                        >
                          {processingId === alert.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <MaterialIcons name="delete" size={20} color="#fff" />
                              <Text style={styles.actionButtonText}>Delete</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    padding: 16,
    backgroundColor: '#dc2626',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerBanner: {
    backgroundColor: '#dc2626',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fee2e2',
  },
  filterTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterTabBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabBadgeTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  alertsList: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertDetails: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  resolvedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resolvedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
});

export default SOSAlertsManagement;

