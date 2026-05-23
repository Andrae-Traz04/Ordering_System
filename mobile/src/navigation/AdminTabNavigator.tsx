import React from 'react';
import { Text, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';
import AdminCustomersScreen from '../screens/AdminCustomersScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import OwnerProductsScreen from '../screens/OwnerProductsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import { colors, typography, shadows, spacing } from '../theme/design';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ focused, icon, label }: { focused: boolean; icon: string; label: string }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{
        fontSize: focused ? 22 : 20,
        opacity: focused ? 1 : 0.6,
        marginBottom: 2,
      }}>
        {icon}
      </Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? colors.primary : colors.textSecondary,
        marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );
};

// Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 8,
          ...shadows.md,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📊" label="Dashboard" />
          ),
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={AdminOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📋" label="Orders" />
          ),
        }}
      />
      <Tab.Screen 
        name="Products" 
        component={OwnerProductsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🛍️" label="Products" />
          ),
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={AdminCustomersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👥" label="Customers" />
          ),
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={AdminUsersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⚙️" label="Users" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Order Detail Stack
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={AdminOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

// Main Admin Navigator with Stack for nested navigation
export default function AdminTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}