import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { selectionHaptic } from '../lib/haptics';

const ICON_COLOR = '#E8845C';

export default function BottomTabNavigation({ currentScreen, onTabPress }) {
  const handleTabPress = (screen) => {
    selectionHaptic();
    if (onTabPress) {
      onTabPress(screen);
    }
  };

  const profileActive = currentScreen === 'profile';
  const groupsActive = currentScreen === 'groups';
  const inspirationActive = currentScreen === 'inspiration';

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {/* Profile button - P2: Chef's hat */}
        <TouchableOpacity
          style={[styles.tab, profileActive && styles.activeTab]}
          onPress={() => handleTabPress('profile')}
        >
          <MaterialCommunityIcons
            name="chef-hat"
            size={profileActive ? 36 : 32}
            color={ICON_COLOR}
            style={{ opacity: profileActive ? 1 : 0.45 }}
          />
        </TouchableOpacity>

        {/* Main/Groups button - G4: People circle */}
        <TouchableOpacity
          style={[styles.tab, styles.mainTab]}
          onPress={() => handleTabPress('groups')}
          hitSlop={{ top: 30, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.mainTabCircle}>
            <Ionicons
              name={groupsActive ? "people-circle" : "people-circle-outline"}
              size={groupsActive ? 56 : 52}
              color={ICON_COLOR}
              style={{ opacity: groupsActive ? 1 : 0.55 }}
            />
          </View>
        </TouchableOpacity>

        {/* Inspiration button - I2: Search */}
        <TouchableOpacity
          style={[styles.tab, inspirationActive && styles.activeTab]}
          onPress={() => handleTabPress('inspiration')}
        >
          <Feather
            name="search"
            size={inspirationActive ? 34 : 30}
            color={ICON_COLOR}
            style={{ opacity: inspirationActive ? 1 : 0.45 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#E8E2DA',
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
    borderRadius: 12,
  },
  activeTab: {},
  mainTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  mainTabCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEFEFE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -12,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
});
