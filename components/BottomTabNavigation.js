import React, { useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { selectionHaptic } from '../lib/haptics';
import { useTheme } from '../lib/ThemeContext';

/**
 * BottomTabNavigation
 *
 * 3-tab bottom nav with an elevated center action. Adds two polish details
 * on top of the previous version:
 *   1. Small active-indicator dot under the icon on the current tab.
 *   2. Scale bounce animation on tap (via Animated.spring).
 *
 * All colors pulled from the active theme so tab colour follows the theme
 * switcher instead of the old hardcoded `#E8845C` brown-coral.
 */
export default function BottomTabNavigation({ currentScreen, onTabPress }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const profileActive = currentScreen === 'profile';
  const groupsActive = currentScreen === 'groups';
  const inspirationActive = currentScreen === 'inspiration';

  const handleTabPress = (screen) => {
    selectionHaptic();
    if (onTabPress) {
      onTabPress(screen);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TabButton
          active={profileActive}
          onPress={() => handleTabPress('profile')}
          styles={styles}
          icon={
            <MaterialCommunityIcons
              name="chef-hat"
              size={profileActive ? 34 : 30}
              color={theme.colors.primary}
              style={{ opacity: profileActive ? 1 : 0.45 }}
            />
          }
          accessibilityLabel="Profile"
        />

        {/* Main/Groups center action */}
        <TouchableOpacity
          style={styles.mainTab}
          onPress={() => handleTabPress('groups')}
          hitSlop={{ top: 30, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Groups"
        >
          <View style={styles.mainTabCircle}>
            <Ionicons
              name={groupsActive ? 'people-circle' : 'people-circle-outline'}
              size={groupsActive ? 56 : 52}
              color={theme.colors.primary}
              style={{ opacity: groupsActive ? 1 : 0.55 }}
            />
          </View>
        </TouchableOpacity>

        <TabButton
          active={inspirationActive}
          onPress={() => handleTabPress('inspiration')}
          styles={styles}
          icon={
            <Feather
              name="search"
              size={inspirationActive ? 32 : 28}
              color={theme.colors.primary}
              style={{ opacity: inspirationActive ? 1 : 0.45 }}
            />
          }
          accessibilityLabel="Inspiration"
        />
      </View>
    </View>
  );
}

/** Single side tab button — handles bounce animation + active indicator dot. */
function TabButton({ active, onPress, icon, styles, accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const indicatorScale = useRef(new Animated.Value(active ? 1 : 0)).current;

  // Animate the dot in/out whenever the active state flips.
  useEffect(() => {
    Animated.spring(indicatorScale, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [active, indicatorScale]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        style={[styles.tabContent, { transform: [{ scale }] }]}
      >
        {icon}
        <Animated.View
          style={[
            styles.activeDot,
            { transform: [{ scale: indicatorScale }] },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.tabBarBackground,
      borderTopWidth: 1,
      borderTopColor: theme.colors.tabBarBorder,
      position: 'absolute',
      bottom: 10,
      left: 0,
      right: 0,
      zIndex: 999,
    },
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 70,
      paddingTop: 20,
      paddingBottom: 15,
      paddingHorizontal: 24,
      backgroundColor: 'transparent',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 60,
      paddingHorizontal: 16,
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      marginTop: 4,
    },
    mainTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      // Match side tabs' height so the absolute circle (top: -12) anchors
      // to the same baseline as it did pre-refactor. Without this the
      // container collapses to the circle's content height and the whole
      // tab slides down.
      height: 60,
      paddingHorizontal: 16,
      paddingTop: 1,
    },
    mainTabCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: -12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 10,
      zIndex: 1000,
    },
  });
