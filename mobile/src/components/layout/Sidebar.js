import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../common/LanguageSelector';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const { t } = useTranslation();
  const [langModalVisible, setLangModalVisible] = React.useState(false);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  // Define navigation items based on user role
  const navItems = [
    {
      name: t('dashboard'),
      screen: user?.role === 'admin' ? 'AdminDashboard' : user?.role === 'supervisor' ? 'SupervisorDashboard' : 'WorkerDashboard',
      icon: 'dashboard',
      roles: ['employee', 'supervisor', 'admin', 'worker'],
    },
    {
      name: t('profile'),
      screen: 'ProfileScreen',
      icon: 'person',
      roles: ['employee', 'supervisor', 'admin', 'worker'],
    },
    {
      name: t('daily_checklist'),
      screen: 'DailyChecklist',
      icon: 'check-circle',
      roles: ['employee', 'supervisor', 'worker'],
    },
    {
      name: t('video_library'),
      screen: 'VideoLibrary',
      icon: 'video-library',
      roles: ['employee', 'worker'],
    },
    {
      name: t('report_hazard'),
      screen: 'HazardReport',
      icon: 'warning',
      roles: ['employee', 'supervisor', 'worker'],
    },
    {
      name: t('incident_library'),
      screen: 'IncidentList',
      icon: 'library-books',
      roles: ['employee', 'supervisor', 'admin', 'worker'],
    },
    {
      name: t('case_studies'),
      screen: 'CaseStudies',
      icon: 'menu-book',
      roles: ['employee', 'worker'],
    },
    {
      name: t('gas_detection'),
      screen: 'GasDetectionDashboard',
      icon: 'air',
      roles: ['employee', 'supervisor', 'worker'],
    },
    {
      name: t('user_management'),
      screen: 'UserManagement',
      icon: 'manage-accounts',
      roles: ['admin'],
    },
    {
      name: t('reports'),
      screen: 'Reports',
      icon: 'summarize',
      roles: ['admin'],
    },
    {
      name: t('sos_alerts'),
      screen: 'SOSAlertsManagement',
      icon: 'emergency',
      roles: ['admin'],
    },
    {
      name: t('risk_heatmap'),
      screen: 'RiskHeatmapReport',
      icon: 'map',
      roles: ['admin'],
    },
  ];

  // Filter navigation items based on user role
  const userRole = user?.role || 'worker';
  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(userRole)
  );

  const handleNavigation = (screenName) => {
    navigation.navigate(screenName);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const isActive = (screenName) => {
    return route.name === screenName;
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#1f2937', '#111827', '#0f172a']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  style={styles.logoBox}
                >
                  <MaterialIcons name="security" size={28} color="#fff" />
                </LinearGradient>
                <View style={styles.logoText}>
                  <Text style={styles.logoTitle}>MSC</Text>
                  <Text style={styles.logoSubtitle}>{t('mine_safety_companion').toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Navigation Items */}
            <ScrollView
              style={styles.navContainer}
              contentContainerStyle={styles.navContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredNavItems.map((item, index) => {
                const active = isActive(item.screen);
                return (
                  <TouchableOpacity
                    key={item.screen}
                    style={[styles.navItem, active && styles.navItemActive]}
                    onPress={() => handleNavigation(item.screen)}
                    activeOpacity={0.7}
                  >
                    {active && (
                      <LinearGradient
                        colors={['#3b82f6', '#8b5cf6']}
                        style={styles.navItemGradient}
                      />
                    )}
                    <MaterialIcons
                      name={item.icon}
                      size={24}
                      color={active ? '#fff' : '#9ca3af'}
                      style={styles.navIcon}
                    />
                    <Text
                      style={[
                        styles.navText,
                        active && styles.navTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {active && (
                      <View style={styles.activeIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.footer}>
              <View style={styles.footerCard}>
                <View style={styles.footerHeader}>
                  <Text style={styles.footerTitle}>{t('msc_platform')}</Text>
                  <View style={styles.statusDots}>
                    <View style={[styles.statusDot, styles.dotGreen]} />
                    <View style={[styles.statusDot, styles.dotBlue]} />
                    <View style={[styles.statusDot, styles.dotPurple]} />
                  </View>
                </View>
                <Text style={styles.footerSubtitle}>{t('mine_safety_companion')}</Text>
                <View style={styles.footerFooter}>
                  <Text style={styles.versionText}>{t('version')} 1.0.0</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{t('active')}</Text>
                  </View>
                </View>
              </View>

              {/* Language Button */}
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setLangModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="language" size={20} color="#fff" />
                <Text style={styles.languageText}>{t('change_language')}</Text>
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <MaterialIcons name="logout" size={20} color="#fff" />
                <Text style={styles.logoutText}>{t('logout')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient >
        </Animated.View >
      </View >
      <LanguageSelector visible={langModalVisible} onClose={() => setLangModalVisible(false)} />
    </Modal >
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    gap: -2,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: -2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  navContainer: {
    flex: 1,
  },
  navContent: {
    padding: 12,
    paddingTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: 'transparent',
  },
  navItemGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    bottom: 0,
  },
  navIcon: {
    marginRight: 12,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    flex: 1,
  },
  navTextActive: {
    color: '#fff',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  footerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  statusDots: {
    flexDirection: 'row',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotBlue: {
    backgroundColor: '#3b82f6',
  },
  dotPurple: {
    backgroundColor: '#8b5cf6',
  },
  footerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  footerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default Sidebar;
