import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Store
import useThemeStore from './src/store/themeStore';
import { useAuthStore } from './src/store/authStore';

// Services
import { supabase, initializePresence, cleanup } from './src/services/supabase';
import { registerForPushNotifications } from './src/services/notificationService';

// Types
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Colors
const lightColors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#3B82F6',
  chatBubbleSent: '#3B82F6',
  chatBubbleReceived: '#FFFFFF',
};

const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E5E7EB',
  textSecondary: '#9CA3AF',
  border: '#2C2C2C',
  primary: '#3B82F6',
  chatBubbleSent: '#3B82F6',
  chatBubbleReceived: '#2C2C2C',
};

// Animated Splash Screen
function AnimatedSplashScreen({ onFinish }) {
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const scaleAnim = useState(new Animated.Value(0.5))[0];
  const translateYAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Exit animation after delay
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setIsReady(true);
        onFinish();
      });
    }, 2000);
  }, []);

  if (isReady) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeAnim,
        zIndex: 999,
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <Icon name="chatbubbles" size={60} color="#3B82F6" />
        </View>
        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: 2,
          }}
        >
          NeumoChat
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 10,
          }}
        >
          Connect Instantly
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// Main Tab Navigator
function MainTabs() {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          switch (route.name) {
            case 'Chats':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Contacts':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 8,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
          fontSize: 18,
        },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen 
        name="Chats" 
        component={HomeScreen} 
        options={{
          title: 'Messages',
          headerLeft: () => null,
        }}
      />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator() {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        headerTintColor: colors.text,
        cardStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: '',
          headerBackTitleVisible: true,
        })}
      />
    </Stack.Navigator>
  );
}

// Main App Component
export default function App() {
  const { isDarkMode } = useThemeStore();
  const { setUser } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const colors = isDarkMode ? darkColors : lightColors;

  useEffect(() => {
    initializeApp();
    setupRealtime();
    setupNotifications();

    return () => {
      cleanup();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await initializePresence(user.id);
        await registerForPushNotifications(user.id);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const setupRealtime = () => {
    // Subscribe to auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await initializePresence(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        await cleanup();
      }
    });
  };

  const setupNotifications = () => {
    // Handle notification responses
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data.conversationId) {
        // Navigate to conversation
        console.log('Open conversation:', data.conversationId);
      }
    });
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
    setIsReady(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          {showSplash && <AnimatedSplashScreen onFinish={handleSplashFinish} />}
          {isReady && <AppNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
        }
