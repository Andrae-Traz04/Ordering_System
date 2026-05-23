import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import OwnerOrdersScreen from '../screens/OwnerOrdersScreen';
import OwnerProductsScreen from '../screens/OwnerProductsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { colors } from '../theme/design';

const OrdersScreen = OwnerOrdersScreen;
const ProductsScreen = OwnerProductsScreen;
const OwnerProfileScreen = ProfileScreen;


const Tab = createBottomTabNavigator();

export default function OwnerTabNavigator() {
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
          // Use simple arrow-like glyphs for a more “UI icon” look without emoji dependency.
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
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Profile" component={OwnerProfileScreen} />
    </Tab.Navigator>
  );
}

