// App.tsx - Vicoo Mobile App (aligned with Web)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SearchScreen from './src/screens/SearchScreen';
import EditorScreen from './src/screens/EditorScreen';
import InboxScreen from './src/screens/InboxScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PricingScreen from './src/screens/PricingScreen';
import FocusModeScreen from './src/screens/FocusModeScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import GalaxyScreen from './src/screens/GalaxyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Material Community Icons — aligned with Web VicooIcon (Material Icons Round)
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Inbox') iconName = focused ? 'inbox' : 'inbox-outline';
          else if (route.name === 'AI') iconName = focused ? 'robot' : 'robot-outline';
          else if (route.name === 'Library') iconName = focused ? 'bookshelf' : 'book-outline';
          else if (route.name === 'Profile') iconName = focused ? 'account-circle' : 'account-circle-outline';
          else iconName = 'circle';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopWidth: 3, borderTopColor: '#1a1a1a', backgroundColor: '#ffffff', paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        headerStyle: { backgroundColor: '#FFD166', borderBottomWidth: 3, borderBottomColor: '#1a1a1a', elevation: 0, shadowOpacity: 0 } as any,
        headerTitleStyle: { fontWeight: '900', fontSize: 18, color: '#1a1a1a' } as any,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Inbox" component={InboxScreen} options={{ title: '收件箱' }} />
      <Tab.Screen name="AI" component={AIAssistantScreen} options={{ title: 'AI 助手' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: '知识库' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFD166', borderBottomWidth: 3, borderBottomColor: '#1a1a1a', elevation: 0, shadowOpacity: 0 } as any,
          headerTitleStyle: { fontWeight: '900', color: '#1a1a1a', fontSize: 18 } as any,
          headerTintColor: '#1a1a1a',
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Editor" component={EditorScreen} options={{ title: '编辑笔记' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: '搜索' }} />
        <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: '项目' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '设置' }} />
        <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: '订阅' }} />
        <Stack.Screen name="FocusMode" component={FocusModeScreen} options={{ title: '专注模式', headerStyle: { backgroundColor: '#101010' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="Timeline" component={TimelineScreen} options={{ title: '时间线' }} />
        <Stack.Screen name="Galaxy" component={GalaxyScreen} options={{ title: '知识图谱' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
