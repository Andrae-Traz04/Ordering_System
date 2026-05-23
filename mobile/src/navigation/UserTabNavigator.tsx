import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CustomerDashboardScreen from '../screens/CustomerDashboardScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Dedicated Orders screen (separate from Dashboard/shop).
import OrdersScreen from '../screens/CustomerOrdersScreen';


import { colors } from '../theme/design';


const Tab = createBottomTabNavigator();

export default function UserTabNavigator() {
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
          if (route.name === 'Orders') icon = '↻';
          if (route.name === 'Cart') icon = '▦';
          if (route.name === 'Profile') icon = '☻';

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
      <Tab.Screen name="Dashboard" component={CustomerDashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

