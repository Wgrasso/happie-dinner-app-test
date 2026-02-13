import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Base skeleton component with shimmer animation
const SkeletonBase = ({ style, children }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.skeletonBase, style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

// Group Card Skeleton
export const GroupCardSkeleton = () => (
  <View style={styles.groupCard}>
    <View style={styles.groupCardHeader}>
      <SkeletonBase style={styles.groupAvatar} />
      <View style={styles.groupCardInfo}>
        <SkeletonBase style={styles.groupTitle} />
        <SkeletonBase style={styles.groupSubtitle} />
      </View>
      <SkeletonBase style={styles.groupBadge} />
    </View>
  </View>
);

// Recipe Card Skeleton
export const RecipeCardSkeleton = () => (
  <View style={styles.recipeCard}>
    <SkeletonBase style={styles.recipeImage} />
    <View style={styles.recipeInfo}>
      <SkeletonBase style={styles.recipeTitle} />
      <SkeletonBase style={styles.recipeSubtitle} />
    </View>
  </View>
);

// Profile Header Skeleton
export const ProfileHeaderSkeleton = () => (
  <View style={styles.profileHeader}>
    <SkeletonBase style={styles.profileAvatar} />
    <SkeletonBase style={styles.profileName} />
    <SkeletonBase style={styles.profileEmail} />
  </View>
);

// Settings Row Skeleton
export const SettingsRowSkeleton = () => (
  <View style={styles.settingsRow}>
    <SkeletonBase style={styles.settingsIcon} />
    <SkeletonBase style={styles.settingsLabel} />
  </View>
);

// Top Meals Skeleton
export const TopMealsSkeleton = () => (
  <View style={styles.topMealsContainer}>
    <SkeletonBase style={styles.topMealsSectionTitle} />
    <View style={styles.topMealsRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.topMealItem}>
          <SkeletonBase style={styles.topMealImage} />
          <SkeletonBase style={styles.topMealTitle} />
          <SkeletonBase style={styles.topMealVotes} />
        </View>
      ))}
    </View>
  </View>
);

// Member List Skeleton
export const MemberListSkeleton = ({ count = 3 }) => (
  <View style={styles.memberList}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.memberItem}>
        <SkeletonBase style={styles.memberAvatar} />
        <SkeletonBase style={styles.memberName} />
        <SkeletonBase style={styles.memberStatus} />
      </View>
    ))}
  </View>
);

// Full Page Loading Skeleton for Groups
export const GroupsPageSkeleton = () => (
  <View style={styles.pageContainer}>
    <View style={styles.pageHeader}>
      <SkeletonBase style={styles.headerTitle} />
      <SkeletonBase style={styles.headerButton} />
    </View>
    <GroupCardSkeleton />
    <GroupCardSkeleton />
    <GroupCardSkeleton />
  </View>
);

// Full Page Loading Skeleton for Ideas
export const IdeasPageSkeleton = () => (
  <View style={styles.pageContainer}>
    <View style={styles.pageHeader}>
      <SkeletonBase style={styles.headerTitle} />
    </View>
    <View style={styles.recipeGrid}>
      <RecipeCardSkeleton />
      <RecipeCardSkeleton />
      <RecipeCardSkeleton />
      <RecipeCardSkeleton />
    </View>
  </View>
);

// Inline loading indicator (subtle)
export const InlineLoader = ({ size = 'small' }) => {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const scale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={[styles.inlineLoader, size === 'large' && styles.inlineLoaderLarge]}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            size === 'large' && styles.dotLarge,
            { 
              transform: [{ scale }],
              opacity: dotAnim,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E8E6E3',
    borderRadius: 8,
  },

  // Group Card
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  groupCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupTitle: {
    height: 18,
    width: '70%',
    borderRadius: 4,
    marginBottom: 6,
  },
  groupSubtitle: {
    height: 14,
    width: '50%',
    borderRadius: 4,
  },
  groupBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },

  // Recipe Card
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    borderRadius: 0,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    height: 16,
    width: '80%',
    borderRadius: 4,
    marginBottom: 6,
  },
  recipeSubtitle: {
    height: 12,
    width: '60%',
    borderRadius: 4,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileName: {
    height: 24,
    width: 150,
    borderRadius: 4,
    marginBottom: 8,
  },
  profileEmail: {
    height: 16,
    width: 200,
    borderRadius: 4,
  },

  // Settings Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 12,
  },
  settingsLabel: {
    height: 16,
    width: 120,
    borderRadius: 4,
  },

  // Top Meals
  topMealsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topMealsSectionTitle: {
    height: 18,
    width: 100,
    borderRadius: 4,
    marginBottom: 16,
  },
  topMealsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topMealItem: {
    width: (width - 64) / 3,
    alignItems: 'center',
  },
  topMealImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  topMealTitle: {
    height: 12,
    width: 60,
    borderRadius: 4,
    marginBottom: 4,
  },
  topMealVotes: {
    height: 10,
    width: 40,
    borderRadius: 4,
  },

  // Member List
  memberList: {
    paddingHorizontal: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  memberName: {
    flex: 1,
    height: 14,
    borderRadius: 4,
  },
  memberStatus: {
    width: 50,
    height: 24,
    borderRadius: 12,
    marginLeft: 8,
  },

  // Page Skeletons
  pageContainer: {
    flex: 1,
    paddingTop: 60,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    height: 28,
    width: 150,
    borderRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },

  // Inline Loader
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
  },
  inlineLoaderLarge: {
    gap: 6,
    padding: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B7355',
  },
  dotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default {
  GroupCardSkeleton,
  RecipeCardSkeleton,
  ProfileHeaderSkeleton,
  SettingsRowSkeleton,
  TopMealsSkeleton,
  MemberListSkeleton,
  GroupsPageSkeleton,
  IdeasPageSkeleton,
  InlineLoader,
};

