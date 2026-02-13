import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../translations/en.json';
import nl from '../translations/nl.json';

const LANGUAGE_KEY = '@app_language';

// Get saved language preference
export const getSavedLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLang || 'nl'; // Default to Dutch
  } catch (error) {
    console.log('Error loading language preference:', error);
    return 'nl';
  }
};

// Save language preference
export const saveLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.log('Error saving language preference:', error);
  }
};

// Initialize i18n
const initI18n = async () => {
  const savedLang = await getSavedLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: {
          translation: en
        },
        nl: {
          translation: nl
        }
      },
      lng: savedLang,
      fallbackLng: 'nl',
      interpolation: {
        escapeValue: false // React already escapes values
      },
      react: {
        useSuspense: false
      }
    });
};

initI18n();

export default i18n;
