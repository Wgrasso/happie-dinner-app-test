import React, { createContext, useContext, useMemo } from 'react';

// Fallback theme matching the original hardcoded values from the app
const originalTheme = {
  name: 'Original',
  colors: {
    primary: '#8B7355',
    primaryLight: '#A89279',
    primaryDark: '#6B5640',
    secondary: '#E8845C',
    secondaryLight: '#F0A07E',

    background: '#FEFEFE',
    surface: '#F5F2EE',
    surfaceAlt: '#F0EDE8',
    surfaceHover: '#EBE7E1',
    surfaceWarm: '#FAF8F5',
    card: '#FFFFFF',
    modal: '#FFFFFF',

    text: '#2D2D2D',
    textSecondary: '#8B7355',
    textTertiary: '#8B8B8B',
    textPlaceholder: '#B0A898',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    border: '#E8E2DA',
    borderLight: '#F0EDE8',
    borderSubtle: '#F5F2EE',
    divider: '#E8E2DA',

    error: '#F44336',
    errorLight: '#FFEBEE',
    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FF9800',
    warningLight: '#FFF3E0',

    gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32',

    buttonPrimary: '#8B7355',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#FFFFFF',
    buttonSecondaryText: '#8B7355',
    buttonDanger: '#F44336',
    buttonDangerText: '#FFFFFF',
    buttonDisabled: '#D5CFC7',
    buttonDisabledText: '#B0A898',

    inputBackground: '#FFFFFF',
    inputBorder: '#E8E2DA',
    inputText: '#2D2D2D',
    inputPlaceholder: '#B0A898',

    tabBarBackground: '#FEFEFE',
    tabBarBorder: '#E8E2DA',
    tabBarActive: '#E8845C',
    tabBarInactive: '#B0A898',

    headerBackground: '#FEFEFE',
    headerText: '#2D2D2D',

    chatBubbleSelf: '#F0EDE8',
    chatBubbleOther: '#F5F2EE',
    chatBubbleSystem: '#F0EDE8',
    chatInputBackground: '#F5F2EE',

    voteYes: '#4CAF50', voteNo: '#F44336',

    overlay: 'rgba(0,0,0,0.5)',
    shadowColor: '#000',

    appleButton: '#000000', appleButtonText: '#FFFFFF',
    googleButton: '#FFFFFF', googleButtonText: '#2D2D2D',
  },

  typography: {
    fontFamily: { heading: 'Inter_700Bold', body: 'Inter_400Regular', bodyMedium: 'Inter_500Medium', bodySemiBold: 'Inter_600SemiBold', bodyBold: 'Inter_700Bold' },
    fontSize: { xs: 10, sm: 12, md: 13, base: 15, lg: 16, xl: 18, '2xl': 20, '3xl': 24, '4xl': 30, '5xl': 36, '6xl': 44 },
    letterSpacing: { tight: 0, normal: 0.3, wide: 0.8, wider: 1.5, widest: 3 },
    textTransform: { heading: 'none', label: 'none', button: 'none' },
  },
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, '2xl': 40, '3xl': 56, '4xl': 72 },
  borderRadius: { none: 0, sm: 4, md: 8, base: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
  shadows: {
    none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  },
  components: {
    button: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, fontWeight: '600', fontSize: 15 },
    card: { padding: 16, borderRadius: 12, borderWidth: 0 },
    input: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, fontSize: 15 },
    avatar: { borderRadius: 9999, borderWidth: 0 },
    header: { paddingVertical: 16, paddingHorizontal: 24 },
    messageBubble: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const value = useMemo(() => ({
    theme: originalTheme,
    themeKey: 'original',
    switchTheme: () => {},
    themeNames: ['original'],
  }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  // Return fallback instead of throwing so components work without ThemeProvider
  if (!ctx) return { theme: originalTheme, themeKey: 'original', switchTheme: () => {}, themeNames: ['original'] };
  return ctx;
};
