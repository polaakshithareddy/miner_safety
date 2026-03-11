import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import { LinearGradient } from 'expo-linear-gradient';

const GasDetectionDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gasLevels, setGasLevels] = useState({
    methane: { value: 0.5, safe: true, threshold: 1.0, unit: '%' },
    carbonMonoxide: { value: 25, safe: true, threshold: 50, unit: 'ppm' },
    hydrogen: { value: 2.0, safe: true, threshold: 4.0, unit: '%' },
    oxygen: { value: 21, safe: true, thresholdLow: 19.5, thresholdHigh: 23.5, unit: '%' },
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState({
    riskLevel: 'Low',
    nextHourPrediction: 'Stable conditions expected',
    recommendedActions: ['Continue normal operations', 'Maintain regular monitoring'],
  });

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setGasLevels((prevLevels) => {
        const newGasLevels = { ...prevLevels };

        // Methane simulation
        const methaneDelta = (Math.random() - 0.5) * 0.3;
        newGasLevels.methane.value = Math.max(0, newGasLevels.methane.value + methaneDelta);
        newGasLevels.methane.safe = newGasLevels.methane.value < newGasLevels.methane.threshold;

        // Carbon Monoxide simulation
        const coDelta = (Math.random() - 0.5) * 5;
        newGasLevels.carbonMonoxide.value = Math.max(0, newGasLevels.carbonMonoxide.value + coDelta);
        newGasLevels.carbonMonoxide.safe = newGasLevels.carbonMonoxide.value < newGasLevels.carbonMonoxide.threshold;

        // Hydrogen simulation
        const h2Delta = (Math.random() - 0.5) * 0.2;
        newGasLevels.hydrogen.value = Math.max(0, newGasLevels.hydrogen.value + h2Delta);
        newGasLevels.hydrogen.safe = newGasLevels.hydrogen.value < newGasLevels.hydrogen.threshold;

        // Oxygen simulation
        const o2Delta = (Math.random() - 0.5) * 0.3;
        const newO2Value = Math.max(15, Math.min(25, newGasLevels.oxygen.value + o2Delta));
        newGasLevels.oxygen.value = newO2Value;
        newGasLevels.oxygen.safe =
          newO2Value > newGasLevels.oxygen.thresholdLow &&
          newO2Value < newGasLevels.oxygen.thresholdHigh;

        // Check for unsafe conditions
        Object.entries(newGasLevels).forEach(([gasType, data]) => {
          if (!data.safe && Math.random() > 0.7) {
            const newAlert = {
              id: Date.now(),
              type: gasType,
              message: `${formatGasName(gasType)} levels are ${data.value.toFixed(2)}${data.unit} - exceeding safe limits!`,
              timestamp: new Date().toISOString(),
              severity: 'high',
            };
            setAlerts((prev) => [newAlert, ...prev].slice(0, 10));
          }
        });

        updatePredictions(newGasLevels);
        return newGasLevels;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const formatGasName = (gasType) => {
    switch (gasType) {
      case 'methane': return 'Methane (CH₄)';
      case 'carbonMonoxide': return 'Carbon Monoxide (CO)';
      case 'hydrogen': return 'Hydrogen (H₂)';
      case 'oxygen': return 'Oxygen (O₂)';
      default: return gasType;
    }
  };

  const updatePredictions = (gasLevels) => {
    const unsafeCount = Object.values(gasLevels).filter((gas) => !gas.safe).length;

    let riskLevel = 'Low';
    let nextHourPrediction = 'Stable conditions expected';
    let recommendedActions = ['Continue normal operations', 'Maintain regular monitoring'];

    if (unsafeCount === 1) {
      riskLevel = 'Medium';
      nextHourPrediction = 'Potential for worsening conditions in the next hour';
      recommendedActions = [
        'Increase ventilation in affected areas',
        'Monitor gas levels more frequently',
        'Prepare for possible evacuation if levels continue to rise',
      ];
    } else if (unsafeCount >= 2) {
      riskLevel = 'High';
      nextHourPrediction = 'High probability of dangerous conditions developing';
      recommendedActions = [
        'Begin evacuation procedures immediately',
        'Activate emergency response team',
        'Shut down non-essential operations',
      ];
    }

    setPredictions({
      riskLevel,
      nextHourPrediction,
      recommendedActions,
    });
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Emergency Alert',
      'This will send an emergency alert to all personnel. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            const newAlert = {
              id: Date.now(),
              type: 'emergency',
              message: `Emergency alert triggered by ${user?.name || 'User'}`,
              timestamp: new Date().toISOString(),
              severity: 'high',
            };
            setAlerts((prev) => [newAlert, ...prev].slice(0, 10));
            Alert.alert('Alert Sent', 'Emergency alert has been sent to all personnel');
          },
        },
      ]
    );
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderGasCard = (gasType, data) => {
    const gasName = formatGasName(gasType);
    const thresholdText =
      gasType === 'oxygen'
        ? `${data.thresholdLow} - ${data.thresholdHigh}${data.unit}`
        : `< ${data.threshold}${data.unit}`;

    return (
      <View
        key={gasType}
        style={[
          styles.gasCard,
          !data.safe && styles.gasCardUnsafe,
        ]}
      >
        <View style={styles.gasHeader}>
          <Text style={styles.gasName}>{gasName}</Text>
          {!data.safe && (
            <View style={styles.unsafeBadge}>
              <Text style={styles.unsafeBadgeText}>UNSAFE</Text>
            </View>
          )}
        </View>
        <View style={styles.gasValueContainer}>
          <Text style={[styles.gasValue, !data.safe && styles.gasValueUnsafe]}>
            {data.value.toFixed(2)}
          </Text>
          <Text style={styles.gasUnit}>{data.unit}</Text>
        </View>
        <Text style={styles.gasThreshold}>Safe: {thresholdText}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Gas Detection</Text>
            <Text style={styles.headerSubtitle}>Real-time monitoring</Text>
          </View>
        </View>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isSimulating ? styles.controlButtonStop : styles.controlButtonStart,
            ]}
            onPress={toggleSimulation}
          >
            <MaterialIcons
              name={isSimulating ? 'stop' : 'play-arrow'}
              size={20}
              color="#fff"
            />
            <Text style={styles.controlButtonText}>
              {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyAlert}
          >
            <MaterialIcons name="warning" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Risk Level Indicator */}
        <LinearGradient
          colors={[getRiskColor(predictions.riskLevel), getRiskColor(predictions.riskLevel) + '80']}
          style={styles.riskCard}
        >
          <Text style={styles.riskLabel}>Current Risk Level</Text>
          <Text style={styles.riskValue}>{predictions.riskLevel}</Text>
          <Text style={styles.riskPrediction}>{predictions.nextHourPrediction}</Text>
        </LinearGradient>

        {/* Gas Levels */}
        <View style={styles.gasLevelsContainer}>
          <Text style={styles.sectionTitle}>Gas Levels</Text>
          {Object.entries(gasLevels).map(([gasType, data]) => renderGasCard(gasType, data))}
        </View>

        {/* Recommended Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>
          {predictions.recommendedActions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <MaterialIcons name="check-circle" size={20} color="#3b82f6" />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsCard}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            {alerts.slice(0, 5).map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <MaterialIcons
                  name="warning"
                  size={20}
                  color={alert.severity === 'high' ? '#ef4444' : '#f59e0b'}
                />
                <View style={styles.alertContent}>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  controlButtonStart: {
    backgroundColor: '#10b981',
  },
  controlButtonStop: {
    backgroundColor: '#ef4444',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#dc2626',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  riskCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  riskValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  riskPrediction: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  gasLevelsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  gasCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  gasCardUnsafe: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  gasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gasName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  unsafeBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unsafeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  gasValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  gasValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  gasValueUnsafe: {
    color: '#ef4444',
  },
  gasUnit: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  gasThreshold: {
    fontSize: 12,
    color: '#666',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  alertsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default GasDetectionDashboard;

