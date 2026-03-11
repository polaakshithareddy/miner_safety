import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources } from './translations';
/**
 * Detect language logic:
 * 1. Check AsyncStorage for manually saved language.
 * 2. If not found, use device locale.
 * 3. Fallback to English.
 */

const LANGUAGE_KEY = 'user-language';

const getLanguage = async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage) {
            return savedLanguage;
        }

        // Ensure Localization.getLocales() returns an array and pick the first one safely
        const locales = Localization.getLocales();
        const deviceLanguage = locales && locales[0] ? locales[0].languageCode : 'en';
        return deviceLanguage;
    } catch (error) {
        console.log('Error reading language', error);
        return 'en';
    }
};

const initI18n = async () => {
    const language = await getLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: language,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
            compatibilityJSON: 'v3', // Required for Android
        });
};

initI18n();

export default i18n;

export const changeLanguage = async (lang) => {
    try {
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
        console.log('Error changing language', error);
    }
};
