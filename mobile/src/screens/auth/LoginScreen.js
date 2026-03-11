import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/common/LanguageSelector';
import { MaterialIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const { login } = useAuth();
    const { t } = useTranslation();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('error'), t('login_error_fill')); // Note: Added a new key assumption or fallback
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert(t('error'), result.error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LanguageSelector visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <TouchableOpacity
                        style={styles.langButton}
                        onPress={() => setShowLanguageModal(true)}
                    >
                        <MaterialIcons name="language" size={20} color="#666" />
                        <Text style={styles.langButtonText}>{t('language')}</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>{t('login_title')}</Text>
                        <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>{t('email_label')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('email_label')}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>{t('password_label')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('password_label')}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>{t('login_button')}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.linkText}>{t('register_link')}</Text>
                        </TouchableOpacity>
                    </View>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    langButton: {
        position: 'absolute',
        top: 10,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
    },
    langButtonText: {
        marginLeft: 6,
        color: '#666',
        fontWeight: '600',
        fontSize: 12,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
        marginTop: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF', // Placeholder color, should match brand
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 32,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default LoginScreen;
