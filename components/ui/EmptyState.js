import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/ThemeContext';
import PrimaryButton from './PrimaryButton';

// Chef hat illustration using the app's drawing.
// Rendered inside a coral-tinted double-ring for visual warmth.
const ChefHatIllustration = ({ size = 60 }) => (
  <Image
    source={require('../../assets/drawing9.png')}
    style={{ width: size, height: size, opacity: 0.9 }}
    resizeMode="contain"
  />
);

/**
 * EmptyState — warm illustrated placeholder for empty lists.
 *
 * Legacy API preserved: title, description, actionLabel, onAction, compact,
 * showChefHat. Now wrapped in a soft warm-surface card with decorative coral
 * rings behind the chef-hat illustration so empty screens have real presence
 * instead of looking like "nothing loaded yet".
 *
 * New optional props:
 *   actionIcon?: Feather name — shown in the CTA button
 *   actionVariant?: 'primary' | 'accent' — defaults to 'accent' (coral)
 *   boxed?: boolean — when true (default), wraps content in a warm card
 */
const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  actionVariant = 'accent',
  compact = false,
  showChefHat = true,
  boxed = true,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createStyles(theme, compact, boxed),
    [theme, compact, boxed],
  );

  return (
    <View style={styles.container}>
      {showChefHat && (
        <View style={styles.rings}>
          <View style={styles.ringOuter} />
          <View style={styles.ringMid} />
          <View style={styles.illustrationWrapper}>
            <ChefHatIllustration size={compact ? 44 : 60} />
          </View>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <PrimaryButton
            label={actionLabel}
            onPress={onAction}
            icon={actionIcon}
            variant={actionVariant}
            fullWidth={false}
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
};

// Predefined empty states with translations
export const EmptyGroups = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noGroups')}
      description={t('emptyStates.noGroupsDescription')}
      actionLabel={t('emptyStates.createGroup')}
      onAction={onAction}
    />
  );
};

export const EmptyVotes = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noVotes')}
      description={t('emptyStates.noVotesDescription')}
      compact
    />
  );
};

export const EmptyMeals = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noMeals')}
      description={t('emptyStates.noMealsDescription')}
      compact
    />
  );
};

export const EmptyIdeas = ({ onAction }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noRecipes')}
      description={t('emptyStates.noRecipesDescription')}
      actionLabel={t('emptyStates.clearFilters')}
      onAction={onAction}
    />
  );
};

export const EmptySearch = ({ searchTerm }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noResults', { term: searchTerm })}
      description={t('emptyStates.tryDifferentSearch')}
      compact
    />
  );
};

export const EmptyMembers = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noMembers')}
      description={t('emptyStates.shareCodeToInvite')}
      compact
    />
  );
};

export const EmptyOccasions = ({ onAction, compact = false }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('emptyStates.noOccasions')}
      actionLabel={t('emptyStates.planOccasion')}
      onAction={onAction}
      compact={compact}
      showChefHat={false}
    />
  );
};

const createStyles = (theme, compact, boxed) => {
  const tint = `${theme.colors.secondary}14`;
  const tintSoft = `${theme.colors.secondary}08`;
  const ringSize = compact ? 100 : 130;
  const midSize = compact ? 76 : 96;
  const innerSize = compact ? 58 : 74;

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: compact ? 28 : 44,
      paddingHorizontal: compact ? 20 : 32,
      borderRadius: 20,
      backgroundColor: boxed
        ? theme.colors.surfaceWarm || theme.colors.surface
        : 'transparent',
      marginVertical: boxed ? 16 : 0,
    },
    rings: {
      width: ringSize,
      height: ringSize,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: compact ? 14 : 18,
    },
    ringOuter: {
      position: 'absolute',
      width: ringSize,
      height: ringSize,
      borderRadius: ringSize / 2,
      backgroundColor: tintSoft,
    },
    ringMid: {
      position: 'absolute',
      width: midSize,
      height: midSize,
      borderRadius: midSize / 2,
      backgroundColor: tint,
    },
    illustrationWrapper: {
      width: innerSize,
      height: innerSize,
      borderRadius: innerSize / 2,
      backgroundColor: theme.colors.modal,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 4,
    },
    title: {
      fontSize: compact ? 18 : 22,
      fontFamily: 'PlayfairDisplay_700Bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: compact ? 13 : 15,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.textTertiary,
      textAlign: 'center',
      lineHeight: compact ? 18 : 22,
      maxWidth: compact ? 280 : 340,
    },
    actionWrap: {
      marginTop: 20,
    },
  });
};

export default EmptyState;

