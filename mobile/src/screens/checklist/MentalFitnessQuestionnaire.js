import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import { LinearGradient } from 'expo-linear-gradient';

const MentalFitnessQuestionnaire = () => {
  const navigation = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuestions();
    checkExistingAssessment();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/mental-fitness/questions');
      setQuestions(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      Alert.alert('Error', 'Failed to load questionnaire');
      setLoading(false);
    }
  };

  const checkExistingAssessment = async () => {
    try {
      const response = await api.get('/mental-fitness/my-latest');
      if (response.data.data) {
        setResult(response.data.data);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Failed to check existing assessment:', error);
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setResponses({
      ...responses,
      [questionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length !== questions.length) {
      Alert.alert('Error', 'Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const formattedResponses = questions.map((q, index) => ({
        question: q.question,
        answer: responses[index],
      }));

      const response = await api.post('/mental-fitness', {
        responses: formattedResponses,
      });

      setResult(response.data.data);
      setShowResult(true);
      Alert.alert('Success', 'Assessment completed successfully');
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      Alert.alert('Error', 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fit': return '#10b981';
      case 'caution': return '#f59e0b';
      case 'unfit': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'fit':
        return {
          title: 'Fit to Work',
          message: 'You are in good mental condition to work safely today. Stay focused and follow all safety protocols.',
          icon: '✓',
        };
      case 'caution':
        return {
          title: 'Proceed with Caution',
          message: 'You may be experiencing some stress or fatigue. Please be extra careful and inform your supervisor if you feel overwhelmed.',
          icon: '⚠',
        };
      case 'unfit':
        return {
          title: 'Not Fit to Work',
          message: 'Your mental state indicates you should not work today. Please speak with your supervisor immediately for support and rest.',
          icon: '✕',
        };
      default:
        return {
          title: 'Assessment Pending',
          message: 'Complete the questionnaire to assess your work readiness.',
          icon: '?',
        };
    }
  };

  const answerOptions = [
    { label: 'Never', value: 0 },
    { label: 'Rarely', value: 1 },
    { label: 'Sometimes', value: 2 },
    { label: 'Often', value: 3 },
    { label: 'Always', value: 4 },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (showResult && result) {
    const statusInfo = getStatusMessage(result.status);
    const statusColor = getStatusColor(result.status);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
              <MaterialIcons name="menu" size={24} color="#333" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Mental Fitness</Text>
              <Text style={styles.headerSubtitle}>Assessment Result</Text>
            </View>
          </View>
        </View>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.resultContainer}>
          <LinearGradient
            colors={[statusColor, statusColor + '80']}
            style={styles.resultCard}
          >
            <View style={styles.statusIconContainer}>
              <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            </View>
            <Text style={styles.resultTitle}>{statusInfo.title}</Text>
            <Text style={styles.resultMessage}>{statusInfo.message}</Text>

            {result.score !== undefined && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={styles.scoreValue}>{result.score}%</Text>
              </View>
            )}

            <View style={styles.resultMeta}>
              <Text style={styles.resultDate}>
                Assessed on: {new Date(result.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setShowResult(false);
                setResponses({});
                setCurrentQuestion(0);
              }}
            >
              <Text style={styles.retakeButtonText}>Retake Assessment</Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mental Fitness</Text>
            <Text style={styles.headerSubtitle}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
          </View>
        </View>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestion + 1} / {questions.length}
          </Text>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>{currentQ?.question}</Text>

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {answerOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  responses[currentQuestion] === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswer(currentQuestion, option.value)}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.radioCircle,
                      responses[currentQuestion] === option.value && styles.radioCircleSelected,
                    ]}
                  >
                    {responses[currentQuestion] === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      responses[currentQuestion] === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <MaterialIcons name="arrow-back" size={20} color={currentQuestion === 0 ? '#ccc' : '#333'} />
            <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          {currentQuestion < questions.length - 1 ? (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#333" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit</Text>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  optionButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  optionText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  resultContainer: {
    padding: 16,
  },
  resultCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.95,
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minWidth: 120,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
  },
  resultMeta: {
    marginTop: 16,
  },
  resultDate: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  retakeButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default MentalFitnessQuestionnaire;

