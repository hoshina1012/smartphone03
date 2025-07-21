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

  const handleSubmit = async () => {
    setMessage('');

    try {
      const response = await fetch('http://192.168.0.64:3000/signup', {
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
        } else {
          setMessage('不明なエラーが発生しました');
        }
      }
    } catch (error) {
      setMessage('サインアップ中にエラーが発生しました');
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
        placeholder="パスワード"
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
