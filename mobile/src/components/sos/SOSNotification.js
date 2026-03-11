import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SOSNotification = ({ alert, onDismiss, onViewDetails }) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!alert) return;
    
    console.log('📢 Rendering SOS Notification:', alert);
    
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [alert]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getHazardIcon = (hazardType) => {
    const icons = {
      underground_fire: 'local-fire-department',
      gas_leakage: 'air',
      water_leak: 'water-drop',
      rock_fall: 'terrain',
      blasting_error: 'warning', // Changed from 'explosive' which is not a valid MaterialIcons name
    };
    return icons[hazardType] || 'warning';
  };

  const getHazardColor = (hazardType) => {
    const colors = {
      underground_fire: '#ef4444',
      gas_leakage: '#f97316',
      water_leak: '#3b82f6',
      rock_fall: '#6b7280',
      blasting_error: '#eab308',
    };
    return colors[hazardType] || '#ef4444';
  };

  if (!alert) return null;

  const hazardColor = getHazardColor(alert.hazardType);
  const hazardIcon = getHazardIcon(alert.hazardType);

  return (
    <Modal
      visible={!!alert}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.notification,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.notificationContent, { borderLeftColor: hazardColor }]}>
            <View style={styles.notificationHeader}>
              <View style={[styles.iconContainer, { backgroundColor: hazardColor + '20' }]}>
                <MaterialIcons name={hazardIcon} size={24} color={hazardColor} />
              </View>
              <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>🚨 SOS Emergency Alert</Text>
                <Text style={styles.notificationSubtitle}>
                  {alert.employeeName || 'Employee'} - {alert.hazardLabel || alert.hazardType}
                </Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {onViewDetails && (
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: hazardColor }]}
                onPress={() => {
                  onViewDetails();
                  handleDismiss();
                }}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 10,
    pointerEvents: 'box-none', // Allow touches to pass through
  },
  notification: {
    width: '100%',
    pointerEvents: 'auto', // But capture touches on the notification itself
  },
  notificationContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  viewButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SOSNotification;

