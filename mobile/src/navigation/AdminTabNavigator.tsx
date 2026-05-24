import React from 'react';
import { Alert, Pressable, Text, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';
import AdminCustomersScreen from '../screens/AdminCustomersScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import OwnerProductsScreen from '../screens/OwnerProductsScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import { colors, typography, shadows, spacing } from '../theme/design';

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

// Admin Tab Navigator
function AdminTabs() {
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
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the admin account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.bgPrimary,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.textPrimary,
        },
      }}
    >
      <Stack.Screen
        name="AdminTabs"
        component={AdminTabs}
        options={{
          title: user?.first_name || user?.username || 'Admin',
          headerRight: () => (
            <Pressable onPress={handleLogout} style={{ marginRight: spacing.md }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Logout</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
    </Stack.Navigator>
  );
}