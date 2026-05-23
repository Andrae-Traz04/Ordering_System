import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/design';

// Admin Products placeholder (no backend CRUD UI currently implemented in mobile).
const ProductsScreen = AdminDashboardScreen;
// Admin Profile uses the shared profile screen.

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: '#F0EBFF',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const color = focused ? colors.primary : colors.textMuted;
          let icon = '•';
          if (route.name === 'Dashboard') icon = '⌂';
          else if (route.name === 'Orders') icon = '↻';
          else if (route.name === 'Products') icon = '▦';
          else if (route.name === 'Profile') icon = '☻';
          return (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6, color, fontWeight: '700' }}>
              {icon}
            </Text>
          );
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

