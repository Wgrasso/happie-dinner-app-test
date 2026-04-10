import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';
import { lightHaptic } from '../../lib/haptics';

/**
 * ListEditor — row-based editor for a string[] list.
 *
 * Replaces cramped multiline textareas with individually editable rows,
 * each with a leading bullet/number and a per-row delete button. Used for
 * ingredients and steps in the recipe form.
 *
 * Props:
 *   label?: string             — optional section label
 *   items: string[]            — always at least one entry (empty string ok)
 *   onChange: (newItems) => void
 *   placeholder?: string       — placeholder shown inside each empty row
 *   addLabel?: string          — text for the "add row" button
 *   numbered?: boolean         — true → "1. 2. 3." steps; false → "•" bullets
 *   multiline?: boolean        — true for steps (larger rows)
 *   minRows?: number           — keep at least this many blank rows (default 1)
 */
export default function ListEditor({
  label,
  items = [''],
  onChange,
  placeholder,
  addLabel,
  numbered = false,
  multiline = false,
  minRows = 1,
}) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  // Ensure we always render at least `minRows` rows so users can start typing.
  const rows = items.length >= minRows ? items : [...items, ...Array(minRows - items.length).fill('')];

  const updateAt = (idx, value) => {
    onChange(rows.map((item, i) => (i === idx ? value : item)));
  };

  const addRow = () => {
    lightHaptic();
    onChange([...rows, '']);
  };

  const removeAt = (idx) => {
    lightHaptic();
    const next = rows.filter((_, i) => i !== idx);
    onChange(next.length >= minRows ? next : [...next, ...Array(minRows - next.length).fill('')]);
  };

  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      {rows.map((item, idx) => (
        <View key={`row-${idx}`} style={s.row}>
          <View style={s.leading}>
            {numbered ? (
              <Text style={s.numberText}>{idx + 1}</Text>
            ) : (
              <Text style={s.bulletText}>•</Text>
            )}
          </View>
          <TextInput
            style={[s.input, multiline && s.inputMultiline]}
            value={item}
            onChangeText={(v) => updateAt(idx, v)}
            placeholder={
              placeholder
                ? numbered
                  ? `${placeholder} ${idx + 1}`
                  : placeholder
                : undefined
            }
            placeholderTextColor={theme.colors.textPlaceholder}
            multiline={multiline}
            returnKeyType={multiline ? 'default' : 'next'}
            blurOnSubmit={!multiline}
          />
          {rows.length > 1 || item ? (
            <TouchableOpacity
              style={s.removeBtn}
              onPress={() => removeAt(idx)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={
                numbered
                  ? `Verwijder stap ${idx + 1}`
                  : `Verwijder rij ${idx + 1}`
              }
            >
              <Feather name="x" size={15} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <View style={s.removeBtn} />
          )}
        </View>
      ))}
      <TouchableOpacity
        style={s.addBtn}
        onPress={addRow}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={addLabel || 'Voeg rij toe'}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Feather name="plus" size={15} color={theme.colors.primary} />
        <Text style={s.addBtnText}>{addLabel || '+ Voeg rij toe'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 18,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 10,
      marginLeft: 2,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    leading: {
      width: 26,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bulletText: {
      fontSize: 18,
      color: theme.colors.textPlaceholder,
      lineHeight: 18,
    },
    numberText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.secondary,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 11 : 8,
      fontSize: 14,
      color: theme.colors.text,
      minHeight: 42,
    },
    inputMultiline: {
      paddingTop: Platform.OS === 'ios' ? 11 : 8,
      textAlignVertical: 'top',
      minHeight: 56,
    },
    removeBtn: {
      width: 34,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      marginTop: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceWarm,
    },
    addBtnText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.primary,
    },
  });
