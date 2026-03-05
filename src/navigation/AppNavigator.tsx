/**
 * 신묘 (神妙) - 앱 네비게이션 구조
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { RootStackParamList, TabParamList } from './types';
import { Colors } from '../constants/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ConsultScreen from '../screens/ConsultScreen';
import ShopScreen from '../screens/ShopScreen';
import AccountScreen from '../screens/AccountScreen';
import FortuneScreen from '../screens/FortuneScreen';
import CompatibilityScreen from '../screens/CompatibilityScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SajuInputScreen from '../screens/SajuInputScreen';
import SajuResultScreen from '../screens/SajuResultScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import WeeklyFortuneScreen from '../screens/WeeklyFortuneScreen';
import FortuneAnalysisScreen from '../screens/FortuneAnalysisScreen';
import ProfileListScreen from '../screens/ProfileListScreen';
import CompatibilityResultScreen from '../screens/CompatibilityResultScreen';
import FortuneDetailScreen from '../screens/FortuneDetailScreen';
import FaceReadingScreen from '../screens/FaceReadingScreen';
import NewYearFortuneScreen from '../screens/NewYearFortuneScreen';
import TarotScreen from '../screens/TarotScreen';
import TarotReadingScreen from '../screens/TarotReadingScreen';
import MbtiScreen from '../screens/MbtiScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: 'transparent',
    notification: Colors.primary,
  },
};

/**
 * Bottom Tab Navigator
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray600,
        tabBarStyle: {
          position: 'absolute',
          borderTopColor: 'transparent',
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint="systemChromeMaterial"
            intensity={100}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          color: Colors.text,
          fontSize: 17,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Consult"
        component={ConsultScreen}
        options={{
          title: '상담',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: '천기몰',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bag' : 'bag-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: '계정',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Stack Navigator
 */
export default function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerShadowVisible: false,
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            color: Colors.text,
            fontSize: 17,
            fontWeight: '600',
          },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SajuInput"
          component={SajuInputScreen}
          options={{ title: '사주 입력' }}
        />
        <Stack.Screen
          name="SajuResult"
          component={SajuResultScreen}
          options={{ title: '사주 결과' }}
        />
        <Stack.Screen
          name="AIAnalysis"
          component={AIAnalysisScreen}
          options={{ title: 'AI 분석' }}
        />
        <Stack.Screen
          name="Fortune"
          component={FortuneScreen}
          options={{ title: '오늘의 운세' }}
        />
        <Stack.Screen
          name="WeeklyFortune"
          component={WeeklyFortuneScreen}
          options={{ title: '주간 운세' }}
        />
        <Stack.Screen
          name="FortuneAnalysis"
          component={FortuneAnalysisScreen}
          options={{ title: 'AI 운세 분석' }}
        />
        <Stack.Screen
          name="FortuneDetail"
          component={FortuneDetailScreen}
          options={{ title: '카테고리별 운세' }}
        />
        <Stack.Screen
          name="FaceReading"
          component={FaceReadingScreen}
          options={{ title: '관상 분석' }}
        />
        <Stack.Screen
          name="NewYearFortune"
          component={NewYearFortuneScreen}
          options={{ title: '2026 신년운' }}
        />
        <Stack.Screen
          name="Tarot"
          component={TarotScreen}
          options={{ title: '타로' }}
        />
        <Stack.Screen
          name="TarotReading"
          component={TarotReadingScreen}
          options={({ route }) => ({ title: route.params.label })}
        />
        <Stack.Screen
          name="Compatibility"
          component={CompatibilityScreen}
          options={{ title: '궁합 분석' }}
        />
        <Stack.Screen
          name="CompatibilityResult"
          component={CompatibilityResultScreen}
          options={{ title: '궁합 결과' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: '상담 기록' }}
        />
        <Stack.Screen
          name="Mbti"
          component={MbtiScreen}
          options={{ title: 'MBTI' }}
        />
        <Stack.Screen
          name="ProfileList"
          component={ProfileListScreen}
          options={{ title: '프로필 관리' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
