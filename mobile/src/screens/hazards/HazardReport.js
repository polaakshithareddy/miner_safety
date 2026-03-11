import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';
import SOSButton from '../../components/sos/SOSButton';

import VoiceRecorder from '../../components/common/VoiceRecorder';

const { width } = Dimensions.get('window');

const HazardReport = ({ navigation }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const [reportMode, setReportMode] = useState('text'); // 'text' or 'voice'
    const [formData, setFormData] = useState({
        location: '',
        description: '',
        severity: 'medium',
    });
    const [image, setImage] = useState(null);
    const [audioUri, setAudioUri] = useState(null);

    const severityLevels = [
        { value: 'low', emoji: '🟢', label: 'LOW', color: '#10b981' },
        { value: 'medium', emoji: '🟡', label: 'MED', color: '#f59e0b' },
        { value: 'high', emoji: '🟠', label: 'HIGH', color: '#fb923c' },
        { value: 'critical', emoji: '🔴', label: 'CRIT', color: '#ef4444' }
    ];

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(t('permission_required', { defaultValue: "Permission Required" }), t('camera_permission_msg', { defaultValue: "Camera access is needed to take photos." }));
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };



    const handleSubmit = async () => {
        const hasVoice = audioUri;
        const hasText = formData.description;
        const hasEvidence = image;

        if (!hasVoice && !hasText && !hasEvidence) {
            Alert.alert(t('need_info', { defaultValue: 'Need More Info' }), t('need_info_msg', { defaultValue: 'Please describe the problem using voice, text, or add a photo.' }));
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();

            // Auto-generate title based on mode
            const title = reportMode === 'voice' ? 'Voice Hazard Report' : 'Hazard Report';
            data.append('title', title);
            data.append('description', formData.description || 'See voice note or photo');
            data.append('location', formData.location || 'Not specified');
            data.append('severity', formData.severity);
            data.append('category', 'other'); // Auto-category

            if (image) {
                const localUri = image.uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                data.append('image', {
                    uri: localUri,
                    name: filename,
                    type
                });
            }

            if (audioUri) {
                const filename = audioUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `audio/${match[1]}` : `audio/m4a`;

                data.append('audio', {
                    uri: audioUri,
                    name: filename,
                    type
                });
            }

            await api.post('/hazards', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Alert.alert(t('success_title', { defaultValue: '✅ Success!' }), t('report_submitted', { defaultValue: 'Your hazard report has been submitted.' }), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Report Error:', error);
            Alert.alert(t('error_title', { defaultValue: '❌ Error' }), t('report_failed', { defaultValue: 'Failed to submit report. Please try again.' }));
        } finally {
            setLoading(false);
        }
    };

    // Mode Toggle Component
    const ModeToggle = () => (
        <View style={styles.toggleContainer}>
            <TouchableOpacity
                style={[styles.toggleButton, reportMode === 'text' && styles.toggleActive]}
                onPress={() => setReportMode('text')}
                activeOpacity={0.8}
            >
                <Text style={styles.toggleEmoji}>✍️</Text>
                <Text style={[styles.toggleText, reportMode === 'text' && styles.toggleTextActive]}>
                    {t('write_report', { defaultValue: 'Write Report' })}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.toggleButton, reportMode === 'voice' && styles.toggleActive]}
                onPress={() => setReportMode('voice')}
                activeOpacity={0.8}
            >
                <Text style={styles.toggleEmoji}>🎤</Text>
                <Text style={[styles.toggleText, reportMode === 'voice' && styles.toggleTextActive]}>
                    {t('voice_report', { defaultValue: 'Voice Report' })}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Severity Selector Component
    const SeveritySelector = () => (
        <View style={styles.severityContainer}>
            <Text style={styles.questionText}>{t('severity_question', { defaultValue: 'How bad is it?' })}</Text>
            <View style={styles.severityGrid}>
                {severityLevels.map((level) => (
                    <TouchableOpacity
                        key={level.value}
                        style={[
                            styles.severityCircle,
                            { backgroundColor: level.color + '20' },
                            formData.severity === level.value && styles.severitySelected
                        ]}
                        onPress={() => setFormData({ ...formData, severity: level.value })}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.severityEmoji}>{level.emoji}</Text>
                        <Text style={[styles.severityLabel, { color: level.color }]}>
                            {level.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // Giant Media Buttons
    const MediaButtons = () => (
        <View style={styles.mediaSection}>
            <Text style={styles.questionText}>📸 {t('add_photo', { defaultValue: 'Add Photo? (Optional)' })}</Text>
            <View style={styles.mediaGrid}>
                <TouchableOpacity
                    style={[styles.mediaCircle, { backgroundColor: '#3b82f6' }]}
                    onPress={takePhoto}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="camera-alt" size={50} color="#fff" />
                    <Text style={styles.mediaLabel}>{t('camera', { defaultValue: 'CAMERA' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mediaCircle, { backgroundColor: '#8b5cf6' }]}
                    onPress={pickImage}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="photo-library" size={50} color="#fff" />
                    <Text style={styles.mediaLabel}>{t('gallery', { defaultValue: 'GALLERY' })}</Text>
                </TouchableOpacity>
            </View>
            {image && (
                <View style={styles.imagePreview}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => setImage(null)}
                    >
                        <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
                    <MaterialIcons name="arrow-back" size={28} color="#1a1a1a" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>🚨 {t('report_hazard')}</Text>
                    <Text style={styles.headerSubtitle}>{t('keep_safe', { defaultValue: 'Keep everyone safe' })}</Text>
                </View>
            </View>


            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Mode Toggle */}
                <ModeToggle />

                {/* Text Mode */}
                {reportMode === 'text' && (
                    <>
                        <View style={styles.inputSection}>
                            <Text style={styles.questionText}>{t('where_problem', { defaultValue: '📍 Where is the problem?' })}</Text>
                            <TextInput
                                style={styles.largeInput}
                                placeholder={t('location_placeholder', { defaultValue: "e.g., Tunnel B, Level 3" })}
                                placeholderTextColor="#9ca3af"
                                value={formData.location}
                                onChangeText={(text) => setFormData({ ...formData, location: text })}
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.questionText}>{t('describe_problem', { defaultValue: '💬 Describe the problem' })}</Text>
                            <TextInput
                                style={[styles.largeInput, styles.textArea]}
                                placeholder={t('warning_msg', { defaultValue: "What did you see? What's wrong?" })}
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                            />
                        </View>
                    </>
                )}

                {/* Voice Mode */}
                {reportMode === 'voice' && (
                    <>
                        <View style={styles.voiceSection}>
                            <Text style={styles.questionText}>{t('describe_voice', { defaultValue: '🎤 Describe the problem with your voice' })}</Text>
                            <VoiceRecorder
                                onRecordingComplete={setAudioUri}
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.questionText}>{t('describe_problem', { defaultValue: '💬 Describe the problem' })}</Text>
                            <Text style={styles.hintText}>{t('voice_hint', { defaultValue: "Type or use your keyboard's microphone 🎤" })}</Text>
                            <TextInput
                                style={[styles.largeInput, styles.textArea]}
                                placeholder={t('warning_msg', { defaultValue: "What did you see? What's wrong?" })}
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                            />
                        </View>

                        <View style={styles.inputSection}>
                            <Text style={styles.questionText}>{t('where_optional', { defaultValue: '📍 Where? (Optional)' })}</Text>
                            <TextInput
                                style={styles.largeInput}
                                placeholder={t('location_placeholder_short', { defaultValue: "e.g., Tunnel B" })}
                                placeholderTextColor="#9ca3af"
                                value={formData.location}
                                onChangeText={(text) => setFormData({ ...formData, location: text })}
                            />
                        </View>
                    </>
                )}

                {/* Severity Selector - Both Modes */}
                <SeveritySelector />

                {/* Media Buttons - Both Modes */}
                <MediaButtons />

                {/* Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="large" />
                    ) : (
                        <>
                            <Text style={styles.submitIcon}>🚨</Text>
                            <Text style={styles.submitText}>{t('submit_report', { defaultValue: 'SUBMIT REPORT' })}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
            <SOSButton />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 2,
        borderBottomColor: '#e5e7eb',
    },
    menuButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 8,
    },
    toggleActive: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    toggleEmoji: {
        fontSize: 24,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    toggleTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputSection: {
        marginBottom: 24,
    },
    questionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    largeInput: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        fontSize: 16,
        color: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    voiceSection: {
        marginBottom: 24,
    },
    severityContainer: {
        marginBottom: 24,
    },
    severityGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    severityCircle: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    severitySelected: {
        borderColor: '#1a1a1a',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        transform: [{ scale: 1.05 }],
    },
    severityEmoji: {
        fontSize: 36,
        marginBottom: 4,
    },
    severityLabel: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    mediaSection: {
        marginBottom: 24,
    },
    mediaGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    mediaCircle: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    mediaLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    imagePreview: {
        marginTop: 16,
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    removeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#ef4444',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    submitButton: {
        backgroundColor: '#ef4444',
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 8,
    },
    hintText: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    submitIcon: {
        fontSize: 32,
    },
    submitText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default HazardReport;
