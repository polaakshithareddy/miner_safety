import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { MaterialIcons } from '@expo/vector-icons';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (हिंदी)' },
    { code: 'te', label: 'Telugu (తెలుగు)' },
    { code: 'ta', label: 'Tamil (தமிழ்)' },
    { code: 'ml', label: 'Malayalam (മലയാളം)' },
];

const LanguageSelector = ({ visible, onClose }) => {
    const { t, i18n } = useTranslation();

    const handleLanguageLogin = async (langCode) => {
        await changeLanguage(langCode);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('select_language')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={LANGUAGES}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.languageItem,
                                    i18n.language === item.code && styles.selectedItem
                                ]}
                                onPress={() => handleLanguageLogin(item.code)}
                            >
                                <Text style={[
                                    styles.languageText,
                                    i18n.language === item.code && styles.selectedText
                                ]}>
                                    {item.label}
                                </Text>
                                {i18n.language === item.code && (
                                    <MaterialIcons name="check" size={20} color="#2563eb" />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 340,
        padding: 20,
        maxHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    selectedItem: {
        backgroundColor: '#eff6ff',
    },
    languageText: {
        fontSize: 16,
        color: '#4b5563',
        fontWeight: '500',
    },
    selectedText: {
        color: '#2563eb',
        fontWeight: '700',
    },
});

export default LanguageSelector;
