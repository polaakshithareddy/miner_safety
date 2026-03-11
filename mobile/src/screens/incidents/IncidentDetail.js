import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const IncidentDetail = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { id } = route.params || {};

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/incidents/${id}`);
      const data = response.data?.data;
      setIncident(data);
      if (data) {
        setStatus(data.status);
        setResolution(data.resolution || '');
      }
    } catch (error) {
      console.error('Failed to load incident', error);
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('load_incident_error', { defaultValue: 'Failed to load incident details' }));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSave = async () => {
    try {
      setSaving(true);
      await api.put(`/incidents/${id}/status`, {
        status,
        resolution
      });
      Alert.alert(t('success_title', { defaultValue: 'Success' }), t('status_update_success', { defaultValue: 'Incident status updated successfully' }));
      fetchIncident();
    } catch (error) {
      console.error('Update status error', error);
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('status_update_error', { defaultValue: 'Failed to update incident status' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#ef4444" />
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>{t('incident_not_found', { defaultValue: 'Incident not found' })}</Text>
      </SafeAreaView>
    );
  }

  const getStatusColor = (s) => {
    switch (s) {
      case 'resolved': return '#16a34a'; // green
      case 'in_review': return '#d97706'; // amber
      default: return '#ef4444'; // red
    }
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case 'resolved': return t('status_resolved', { defaultValue: 'Resolved' });
      case 'in_review': return t('status_in_review', { defaultValue: 'Under Investigation' });
      default: return t('status_pending', { defaultValue: 'Pending' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('incident_details', { defaultValue: 'Incident Details' })}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: incident.severity === 'critical' ? '#fecaca' : '#fee2e2' }]}>
              <Text style={[styles.badgeText, { color: '#dc2626' }]}>
                {t(`severity_${incident.severity}`, { defaultValue: incident.severity?.toUpperCase() })}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(incident.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(incident.status) }]}>
                {getStatusLabel(incident.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{incident.title}</Text>
          <Text style={styles.idText}>{t('incident_id', { defaultValue: 'ID: ' })}{incident._id?.substring(0, 8).toUpperCase()}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <MaterialIcons name="place" size={20} color="#6b7280" />
            <View style={styles.rowContent}>
              <Text style={styles.label}>{t('location_label', { defaultValue: 'Location:' })}</Text>
              <Text style={styles.value}>{incident.location}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <MaterialIcons name="event" size={20} color="#6b7280" />
            <View style={styles.rowContent}>
              <Text style={styles.label}>{t('date_label', { defaultValue: 'Date:' })}</Text>
              <Text style={styles.value}>{new Date(incident.createdAt).toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <MaterialIcons name="person" size={20} color="#6b7280" />
            <View style={styles.rowContent}>
              <Text style={styles.label}>{t('reported_by_label', { defaultValue: 'Reported by:' })}</Text>
              <Text style={styles.value}>{incident.reportedBy?.name || t('unknown', { defaultValue: 'Unknown' })}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('description', { defaultValue: 'Description' })}</Text>
          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>

        {/* Admin/Supervisor Actions */}
        {isAdminOrSupervisor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('update_status', { defaultValue: 'Update Status' })}</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={status}
                onValueChange={(itemValue) => setStatus(itemValue)}
              >
                <Picker.Item label={t('status_pending', { defaultValue: 'Pending' })} value="pending" />
                <Picker.Item label={t('status_in_review', { defaultValue: 'Under Investigation' })} value="in_review" />
                <Picker.Item label={t('status_resolved', { defaultValue: 'Resolved' })} value="resolved" />
              </Picker>
            </View>

            {status === 'resolved' && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.label}>{t('resolution_comment', { defaultValue: 'Resolution Comment' })}</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('resolution_placeholder', { defaultValue: 'Enter resolution details...' })}
                  value={resolution}
                  onChangeText={setResolution}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleStatusSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{t('save_status', { defaultValue: 'Save Status' })}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Resolution Display (if resolved and not editing) */}
        {incident.status === 'resolved' && !isAdminOrSupervisor && incident.resolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('resolution', { defaultValue: 'Resolution' })}</Text>
            <Text style={styles.descriptionText}>{incident.resolution}</Text>
            {incident.resolvedAt && (
              <Text style={styles.metaText}>{t('resolved_on', { defaultValue: 'Resolved on:' })} {new Date(incident.resolvedAt).toLocaleDateString()}</Text>
            )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  idText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  rowContent: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  metaText: {
    marginTop: 12,
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default IncidentDetail;
