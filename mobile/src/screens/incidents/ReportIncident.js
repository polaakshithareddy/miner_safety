import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';

const ReportIncident = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'other',
    severity: 'medium',
    location: '',
    description: ''
  });

  const severityOptions = [
    { value: 'low', label: t('severity_low', { defaultValue: 'Low' }) },
    { value: 'medium', label: t('severity_medium', { defaultValue: 'Medium' }) },
    { value: 'high', label: t('severity_high', { defaultValue: 'High' }) },
    { value: 'critical', label: t('severity_critical', { defaultValue: 'Critical' }) },
  ];

  const typeOptions = [
    { value: 'injury', label: t('category_injury', { defaultValue: 'Injury' }) },
    { value: 'near_miss', label: t('category_near_miss', { defaultValue: 'Near Miss' }) },
    { value: 'property_damage', label: t('category_property_damage', { defaultValue: 'Property Damage' }) },
    { value: 'environmental', label: t('category_environmental', { defaultValue: 'Environmental' }) },
    { value: 'other', label: t('category_other', { defaultValue: 'Other' }) },
  ];

  const handleSubmit = async () => {
    if (!formData.title || !formData.location || !formData.description) {
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('fill_all_fields', { defaultValue: 'Please fill in all required fields' }));
      return;
    }

    try {
      setLoading(true);
      await api.post('/incidents', formData);
      Alert.alert(t('success_title', { defaultValue: 'Success' }), t('incident_reported_success', { defaultValue: 'Incident reported successfully!' }));
      navigation.goBack();
    } catch (error) {
      console.error('Report incident error', error);
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('incident_report_failed', { defaultValue: 'Failed to submit incident report.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('report_incident', { defaultValue: 'Report Incident' })}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>{t('document_incidents_desc', { defaultValue: 'Document safety incidents' })}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('title_required', { defaultValue: 'Title *' })}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('incident_title_placeholder', { defaultValue: 'Brief description of the incident' })}
              value={formData.title}
              onChangeText={text => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('type_required', { defaultValue: 'Type *' })}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={itemValue => setFormData({ ...formData, type: itemValue })}
                >
                  {typeOptions.map(opt => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{t('severity_required', { defaultValue: 'Severity *' })}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.severity}
                  onValueChange={itemValue => setFormData({ ...formData, severity: itemValue })}
                >
                  {severityOptions.map(opt => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('location_required', { defaultValue: 'Location *' })}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('incident_location_placeholder', { defaultValue: 'Where did this occur?' })}
              value={formData.location}
              onChangeText={text => setFormData({ ...formData, location: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('description_required', { defaultValue: 'Description *' })}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('incident_desc_placeholder', { defaultValue: 'Provide detailed description of what happened...' })}
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={text => setFormData({ ...formData, description: text })}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('report_incident', { defaultValue: 'Report Incident' })}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 120,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportIncident;
