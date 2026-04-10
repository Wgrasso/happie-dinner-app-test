import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';

/**
 * Input — canonical text input for the app.
 *
 * Renders a soft-filled capsule with an optional leading icon and trailing
 * suffix. Subtle focus glow on active state. Label is rendered above the
 * input in small-caps style when provided.
 *
 * Props:
 *   label?: string        — uppercase label shown above the input
 *   icon?: Feather name   — leading icon inside the input
 *   suffix?: ReactNode    — trailing element (e.g. "min" text, chevron icon)
 *   multiline?: boolean   — if true, grows to textarea
 *   error?: string        — shows red border and error message below
 *   style?: any           — wrapper override
 *   containerStyle?: any  — input row override
 *
 *   All other props are forwarded to the underlying TextInput.
 */
export default function Input({
  label,
  icon,
  suffix,
  multiline,
  error,
  style,
  containerStyle,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  const iconColor = focused
    ? theme.colors.primary
    : theme.colors.textPlaceholder;

  return (
    <View style={[s.wrapper, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View
        style={[
          s.row,
          focused && s.rowFocused,
          error && s.rowError,
          containerStyle,
        ]}
      >
        {icon ? (
          <View style={s.iconBox}>
            <Feather name={icon} size={17} color={iconColor} />
          </View>
        ) : (
          <View style={s.paddingLeft} />
        )}
        <TextInput
          style={[s.input, multiline && s.textArea]}
          placeholderTextColor={theme.colors.textPlaceholder}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          multiline={multiline}
          {...inputProps}
        />
        {suffix ? <View style={s.suffixBox}>{suffix}</View> : null}
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    wrapper: { marginBottom: 18 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 7,
      marginLeft: 2,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    rowFocused: {
      borderColor: theme.colors.primaryLight,
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    rowError: {
      borderColor: theme.colors.error,
    },
    iconBox: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paddingLeft: {
      width: 16,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: Platform.OS === 'ios' ? 15 : 13,
      paddingRight: 16,
    },
    textArea: {
      minHeight: 105,
      textAlignVertical: 'top',
      paddingTop: Platform.OS === 'ios' ? 15 : 13,
    },
    suffixBox: {
      paddingRight: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 6,
      marginLeft: 4,
    },
  });
