import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../lib/ThemeContext';
import { lightHaptic } from '../../lib/haptics';

/**
 * FormSection
 *
 * A collapsible section wrapper used to tame long forms. Renders a header row
 * (icon + title + status line + chevron) and conditionally renders children
 * below when `expanded` is true. Intended to be composed into an accordion
 * where the parent holds a single "currently open" key in state.
 *
 * Props:
 *   icon: Feather icon name
 *   title: string
 *   status?: string       — small line under the title (optional). If omitted
 *                           and `hint` is provided, shows `hint` muted instead.
 *   hint?: string         — placeholder line shown when section has no data.
 *   expanded: boolean
 *   onToggle: () => void
 *   children: ReactNode
 *   showDivider?: boolean — if true, renders a thin divider BELOW the section.
 *                           Lets the parent chain sections without manual
 *                           divider elements.
 */
export default function FormSection({
  icon,
  title,
  status,
  hint,
  expanded,
  onToggle,
  children,
  showDivider = true,
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleToggle = () => {
    lightHaptic();
    onToggle?.();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Feather name={icon} size={15} color={theme.colors.secondary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {status ? (
              <Text style={styles.statusText} numberOfLines={1}>
                {status}
              </Text>
            ) : hint ? (
              <Text style={styles.hintText} numberOfLines={1}>
                {hint}
              </Text>
            ) : null}
          </View>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.textTertiary}
        />
      </TouchableOpacity>

      {expanded ? <View style={styles.content}>{children}</View> : null}

      {showDivider ? <View style={styles.divider} /> : null}
    </>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.colors.secondaryLight
        ? `${theme.colors.secondary}1A`
        : theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      // Use the theme's heading face so section headers match EmptyState
      // titles, SignIn/SignUp titles, and NewRecipeScreen's Playfair title.
      fontFamily: theme.typography?.fontFamily?.heading || 'PlayfairDisplay_700Bold',
      fontSize: theme.typography?.fontSize?.xl || 17,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    statusText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    hintText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
    },
    content: {
      paddingHorizontal: 4,
      paddingBottom: 6,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginHorizontal: 4,
    },
  });
