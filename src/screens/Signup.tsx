import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const validate = () => {
    if (name.trim().length === 0) {
      setMessage('名前は1文字以上入力してください');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('正しいメールアドレスを入力してください');
      return false;
    }
    if (password.length < 6) {
      setMessage('パスワードは6文字以上にしてください');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setMessage('');

    if (!validate()) return;

    try {
      const response = await fetch('https://nextjs-skill-viewer.vercel.app/api/smartphone/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('成功', 'アカウント登録に成功しました。ログインしてください。');
        navigation.navigate('Login');
      } else {
        if (typeof data.error === 'string') {
          setMessage(data.error);
          Alert.alert('登録エラー', data.error);
        } else if (data.error?.email?._errors) {
          setMessage(data.error.email._errors[0]);
        } else if (data.error?.password?._errors) {
          setMessage(data.error.password._errors[0]);
        } else if (data.message) {
          setMessage(data.message);
        } else {
          setMessage('不明なエラーが発生しました');
        }
      }
    } catch (error) {
      console.error(error);
      setMessage('サインアップ中にネットワークエラーが発生しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>アカウント登録</Text>

      <TextInput
        style={styles.input}
        placeholder="名前"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="パスワード（6文字以上）"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {message !== '' && <Text style={styles.errorText}>{message}</Text>}

      <Button title="アカウント登録" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});
