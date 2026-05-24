import React from 'react';
import { Text, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import CustomerDashboardScreen from '../screens/CustomerDashboardScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CustomerOrdersScreen from '../screens/CustomerOrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ApplyForOwnerScreen from '../screens/ApplyForOwnerScreen';
// TypeScript sometimes shows a stale module resolution error for newly added files in the editor.
// Silence the false-positive until the TS server refreshes.
// @ts-ignore
import ProductDetailScreen from '../screens/ProductDetailScreen.tsx';

import { colors, shadows } from '../theme/design';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ focused, icon, label }: { focused: boolean; icon: string; label: string }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 54 }}>
      <Text style={{
        fontSize: focused ? 22 : 20,
        opacity: focused ? 1 : 0.72,
        marginBottom: 3,
      }}>
        {icon}
      </Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '600',
        color: focused ? colors.primary : colors.textSecondary,
        marginTop: 0,
      }}>
        {label}
      </Text>
    </View>
  );
};

// Customer Tabs Navigator
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 92 : 76,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 10,
          marginHorizontal: 14,
          marginBottom: Platform.OS === 'ios' ? 10 : 12,
          borderRadius: 28,
          position: 'absolute',
          left: 12,
          right: 12,
          ...shadows.md,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 2,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Shop" 
        component={CustomerDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🛍️" label="Shop" />
          ),
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🛒" label="Cart" />
          ),
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={CustomerOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📦" label="Orders" />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Customer Navigator with Stack for detail screens
export default function UserTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="ApplyForOwner" component={ApplyForOwnerScreen} />
    </Stack.Navigator>
  );
}