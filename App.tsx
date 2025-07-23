// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LoginScreen from './src/screens/Login';
import SignupScreen from './src/screens/Signup';
import DashboardScreen from './src/screens/Dashboard';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: HomeScreenProps) {
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ホーム' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ログイン' }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: '新規登録' }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'ダッシュボード' }} />
      </Stack.Navigator>
    </NavigationContainer>
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
