import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Sidebar from '../../components/layout/Sidebar';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const Reports = () => {
  const navigation = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    incidents: { total: 0, resolved: 0, pending: 0 },
    hazards: { total: 0, critical: 0, resolved: 0 },
    users: { total: 0, active: 0, inactive: 0 },
    checklists: { total: 0, completed: 0, pending: 0 },
    compliance: { average: 0, topPerformers: [] },
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const [incidentsRes, usersRes, checklistsRes, complianceRes] = await Promise.all([
        api.get('/incidents').catch(() => ({ data: { data: [] } })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/checklist/incomplete').catch(() => ({ data: { data: [] } })),
        api.get('/behavior/supervisor/overview').catch(() => ({ data: { data: {} } })),
      ]);

      const incidents = incidentsRes.data.data || [];
      const incidentStats = {
        total: incidents.length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        pending: incidents.filter(i => i.status === 'pending').length,
      };

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const userStats = {
        total: users.length,
        active: users.filter(u => u.role !== 'admin').length,
        inactive: users.filter(u => !u.lastLogin).length,
      };

      const incompleteLists = checklistsRes.data.data || [];
      const checklistStats = {
        total: userStats.total,
        completed: userStats.total - incompleteLists.length,
        pending: incompleteLists.length,
      };

      const complianceData = complianceRes.data.data || {};
      const complianceStats = {
        average: complianceData.summary?.averageScore || 0,
        topPerformers: (complianceData.topCompliantWorkers || []).slice(0, 5),
      };

      setReportData({
        incidents: incidentStats,
        hazards: { total: incidents.length, critical: 0, resolved: incidentStats.resolved },
        users: userStats,
        checklists: checklistStats,
        compliance: complianceStats,
      });
    } catch (error) {
      console.error('Failed to load report data', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple Visual Bar Chart Component
  const VisualBarChart = ({ data, colors }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
      <View style={styles.visualBarChart}>
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barContainer}>
                <LinearGradient
                  colors={colors[index]}
                  style={[styles.bar, { height: `${percentage}%` }]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                >
                  <Text style={styles.barValue}>{item.value}</Text>
                </LinearGradient>
              </View>
              <MaterialIcons name={item.icon} size={24} color={colors[index][0]} style={styles.barIcon} />
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Simple Pie Chart Component
  const SimplePieChart = ({ data, colors }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <View key={index} style={styles.pieSegment}>
                <LinearGradient
                  colors={colors[index]}
                  style={[styles.pieBar, { width: `${percentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.pieLegend}>
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <View key={index} style={styles.legendItem}>
                <LinearGradient
                  colors={colors[index]}
                  style={styles.legendColor}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Comparison Bars Component
  const ComparisonBars = ({ items }) => {
    return (
      <View style={styles.comparisonContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.comparisonItem}>
            <View style={styles.comparisonHeader}>
              <MaterialIcons name={item.icon} size={20} color={item.color[0]} />
              <Text style={styles.comparisonLabel}>{item.label}</Text>
              <Text style={styles.comparisonValue}>{item.value}/{item.total}</Text>
            </View>
            <View style={styles.comparisonBarBg}>
              <LinearGradient
                colors={item.color}
                style={[styles.comparisonBarFill, {
                  width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%'
                }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.comparisonPercent}>
              {item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <>
            {/* Overview Stats */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <VisualBarChart
              data={[
                { label: 'Users', value: reportData.users.total, icon: 'people' },
                { label: 'Incidents', value: reportData.incidents.total, icon: 'warning' },
                { label: 'Completed', value: reportData.checklists.completed, icon: 'check-circle' },
                { label: 'Pending', value: reportData.checklists.pending, icon: 'pending' },
              ]}
              colors={[
                ['#4facfe', '#00f2fe'],
                ['#fa709a', '#fee140'],
                ['#30cfd0', '#330867'],
                ['#ffa751', '#ffe259'],
              ]}
            />

            {/* Incident Status Distribution */}
            <Text style={styles.sectionTitle}>Incident Status</Text>
            <SimplePieChart
              data={[
                { label: 'Resolved', value: reportData.incidents.resolved },
                { label: 'Pending', value: reportData.incidents.pending },
                { label: 'In Progress', value: reportData.incidents.total - reportData.incidents.resolved - reportData.incidents.pending },
              ]}
              colors={[
                ['#10b981', '#059669'],
                ['#ef4444', '#dc2626'],
                ['#f59e0b', '#d97706'],
              ]}
            />

            {/* Progress Comparison */}
            <Text style={styles.sectionTitle}>Progress Tracking</Text>
            <ComparisonBars
              items={[
                {
                  label: 'Incidents Resolved',
                  value: reportData.incidents.resolved,
                  total: reportData.incidents.total,
                  icon: 'check-circle',
                  color: ['#10b981', '#059669'],
                },
                {
                  label: 'Tasks Completed',
                  value: reportData.checklists.completed,
                  total: reportData.checklists.total,
                  icon: 'assignment-turned-in',
                  color: ['#3b82f6', '#2563eb'],
                },
                {
                  label: 'Active Users',
                  value: reportData.users.active,
                  total: reportData.users.total,
                  icon: 'people',
                  color: ['#8b5cf6', '#7c3aed'],
                },
              ]}
            />

            {/* Top Performers */}
            {reportData.compliance.topPerformers.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Top Performers</Text>
                <View style={styles.performersCard}>
                  {reportData.compliance.topPerformers.map((performer, index) => {
                    const gradients = [
                      ['#ffd89b', '#19547b'],
                      ['#c0c0c0', '#808080'],
                      ['#cd7f32', '#8b4513'],
                      ['#667eea', '#764ba2'],
                      ['#f093fb', '#f5576c'],
                    ];
                    const maxScore = 100;
                    const scorePercentage = (performer.complianceScore / maxScore) * 100;

                    return (
                      <View key={performer._id || index} style={styles.performerItem}>
                        <LinearGradient
                          colors={gradients[index] || ['#f8f9fa', '#e9ecef']}
                          style={styles.performerGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.performerRank}>
                            <Text style={styles.performerRankText}>#{index + 1}</Text>
                          </View>
                          <View style={styles.performerInfo}>
                            <Text style={styles.performerName}>{performer.user?.name || 'Unknown'}</Text>
                            <View style={styles.performerScoreBar}>
                              <View style={[styles.performerScoreFill, { width: `${scorePercentage}%` }]} />
                            </View>
                          </View>
                          <View style={styles.performerScore}>
                            <Text style={styles.performerScoreValue}>{performer.complianceScore || 0}</Text>
                            <MaterialIcons name="star" size={16} color="#fff" />
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 16,
  },
  // Visual Bar Chart Styles
  visualBarChart: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    height: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
    minHeight: 40,
  },
  barValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  barIcon: {
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  // Pie Chart Styles
  pieChartContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pieChart: {
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 20,
  },
  pieSegment: {
    flex: 1,
  },
  pieBar: {
    height: '100%',
  },
  pieLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  legendValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // Comparison Bars Styles
  comparisonContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  comparisonItem: {
    gap: 8,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comparisonLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  comparisonBarBg: {
    height: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  comparisonBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  comparisonPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'right',
  },
  // Performers Styles
  performersCard: {
    gap: 12,
    marginBottom: 24,
  },
  performerItem: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  performerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  performerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  performerRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  performerScoreBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  performerScoreFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  performerScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  performerScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Reports;
