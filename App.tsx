import React from 'react';
import { NavigationContainer, useFocusEffect, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LoginScreen from './src/screens/Login';
import SignupScreen from './src/screens/Signup';
import DashboardScreen from './src/screens/Dashboard';
import EmployeesScreen from './src/screens/employees/Employees';
import EmployeeDetail from './src/screens/employees/EmployeeDetail';
import { AuthProvider } from './src/contexts/AuthContext';
import type { RootStackParamList } from './src/types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: HomeScreenProps) {
  useFocusEffect(
    React.useCallback(() => {
      const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('jwtToken');
        if (token) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }],
            })
          );
        }
      };
      checkLoginStatus();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.title}>ログインする</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate('Signup')}
        style={{ marginTop: 20 }}
      >
        <Text style={styles.title}>新規登録する</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ホーム' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ログイン' }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: '新規登録' }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'ダッシュボード' }} />
          <Stack.Screen name="Employees" component={EmployeesScreen} options={{ title: '社員' }} />
          <Stack.Screen name="EmployeeDetail" component={EmployeeDetail} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
