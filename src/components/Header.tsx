import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Header() {
  const navigation = useNavigation<NavigationProp>();
  const { isLoggedIn, logout, user, token } = useAuth();
  console.log('ログイン情報', isLoggedIn , user ,token);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>社員スキル管理</Text>
      {isLoggedIn ? (
        <View style={styles.links}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.link}>ダッシュボード</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Employees')}>
            <Text style={styles.link}>社員</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Skills')}>
            <Text style={styles.link}>スキル</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Assignments')}>
            <Text style={styles.link}>課題</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.link}>タスク</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
            <Text style={styles.link}>アクティビティ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Companies')}>
            <Text style={styles.link}>企業</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            logout();
            navigation.navigate('Login');
          }}>
            <Text style={styles.logout}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>ログイン</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  link: {
    marginRight: 12,
    color: '#3b82f6',
    fontSize: 14,
  },
  logout: {
    marginRight: 12,
    color: '#ef4444',
    fontSize: 14,
  },
});
