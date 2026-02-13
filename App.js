import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Easing, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import './lib/i18n'; // Initialize i18n
import { 
  addNotificationReceivedListener, 
  addNotificationResponseListener 
} from './lib/notificationService';
import { AppStateProvider } from './lib/AppStateContext';
import { ToastProvider } from './components/ui/Toast';
import SignInScreen from './components/SignInScreen';
import SignUpScreen from './components/SignUpScreen';
import ProfileScreen from './components/ProfileScreen';
import MainTabNavigator from './components/MainTabNavigator';
import NewRecipeScreen from './components/NewRecipeScreen';
import VotingScreen from './components/VotingScreen';
import ResultsScreen from './components/ResultsScreen';

const Stack = createStackNavigator();

// Custom smooth slide transition that keeps previous screen visible
const smoothSlideTransition = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
          {
            scale: next
              ? next.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.95],
                })
              : 1,
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 0.8, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.15],
        }),
      },
    };
  },
};

// Fade transition for auth screens
const fadeTransition = {
  gestureEnabled: false,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 200,
        easing: Easing.ease,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 180,
        easing: Easing.ease,
      },
    },
  },
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
};

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useRef();

  let [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is in foreground
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      // You can show an in-app alert or update UI here
    });

    // Listen for user tapping on a notification
    responseListener.current = addNotificationResponseListener(response => {
      console.log('👆 Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Navigate based on notification data
      if (data?.type === 'occasion_response' && data?.occasionId && navigationRef.current) {
        // Navigate to the groups tab to see the occasion
        navigationRef.current.navigate('MainTabs', {
          switchToGroupsTab: true,
        });
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
    <AppStateProvider>
        <ToastProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="SignIn"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FEFEFE' },
            detachPreviousScreen: false,
            gestureEnabled: true,
            ...smoothSlideTransition,
          }}
        >
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator}
                options={fadeTransition}
          />
          <Stack.Screen 
            name="SignIn" 
            component={SignInScreen}
            options={fadeTransition}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUpScreen}
            options={fadeTransition}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={smoothSlideTransition}
          />
          <Stack.Screen 
            name="NewRecipe" 
            component={NewRecipeScreen}
            options={smoothSlideTransition}
          />
          <Stack.Screen 
            name="VotingScreen" 
            component={VotingScreen}
            options={{
              ...smoothSlideTransition,
              detachPreviousScreen: false,
            }}
          />
          <Stack.Screen 
            name="ResultsScreen" 
            component={ResultsScreen}
            options={{
              ...smoothSlideTransition,
              detachPreviousScreen: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
        </ToastProvider>
    </AppStateProvider>
    </SafeAreaProvider>
  );
}
