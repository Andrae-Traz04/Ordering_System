import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import OwnerDashboardScreen from './src/screens/OwnerDashboardScreen'
import CustomerDashboardScreen from './src/screens/CustomerDashboardScreen'
import { ActivityIndicator, View } from 'react-native'
import { colors } from './src/theme/design'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

const Stack = createNativeStackNavigator()

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBottom }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!user) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.panelDark },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.bgBottom },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.panelDark },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.bgBottom },
      }}
    >
      {user.role === 'owner' || user.role === 'admin' ? (
        <Stack.Screen name="Dashboard" component={OwnerDashboardScreen} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="Dashboard" component={CustomerDashboardScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgBottom }}>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}