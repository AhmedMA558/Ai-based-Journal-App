import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, BookOpen, CalendarDays, Search } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import type { AuthStackParamList, MainStackParamList, MainTabParamList } from './types';

import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import MfaChallengeScreen from '@/screens/MfaChallengeScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import JournalListScreen from '@/screens/JournalListScreen';
import JournalEditorScreen from '@/screens/JournalEditorScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import SearchScreen from '@/screens/SearchScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#090d16',
    card: '#0f172a',
    border: 'rgba(255,255,255,0.08)',
    primary: '#818cf8',
    text: '#f8fafc',
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="MfaChallenge" component={MfaChallengeScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: 'rgba(255,255,255,0.08)' },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Journals"
        component={JournalListScreen}
        options={{ tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen
        name="JournalEditor"
        component={JournalEditorScreen}
        options={{ presentation: 'modal' }}
      />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, checking } = useAuthContext();

  if (checking) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#818cf8" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NAV_THEME}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
