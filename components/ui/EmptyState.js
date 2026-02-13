import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

// Chef hat illustration using the app's drawing
const ChefHatIllustration = ({ size = 100 }) => (
  <Image 
    source={require('../../assets/drawing9.png')}
    style={{ width: size, height: size, opacity: 0.85 }}
    resizeMode="contain"
  />
);

// Empty State Component
const EmptyState = ({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  compact = false,
  showChefHat = true
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showChefHat && (
        <View style={[styles.illustrationWrapper, compact && styles.illustrationWrapperCompact]}>
          <ChefHatIllustration size={compact ? 42 : 60} />
        </View>
      )}
      
      <Text style={[styles.title, compact && styles.titleCompact]}>
        {title}
      </Text>
      
      {description && (
        <Text style={[styles.description, compact && styles.descriptionCompact]}>
          {description}
        </Text>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  containerCompact: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  illustrationWrapper: {
    width: 68,
    height: 68,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrapperCompact: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 19,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 340,
  },
  descriptionCompact: {
    fontSize: 15,
    maxWidth: 300,
  },
  actionButton: {
    marginTop: 20,
    backgroundColor: '#8B7355',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});

export default EmptyState;

