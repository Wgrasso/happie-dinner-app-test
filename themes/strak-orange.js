// Strak Orange — Consolidated 10-colour palette with linen grain
//
// Palette:
//  1. Cream       #FFFAF5   backgrounds, cards, modals, inputs
//  2. Light peach  #FFF3E8   surfaces, subtle borders, chat
//  3. Peach        #FFE8D0   alt surfaces, chat bubbles
//  4. Medium peach #FFDDB8   hover states, borders, disabled
//  5. Mid orange   #FF9F45   secondary accents
//  6. Bold orange  #FF6B00   primary, buttons, active states
//  7. Dark orange  #CC5500   warnings, dark accents
//  8. Red          #CC2200   errors, danger
//  9. Green        #2D8A40   success, vote yes
// 10. Near black   #1A1000   text, headers
//     + Brown      #7A6550   secondary text
//     + Muted      #B09880   placeholders, disabled, inactive

export const strakOrangeTheme = {
  name: 'Strak Orange',
  description: 'Bold oranje popping',

  colors: {
    primary: '#FF6B00',
    primaryLight: '#FF9F45',
    primaryDark: '#CC5500',
    secondary: '#FF9F45',
    secondaryLight: '#FF9F45',

    background: '#FFFAF5',
    surface: '#FFF3E8',
    surfaceAlt: '#FFE8D0',
    surfaceHover: '#FFDDB8',
    surfaceWarm: '#FFFAF5',
    card: '#FFFAF5',
    modal: '#FFFAF5',

    text: '#1A1000',
    textSecondary: '#7A6550',
    textTertiary: '#9A8770',
    textPlaceholder: '#8A7560',
    textInverse: '#FFFAF5',
    textOnPrimary: '#FFFFFF',

    border: '#FFDDB8',
    borderLight: '#FFE8D0',
    borderSubtle: '#FFF3E8',
    divider: '#FF6B00',

    error: '#CC2200',
    errorLight: '#FFE8D0',
    // Success stays in the warm orange family so success toasts don't clash
    // with the "strak orange" brand. Using a distinct warm amber so it still
    // reads as "yes / saved" without colliding with the bold orange primary.
    success: '#D97706',
    successLight: '#FEF3E0',
    warning: '#CC5500',
    warningLight: '#FFF3E8',

    gold: '#FF6B00', silver: '#7A6550', bronze: '#B09880',

    buttonPrimary: '#FF6B00',
    buttonPrimaryText: '#FFFFFF',
    buttonSecondary: '#FFFAF5',
    buttonSecondaryText: '#FF6B00',
    buttonDanger: '#CC2200',
    buttonDangerText: '#FFFFFF',
    buttonDisabled: '#FFDDB8',
    buttonDisabledText: '#B09880',

    inputBackground: '#FFFAF5',
    inputBorder: '#FF6B00',
    inputText: '#1A1000',
    inputPlaceholder: '#B09880',

    tabBarBackground: '#FFFAF5',
    tabBarBorder: '#FFDDB8',
    tabBarActive: '#FF6B00',
    tabBarInactive: '#B09880',

    headerBackground: '#FFFAF5',
    headerText: '#1A1000',

    chatBubbleSelf: '#FFE8D0',
    chatBubbleOther: '#FFF3E8',
    chatBubbleSystem: '#FFE8D0',
    chatInputBackground: '#FFF3E8',

    voteYes: '#2D8A40', voteNo: '#CC2200',

    overlay: 'rgba(26,16,0,0.6)',
    // Shadow base — used by elevated cards, modals, hero CTAs.
    // Warm near-black so shadows feel on-brand instead of cold gray.
    shadowColor: '#1A1000',

    appleButton: '#1A1000', appleButtonText: '#FFFAF5',
    googleButton: '#FFFAF5', googleButtonText: '#1A1000',
  },

  typography: {
    fontFamily: { heading: 'PlayfairDisplay_700Bold', body: 'Inter_400Regular', bodyMedium: 'Inter_500Medium', bodySemiBold: 'Inter_600SemiBold', bodyBold: 'Inter_700Bold' },
    fontSize: { xs: 10, sm: 11, md: 13, base: 14, lg: 15, xl: 17, '2xl': 20, '3xl': 24, '4xl': 30, '5xl': 36, '6xl': 44 },
    letterSpacing: { tight: 0, normal: 0.3, wide: 0.8, wider: 1.5, widest: 3 },
    textTransform: { heading: 'uppercase', label: 'uppercase', button: 'uppercase' },
  },
  spacing: { xs: 4, sm: 8, md: 14, base: 18, lg: 24, xl: 32, '2xl': 44, '3xl': 56, '4xl': 72 },
  borderRadius: { none: 0, sm: 0, md: 0, base: 0, lg: 0, xl: 0, '2xl': 0, full: 9999 },
  // Layered elevation: flat at 'none'/'sm' to keep the strak feel, but md+
  // tiers get real shadows so hero elements (CTAs, modals, elevated cards)
  // read as elevated instead of blending into the cream background.
  shadows: {
    none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    sm: { shadowColor: '#1A1000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#1A1000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    lg: { shadowColor: '#1A1000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 6 },
    xl: { shadowColor: '#1A1000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 10 },
  },
  components: {
    button: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 0, fontWeight: '600', fontSize: 13 },
    card: { padding: 18, borderRadius: 0, borderWidth: 1 },
    input: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 0, borderWidth: 1, fontSize: 14 },
    avatar: { borderRadius: 0, borderWidth: 1 },
    header: { paddingVertical: 18, paddingHorizontal: 24 },
    messageBubble: { borderRadius: 0, paddingVertical: 12, paddingHorizontal: 16 },
  },
};
