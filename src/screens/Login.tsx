import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';


// navigation.tsで定義したルート名の型をインポート（パスは適宜変更してください）
import type { RootStackParamList } from '../types/navigation';

// Login画面用のナビゲーション型定義
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [message2, setMessage2] = useState('');

  const { login } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

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

  const handleLogin = async () => {
  try {
    const response = await fetch('https://nextjs-skill-viewer.vercel.app/api/smartphone/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('ログイン成功レスポンス:', data);
      const token = data.token;

      if (token) {
        await AsyncStorage.setItem('jwtToken', token);
        console.log('JWT保存完了:', token);
        login(data.user, token);
      }


      Alert.alert('ログイン成功', 'ダッシュボードへ移動します');
      navigation.navigate('Dashboard'); // 型安全に画面遷移
    } else {
      // Zodバリデーション系
      if (data.error?.password?._errors) {
        setMessage(`エラー: ${data.error.password._errors[0]}`);
      }
      if (data.error?.email?._errors) {
        setMessage2(`エラー: ${data.error.email._errors[0]}`);
      }

      // 単純な文字列エラー
      if (typeof data.error === 'string') {
        Alert.alert('ログインエラー', data.error);
      }

      // その他のエラー形式
      if (data.message) {
        Alert.alert('エラー', data.message);
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    setMessage('サインイン中にネットワークエラーが発生しました');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>ログイン</Text>

      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {message ? <Text style={styles.error}>{message}</Text> : null}
      {message2 ? <Text style={styles.error}>{message2}</Text> : null}

      <Button title="ログイン" onPress={handleLogin} />

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>アカウントをまだ登録していませんか?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111827',
  },
  input: {
    height: 48,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  link: {
    marginTop: 20,
    color: '#4F46E5',
    textAlign: 'center',
  },
});
