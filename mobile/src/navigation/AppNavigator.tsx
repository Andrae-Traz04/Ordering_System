import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/design';

import LoginScreen from '../screens/LoginScreen';
import AdminTabNavigator from './AdminTabNavigator';
import OwnerTabNavigator from './OwnerTabNavigator';
import UserTabNavigator from './UserTabNavigator';
import RegisterScreen from '../screens/RegisterScreen';
import ActivationPendingScreen from '../screens/ActivationPendingScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ApplyForOwnerScreen from '../screens/ApplyForOwnerScreen';





const Stack = createNativeStackNavigator();




export default function AppNavigator() {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBottom }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgBottom },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ActivationPending" component={ActivationPendingScreen} />
        </>
      ) : (
        <>
          {user.role === 'admin' ? (
            <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
          ) : user.role === 'owner' ? (
            <Stack.Screen name="OwnerMain" component={OwnerTabNavigator} />
          ) : (
            <Stack.Screen name="UserMain" component={UserTabNavigator} />
          )}

          <Stack.Screen name="ApplyForOwner" component={ApplyForOwnerScreen} />

          {/* Shared stack route for order details */}
          <Stack.Screen name="OrderDetail" component={require('../screens/OrderDetailScreen').default} />

          <Stack.Screen name="ActivationPending" component={ActivationPendingScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}

    </Stack.Navigator>
  );
}