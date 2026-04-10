import React, { useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';

/**
 * PrimaryButton — canonical filled brand button with press animation.
 *
 * Props:
 *   label: string
 *   onPress: () => void
 *   loading?: boolean     — shows spinner + optional loadingLabel
 *   loadingLabel?: string — text shown while loading (if omitted, just spinner)
 *   disabled?: boolean
 *   icon?: Feather name   — leading icon
 *   variant?: 'primary' | 'accent'
 *     primary → brown primary (default)
 *     accent  → coral secondary, used for "yes moment" CTAs
 *   fullWidth?: boolean   — defaults to true
 *   size?: 'lg' | 'md'    — defaults to 'lg' (height 56)
 *   style?: any
 */
export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  loadingLabel,
  disabled = false,
  icon,
  variant = 'primary',
  fullWidth = true,
  size = 'lg',
  style,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();
  const s = useMemo(
    () => createStyles(theme, variant, size, fullWidth),
    [theme, variant, size, fullWidth],
  );

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[s.btn, isDisabled && s.btnDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        <View style={s.content}>
          {loading ? (
            <>
              <ActivityIndicator color={theme.colors.textInverse} size="small" />
              {loadingLabel ? <Text style={s.text}>{loadingLabel}</Text> : null}
            </>
          ) : (
            <>
              {icon ? (
                <Feather
                  name={icon}
                  size={size === 'md' ? 16 : 17}
                  color={theme.colors.textInverse}
                />
              ) : null}
              <Text style={s.text}>{label}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (theme, variant, size, fullWidth) => {
  const bgColor =
    variant === 'accent' ? theme.colors.secondary : theme.colors.primary;
  const shadowColor =
    variant === 'accent'
      ? theme.colors.secondary
      : theme.colors.primaryDark || theme.colors.primary;
  const height = size === 'md' ? 46 : 56;
  const radius = size === 'md' ? 14 : 20;

  return StyleSheet.create({
    btn: {
      backgroundColor: bgColor,
      height,
      borderRadius: radius,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      width: fullWidth ? '100%' : undefined,
      shadowColor,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    btnDisabled: {
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    text: {
      fontSize: size === 'md' ? 15 : 16,
      fontWeight: '600',
      color: theme.colors.textInverse,
      letterSpacing: 0.3,
    },
  });
};
