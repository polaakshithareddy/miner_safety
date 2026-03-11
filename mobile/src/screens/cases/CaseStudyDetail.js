import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import { LinearGradient } from 'expo-linear-gradient';

const CaseStudyDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = route.params || {};
  const role = user?.role || 'worker';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizResponses, setQuizResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCaseStudy();
  }, [id, role]);

  const fetchCaseStudy = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cases/${id}`, { params: { role } });
      setCaseData(response.data?.data);
      // Log view
      await api.post(`/cases/${id}/engagement`, { action: 'view' }).catch(() => null);
    } catch (error) {
      console.error('Failed to fetch case study', error);
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('load_case_error', { defaultValue: 'Unable to load case study' }));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!caseData?.quiz?.length) {
      await logCompletion();
      return;
    }

    const answered = Object.keys(quizResponses).length;
    if (answered !== caseData.quiz.length) {
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('answer_all_questions', { defaultValue: 'Please answer all quiz questions' }));
      return;
    }

    const correctAnswers = caseData.quiz.reduce((score, question, index) => (
      question.correctOption === Number(quizResponses[index]) ? score + 1 : score
    ), 0);
    const percentage = Math.round((correctAnswers / caseData.quiz.length) * 100);

    setSubmitting(true);
    try {
      await api.post(`/cases/${id}/engagement`, {
        action: 'complete',
        quizScore: percentage,
      });
      Alert.alert(t('success_title', { defaultValue: 'Success' }), t('quiz_completed_score', { defaultValue: 'Quiz completed! Score: {{score}}%', score: percentage }));
      fetchCaseStudy();
    } catch (error) {
      console.error('Failed to submit quiz', error);
      Alert.alert(t('error_title', { defaultValue: 'Error' }), t('submit_quiz_error', { defaultValue: 'Failed to submit quiz' }));
    } finally {
      setSubmitting(false);
    }
  };

  const logCompletion = async () => {
    try {
      await api.post(`/cases/${id}/engagement`, { action: 'complete' });
      Alert.alert(t('success_title', { defaultValue: 'Success' }), t('completion_logged', { defaultValue: 'Completion logged' }));
      fetchCaseStudy();
    } catch (error) {
      console.error('Failed to log completion', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('case_not_found', { defaultValue: 'Case study not found' })}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{t('go_back', { defaultValue: 'Go Back' })}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const severityColors = {
    catastrophic: { bg: '#9333ea', text: '#fff' },
    fatal: { bg: '#dc2626', text: '#fff' },
    major: { bg: '#f59e0b', text: '#000' },
    minor: { bg: '#84cc16', text: '#000' },
    near_miss: { bg: '#0ea5e9', text: '#fff' },
  };
  const severity = severityColors[caseData.severity] || severityColors.near_miss;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t('case_study', { defaultValue: 'Case Study' })}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{caseData.title}</Text>
          </View>
        </View>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient colors={[severity.bg, severity.bg + '80']} style={styles.heroSection}>
          <View style={styles.severityBadge}>
            <Text style={[styles.severityText, { color: severity.text }]}>
              {t(`severity_${caseData.severity}`, { defaultValue: caseData.severity?.replace('_', ' ').toUpperCase() })}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{caseData.title}</Text>
          <Text style={styles.heroSubtitle}>{caseData.quickSummary}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaText}>
              {new Date(caseData.date).toLocaleDateString()}
            </Text>
            <Text style={styles.heroMetaText}>•</Text>
            <Text style={styles.heroMetaText}>{caseData.location || t('confidential', { defaultValue: 'Confidential' })}</Text>
          </View>
        </LinearGradient>

        {/* Summary Section */}
        {caseData.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('summary', { defaultValue: 'Summary' })}</Text>
            <Text style={styles.sectionText}>{caseData.summary}</Text>
          </View>
        )}

        {/* Worker Checklist */}
        {role === 'worker' && caseData.workerChecklist && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('safety_checklist', { defaultValue: 'Safety Checklist' })}</Text>
            {caseData.workerChecklist.map((item, index) => (
              <View key={index} style={styles.checklistItem}>
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Supervisor Timeline */}
        {['supervisor', 'admin'].includes(role) && caseData.timeline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('timeline', { defaultValue: 'Timeline' })}</Text>
            {caseData.timeline.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTime}>{event.time}</Text>
                  <Text style={styles.timelineText}>{event.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quiz Section */}
        {caseData.quiz && caseData.quiz.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('quiz', { defaultValue: 'Quiz' })}</Text>
            {caseData.quiz.map((question, index) => (
              <View key={index} style={styles.quizItem}>
                <Text style={styles.quizQuestion}>{question.question}</Text>
                {question.options.map((option, optIndex) => (
                  <TouchableOpacity
                    key={optIndex}
                    style={[
                      styles.quizOption,
                      quizResponses[index] === String(optIndex) && styles.quizOptionSelected,
                    ]}
                    onPress={() => setQuizResponses({ ...quizResponses, [index]: String(optIndex) })}
                  >
                    <Text
                      style={[
                        styles.quizOptionText,
                        quizResponses[index] === String(optIndex) && styles.quizOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleQuizSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('submit_quiz', { defaultValue: 'Submit Quiz' })}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Completion Button (if no quiz) */}
        {(!caseData.quiz || caseData.quiz.length === 0) && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={logCompletion}
          >
            <Text style={styles.completeButtonText}>{t('mark_completed', { defaultValue: 'Mark as Completed' })}</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    padding: 24,
    margin: 16,
    borderRadius: 16,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetaText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    marginTop: 4,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 14,
    color: '#333',
  },
  quizItem: {
    marginBottom: 24,
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quizOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  quizOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  quizOptionText: {
    fontSize: 14,
    color: '#666',
  },
  quizOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CaseStudyDetail;
