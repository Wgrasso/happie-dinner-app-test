import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { selectionHaptic } from '../lib/haptics';

export default function BottomTabNavigation({ currentScreen, onTabPress }) {
  const handleTabPress = (screen) => {
    selectionHaptic();
    if (onTabPress) {
      onTabPress(screen);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {/* Profile button - left side */}
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'profile' && styles.activeTab]}
          onPress={() => handleTabPress('profile')}
        >
          <Image 
            source={require('../assets/profile.png')}
            style={[styles.tabIcon, currentScreen === 'profile' && styles.activeIcon]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        {/* Main/Groups button - center with raised circle */}
        <TouchableOpacity 
          style={[styles.tab, styles.mainTab]}
          onPress={() => handleTabPress('groups')}
          hitSlop={{ top: 30, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.mainTabCircle}>
            <Image 
              source={require('../assets/groups.png')}
              style={[
                styles.mainTabIcon, 
                currentScreen === 'groups' && styles.activeMainIcon
              ]}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'inspiration' && styles.activeTab]}
          onPress={() => handleTabPress('inspiration')}
        >
          <Image 
            source={require('../assets/inspiration.png')}
            style={[styles.tabIcon, currentScreen === 'inspiration' && styles.activeInspirationIcon]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Make nav bar transparent
    borderTopWidth: 1,
    borderTopColor: '#E8E2DA',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    zIndex: 999, // Ensure nav bar is always on top
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 24,
    backgroundColor: 'transparent', // Make tab container transparent
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeTab: {
    // backgroundColor: '#F8F6F3', // Removed to keep transparent
  },
  tabIcon: {
    width: 46,
    height: 46,
    opacity: 0.5,
  },
  activeIcon: {
    opacity: 1,
    width: 50,
    height: 50,
  },
  activeInspirationIcon: {
    opacity: 1,
    width: 50,
    height: 50,
  },
  activeGuestIcon: {
    opacity: 1,
    width: 50,
    height: 50,
    tintColor: '#4A90E2',
  },
  // Styles voor de uitpuilende main knop
  mainTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1, // Extra ruimte bovenaan voor de uitpuilende cirkel
  },
  mainTabCircle: {
    width: 73,
    height: 80,
    borderRadius: 40, // Aangepast voor de ovale vorm
    backgroundColor: '#FEFEFE', // Witte cirkel, zelfde als nav bar achtergrond
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -20, // 25% van 80px = ~20px boven de nav bar
    elevation: 10, // Ensure it's above everything for Android
    zIndex: 1000, // Ensure it's above everything
    borderWidth: 1,
    borderColor: '#E8E2DA',
  },
  mainTabIcon: {
    width: 90,  // Groter dan normale tabIcon (46px)
    height: 90,
    opacity: 0.6,
  },
  activeMainIcon: {
    width: 95,  // Nog groter wanneer actief
    height: 95,
    opacity: 1,
  },
  activeMainGuestIcon: {
    width: 64,
    height: 64,
    opacity: 1,
    tintColor: '#4A90E2',
  },
}); 