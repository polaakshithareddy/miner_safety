import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';

const { width } = Dimensions.get('window');

const DEMO_RISK_ZONES = [
  {
    id: 'TEMP-1',
    zoneId: 'LEVEL1-EAST',
    riskLevel: 'LOW',
    riskScore: 0.2,
    topReasons: ['No recent serious hazards', 'Stable conditions'],
  },
  {
    id: 'TEMP-2',
    zoneId: 'LEVEL1-WEST',
    riskLevel: 'MEDIUM',
    riskScore: 0.5,
    topReasons: ['Some medium hazards logged', 'Equipment traffic moderate'],
  },
  {
    id: 'TEMP-3',
    zoneId: 'LEVEL2-CROSSCUT',
    riskLevel: 'HIGH',
    riskScore: 0.8,
    topReasons: ['Cluster of physical hazards', 'High loading activity'],
  },
  {
    id: 'TEMP-4',
    zoneId: 'GAS-POCKET-AREA',
    riskLevel: 'CRITICAL',
    riskScore: 0.9,
    topReasons: ['Gas-related incidents', 'Requires immediate attention'],
  },
];

const getRiskLevelColor = (riskLevel) => {
  const level = (riskLevel || 'LOW').toUpperCase();
  switch (level) {
    case 'LOW':
      return '#10b981'; // green
    case 'MEDIUM':
      return '#f59e0b'; // amber
    case 'HIGH':
      return '#ef4444'; // red
    case 'CRITICAL':
      return '#dc2626'; // dark red
    default:
      return '#6b7280'; // gray
  }
};

const RiskHeatmapReport = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isAdmin = user?.role === 'admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [riskZones, setRiskZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const fetchRisk = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get('/mine/risk', { params: { horizonHours: 24 } });
        const zones = Array.isArray(data) ? data : data?.zones || [];

        if (!zones.length) {
          setRiskZones(DEMO_RISK_ZONES);
          return;
        }

        const normalised = zones.map((z, idx) => ({
          id: z.id ?? z.zoneId ?? idx,
          zoneId: z.zoneId ?? `Zone-${idx + 1}`,
          riskLevel: z.riskLevel ?? 'LOW',
          riskScore: typeof z.riskScore === 'number' ? z.riskScore : (z.risk ?? 0),
          topReasons: z.topReasons ?? [],
          ...z,
        }));

        setRiskZones(normalised);
      } catch (err) {
        console.error('Failed to load risk heatmap data:', err);
        setRiskZones(DEMO_RISK_ZONES);
      } finally {
        setLoading(false);
      }
    };

    fetchRisk();
  }, [isAdmin]);

  const distributionByLevel = useMemo(() => {
    const buckets = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    riskZones.forEach((z) => {
      const key = (z.riskLevel || 'LOW').toUpperCase();
      if (buckets.hasOwnProperty(key)) {
        buckets[key] += 1;
      }
    });
    return Object.entries(buckets).map(([level, count]) => ({ level, count }));
  }, [riskZones]);

  const topZones = useMemo(
    () => [...riskZones].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 10),
    [riskZones]
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Risk Heatmap</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>This report is only available to admin users.</Text>
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
        <Text style={styles.headerTitle}>AI Risk Heatmap</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerBanner}>
          <Text style={styles.bannerTitle}>AI Risk Heatmap</Text>
          <Text style={styles.bannerSubtitle}>
            Visual overview of AI-predicted risk across mine zones
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : riskZones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No AI risk data available for the selected period.</Text>
          </View>
        ) : (
          <>
            {/* Heatmap Grid */}
            <View style={styles.heatmapCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Risk Heatmap by Zone</Text>
                <Text style={styles.cardSubtitle}>Next 24 hours (model prediction)</Text>
              </View>

              <View style={styles.heatmapGrid}>
                {riskZones.map((zone) => {
                  const baseColor = getRiskLevelColor(zone.riskLevel);
                  const intensity = 0.35 + Math.min(1, Math.max(0, zone.riskScore || 0)) * 0.6;
                  const isSelected = selectedZone?.id === zone.id;

                  return (
                    <TouchableOpacity
                      key={zone.id}
                      onPress={() => setSelectedZone(zone)}
                      style={[
                        styles.zoneCell,
                        {
                          backgroundColor: baseColor,
                          opacity: intensity,
                          borderColor: isSelected ? '#3b82f6' : 'rgba(17,24,39,0.6)',
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.zoneText} numberOfLines={1}>
                        {zone.zoneId.length > 6 ? zone.zoneId.slice(-4) : zone.zoneId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                  <View key={level} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: getRiskLevelColor(level) },
                      ]}
                    />
                    <Text style={styles.legendText}>{level}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Selected Zone Details */}
            {selectedZone && (
              <View style={styles.detailsCard}>
                <Text style={styles.cardTitle}>Zone Details</Text>
                <View style={styles.detailsContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Zone ID</Text>
                    <Text style={styles.detailValue}>{selectedZone.zoneId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Risk Level</Text>
                    <View style={styles.riskLevelBadge}>
                      <View
                        style={[
                          styles.riskBadgeColor,
                          { backgroundColor: getRiskLevelColor(selectedZone.riskLevel) },
                        ]}
                      />
                      <Text style={styles.riskLevelText}>{selectedZone.riskLevel}</Text>
                      <Text style={styles.riskScoreText}>
                        Score: {Math.round((selectedZone.riskScore || 0) * 100)}%
                      </Text>
                    </View>
                  </View>
                  {selectedZone.topReasons && selectedZone.topReasons.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Top Contributing Factors</Text>
                      {selectedZone.topReasons.slice(0, 5).map((reason, idx) => (
                        <Text key={idx} style={styles.reasonText}>
                          • {reason}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Distribution Chart */}
            <View style={styles.distributionCard}>
              <Text style={styles.cardTitle}>Zones per Risk Level</Text>
              <View style={styles.barChart}>
                {distributionByLevel.map((item) => (
                  <View key={item.level} style={styles.barItem}>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${(item.count / riskZones.length) * 100}%`,
                            backgroundColor: getRiskLevelColor(item.level),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.level}</Text>
                    <Text style={styles.barValue}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Top Risk Zones */}
            <View style={styles.topZonesCard}>
              <Text style={styles.cardTitle}>Top Risk Zones</Text>
              {topZones.map((z) => (
                <TouchableOpacity
                  key={z.id}
                  onPress={() => setSelectedZone(z)}
                  style={[
                    styles.topZoneItem,
                    selectedZone?.id === z.id && styles.topZoneItemSelected,
                  ]}
                >
                  <View style={styles.topZoneContent}>
                    <Text style={styles.topZoneId}>{z.zoneId}</Text>
                    <Text style={styles.topZoneReason} numberOfLines={1}>
                      {(z.topReasons && z.topReasons[0]) || 'High predicted risk in this area.'}
                    </Text>
                  </View>
                  <View style={styles.topZoneBadge}>
                    <View
                      style={[
                        styles.topZoneBadgeColor,
                        { backgroundColor: getRiskLevelColor(z.riskLevel) },
                      ]}
                    />
                    <Text style={styles.topZoneLevel}>{z.riskLevel}</Text>
                    <Text style={styles.topZoneScore}>
                      {Math.round((z.riskScore || 0) * 100)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
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
    backgroundColor: '#2563eb',
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
    backgroundColor: '#2563eb',
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
    color: '#e0e7ff',
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
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  heatmapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  zoneCell: {
    width: (width - 64) / 4 - 6,
    height: (width - 64) / 4 - 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  zoneText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsContent: {
    marginTop: 12,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  riskLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadgeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  riskScoreText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  barChart: {
    marginTop: 16,
  },
  barItem: {
    marginBottom: 12,
  },
  barContainer: {
    height: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  topZonesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  topZoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  topZoneItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  topZoneContent: {
    flex: 1,
    marginRight: 12,
  },
  topZoneId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  topZoneReason: {
    fontSize: 11,
    color: '#64748b',
  },
  topZoneBadge: {
    alignItems: 'flex-end',
  },
  topZoneBadgeColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  topZoneLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  topZoneScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
});

export default RiskHeatmapReport;

