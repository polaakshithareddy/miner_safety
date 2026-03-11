import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const HAZARD_TYPES = [
  { value: 'underground_fire', label: 'Underground Fire', icon: 'local-fire-department', color: '#ef4444' },
  { value: 'gas_leakage', label: 'Gas Leakage', icon: 'air', color: '#f97316' },
  { value: 'water_leak', label: 'Water Leak', icon: 'water-drop', color: '#3b82f6' },
  { value: 'rock_fall', label: 'Rock Fall', icon: 'terrain', color: '#6b7280' },
  { value: 'blasting_error', label: 'Blasting Error', icon: 'explosive', color: '#eab308' },
];

const SOSButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for SOS button
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const getCurrentLocation = async () => {
    // Return default location - can be enhanced with GPS later
    return {
      type: 'Point',
      coordinates: [0, 0],
      description: 'Location not available',
    };
  };

  const handleSOSTrigger = async (hazardType) => {
    if (!user || !['employee', 'supervisor'].includes(user.role)) {
      Alert.alert('Error', 'Only employees and supervisors can trigger SOS alerts');
      return;
    }

    const hazard = HAZARD_TYPES.find(h => h.value === hazardType);
    
    Alert.alert(
      '⚠️ EMERGENCY SOS ALERT',
      `You are about to trigger an emergency alert for:\n\n${hazard.label}\n\nThis will immediately notify all admins and supervisors.\n\nAre you sure this is an emergency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: async () => {
            setIsTriggering(true);
            const currentLocation = await getCurrentLocation();

            try {
              const response = await api.post('/sos/trigger', {
                hazardType,
                location: currentLocation,
              });

              if (response.data.success) {
                Alert.alert('Success', '🚨 SOS Alert Triggered! Admins and supervisors have been notified.');
                setIsOpen(false);
                console.log('SOS Alert triggered:', response.data.data);
              }
            } catch (error) {
              console.error('Error triggering SOS:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to trigger SOS alert. Please try again.'
              );
            } finally {
              setIsTriggering(false);
            }
          },
        },
      ]
    );
  };

  // Only show for employees and supervisors
  if (!user || !['employee', 'supervisor'].includes(user.role)) {
    return null;
  }

  return (
    <>
      {/* Floating SOS Button */}
      <Animated.View
        style={[
          styles.sosButton,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          style={styles.sosButtonInner}
          activeOpacity={0.8}
        >
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* SOS Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 Emergency SOS Alert</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select the type of emergency you are reporting:
            </Text>

            <View style={styles.hazardList}>
              {HAZARD_TYPES.map((hazard) => (
                <TouchableOpacity
                  key={hazard.value}
                  style={[styles.hazardButton, { borderLeftColor: hazard.color }]}
                  onPress={() => handleSOSTrigger(hazard.value)}
                  disabled={isTriggering}
                >
                  <View style={styles.hazardButtonContent}>
                    <MaterialIcons name={hazard.icon} size={24} color={hazard.color} />
                    <Text style={styles.hazardButtonText}>{hazard.label}</Text>
                    {isTriggering && (
                      <ActivityIndicator size="small" color={hazard.color} style={styles.loader} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalFooter}>
              Only use in case of genuine emergency
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  sosButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  hazardList: {
    gap: 12,
  },
  hazardButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 15,
  },
  hazardButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hazardButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loader: {
    marginLeft: 'auto',
  },
  modalFooter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SOSButton;

