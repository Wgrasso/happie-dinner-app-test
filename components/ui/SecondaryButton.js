import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';
import { lightHaptic } from '../../lib/haptics';

/**
 * SecondaryButton — ghost/text button for quiet actions (e.g. "Or enter
 * manually", "Cancel"). Two visual variants:
 *
 *   variant: 'ghost' (default)  — transparent, primary-colored text
 *   variant: 'outlined'          — bordered, primary-colored text
 *
 * Props:
 *   label: string
 *   onPress: () => void
 *   icon?: Feather name   — leading icon
 *   underline?: boolean   — text-decoration (ghost variant only)
 *   style?: any
 */
export default function SecondaryButton({
  label,
  onPress,
  icon,
  variant = 'ghost',
  underline = false,
  disabled = false,
  style,
}) {
  const { theme } = useTheme();
  const s = useMemo(
    () => createStyles(theme, variant, underline),
    [theme, variant, underline],
  );

  const handlePress = () => {
    lightHaptic();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[s.btn, disabled && s.btnDisabled, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={s.content}>
        {icon ? <Feather name={icon} size={15} color={theme.colors.primary} /> : null}
        <Text style={s.text}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme, variant, underline) =>
  StyleSheet.create({
    btn: {
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      backgroundColor:
        variant === 'outlined' ? 'transparent' : 'transparent',
      borderWidth: variant === 'outlined' ? 1.5 : 0,
      borderColor: theme.colors.border,
    },
    btnDisabled: { opacity: 0.5 },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    text: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textDecorationLine: underline ? 'underline' : 'none',
    },
  });
