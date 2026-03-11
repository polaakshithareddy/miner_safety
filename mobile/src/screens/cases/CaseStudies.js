import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const getCaseIcon = (title, tags) => {
  const text = (title + ' ' + (tags?.join(' ') || '')).toLowerCase();
  if (text.includes('fire') || text.includes('burn')) return 'fire';
  if (text.includes('vehicle') || text.includes('truck') || text.includes('dumper')) return 'truck';
  if (text.includes('fall') || text.includes('height')) return 'human-male-height'; // MaterialCommunity
  if (text.includes('electric') || text.includes('shock')) return 'flash';
  if (text.includes('collapse') || text.includes('roof')) return 'landslide'; // Material
  if (text.includes('gas') || text.includes('fume')) return 'gas-cylinder';
  return 'clipboard-text';
};

const CaseStudies = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const role = user?.role || 'worker';
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    search: '',
  });

  const severityConfig = useMemo(() => ({
    fatal: {
      colors: ['#dc2626', '#b91c1c'],
      icon: 'skull-crossbones',
      label: t('severity_fatal', { defaultValue: 'FATAL INCIDENT' }),
      shadow: '#dc2626'
    },
    catastrophic: {
      colors: ['#7c3aed', '#6d28d9'],
      icon: 'alert-decagram',
      label: t('severity_catastrophic', { defaultValue: 'CATASTROPHIC' }),
      shadow: '#7c3aed'
    },
    major: {
      colors: ['#f59e0b', '#d97706'],
      icon: 'alert-octagon',
      label: t('severity_major', { defaultValue: 'MAJOR INCIDENT' }),
      shadow: '#f59e0b'
    },
    minor: {
      colors: ['#10b981', '#059669'],
      icon: 'alert-circle-check',
      label: t('severity_minor_issue', { defaultValue: 'MINOR ISSUE' }),
      shadow: '#10b981'
    },
    near_miss: {
      colors: ['#3b82f6', '#2563eb'],
      icon: 'alert',
      label: t('severity_near_miss_caps', { defaultValue: 'NEAR MISS' }),
      shadow: '#3b82f6'
    },
  }), [t]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = { role };
      if (filters.severity !== 'all') params.severity = filters.severity;
      if (filters.search) params.search = filters.search;

      const response = await api.get('/cases', { params });

      // If empty for demo, inject mocks if needed, or strictly use API
      // Using API response primarily
      setCases(response.data?.data || []);

    } catch (error) {
      console.error('Failed to fetch case studies', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [role, filters.severity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const filteredCases = useMemo(() => {
    let result = cases;
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(lower) ||
        item.quickSummary?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [cases, filters.search]);

  const renderCaseCard = (item, index) => {
    const config = severityConfig[item.severity] || severityConfig.near_miss;
    const iconName = getCaseIcon(item.title, item.tags);
    // Determine icon set
    const IsCommunity = ['truck', 'human-male-height', 'skull-crossbones', 'alert-decagram', 'alert-octagon', 'alert-circle-check', 'alert', 'fire', 'flash', 'gas-cylinder', 'clipboard-text'].includes(iconName) || config.icon.includes('-');
    const IconComp = IsCommunity ? MaterialCommunityIcons : MaterialIcons;
    const CategoryIconComp = ['truck', 'fire', 'flash'].includes(iconName) ? MaterialCommunityIcons : MaterialIcons;

    return (
      <TouchableOpacity
        key={item.id || item._id}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CaseStudyDetail', { id: item.id || item._id })}
        style={[styles.cardContainer, { shadowColor: config.shadow }]}
      >
        <LinearGradient
          colors={config.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Header Badge */}
          <View style={styles.cardHeader}>
            <View style={styles.severityBadge}>
              <IconComp name={config.icon} size={14} color={config.colors[0]} />
              <Text style={[styles.severityText, { color: config.colors[0] }]}>{config.label}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>

          {/* Main Content */}
          <View style={styles.cardBody}>
            <View style={styles.iconCircle}>
              <CategoryIconComp name={iconName} size={40} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>
                {item.quickSummary || t('case_summary_fallback', { defaultValue: 'Analyze this incident to prevent future occurrences.' })}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.tagsRow}>
              {item.tags?.slice(0, 2).map((tag, i) => (
                <Text key={i} style={styles.footerTag}>#{tag}</Text>
              ))}
            </View>
            <View style={styles.readMoreBtn}>
              <Text style={styles.readMoreText}>{t('learn', { defaultValue: 'LEARN' })}</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={28} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t('case_studies', { defaultValue: 'Case Studies' })}</Text>
            <Text style={styles.headerSubtitle}>{t('lessons_from_field', { defaultValue: 'Lessons from the field' })}</Text>
          </View>
        </View>
        <View style={styles.searchBubble}>
          <MaterialIcons name="search" size={24} color="#64748b" />
          <TextInput
            placeholder={t('search_placeholder', { defaultValue: 'Search...' })}
            style={styles.searchInput}
            value={filters.search}
            onChangeText={(t) => setFilters({ ...filters, search: t })}
          />
        </View>
      </View>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        {/* Severity Filter Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            style={[styles.filterPill, filters.severity === 'all' && styles.filterPillActive]}
            onPress={() => setFilters({ ...filters, severity: 'all' })}
          >
            <Text style={[styles.filterText, filters.severity === 'all' && styles.filterTextActive]}>{t('all_cases', { defaultValue: 'All Cases' })}</Text>
          </TouchableOpacity>
          {Object.keys(severityConfig).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.filterPill, filters.severity === k && styles.filterPillActive, filters.severity === k && { backgroundColor: severityConfig[k].colors[0] }]}
              onPress={() => setFilters({ ...filters, severity: k })}
            >
              <Text style={[styles.filterText, filters.severity === k && styles.filterTextActive]}>
                {severityConfig[k].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : filteredCases.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bookshelf" size={80} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('no_libraries_found', { defaultValue: 'No libraries found' })}</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filteredCases.map((item, index) => renderCaseCard(item, index))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  searchBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    width: 140,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filterScroll: {
    paddingVertical: 16,
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#3b82f6',
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },

  // Card Styles
  cardsList: {
    paddingHorizontal: 20,
    gap: 20,
  },
  cardContainer: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 4,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 26,
  },
  cardSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footerTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readMoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  }
});

export default CaseStudies;
