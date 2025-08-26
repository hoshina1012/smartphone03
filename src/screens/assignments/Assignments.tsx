import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export type Assignment = {
  id: number;
  name: string;
  content: string;
  difficulty: number;
  createdAt: string;
  updatedAt: string;
};

// 日付を日本時間に整形
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const AssignmentsScreen = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('');
  const [newContent, setNewContent] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigation = useNavigation<any>();

  const fetchAssignments = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setError('トークンが見つかりません');
        setLoading(false);
        return;
      }

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/assignments',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error(`ステータスエラー: ${res.status}`);
      }

      const data = await res.json();
      setAssignments(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useFocusEffect(
  useCallback(() => {
    fetchAssignments();
  }, [])
);

  const handleAddAssignment = async () => {
    if (!newName.trim() || !newDifficulty.trim() || !newContent.trim()) {
      Alert.alert("全ての項目を入力してください");
      return;
    }

    const difficultyNumber = Number(newDifficulty);
    if (!Number.isInteger(difficultyNumber) || difficultyNumber < 1 || difficultyNumber > 5) {
      Alert.alert("難易度は1～5の整数で入力してください");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert("トークンが見つかりません");
        return;
      }

      const res = await fetch('https://nextjs-skill-viewer.vercel.app/api/assignments', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          difficulty: difficultyNumber,
          content: newContent,
        }),
      });

      if (!res.ok) {
        throw new Error(`追加失敗: ${res.status}`);
      }

      setNewName('');
      setNewDifficulty('');
      setNewContent('');
      setIsAdding(false);

      // 成功メッセージを表示
      Alert.alert("課題を追加しました");

      // リスト再取得
      fetchAssignments();
    } catch (err: any) {
      console.error(err);
      Alert.alert("課題の追加に失敗しました");
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header />

      <View style={styles.container}>
        {/* タイトル + ボタン */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>課題一覧</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAdding(!isAdding)}
          >
            <Text style={styles.addButtonText}>
              {isAdding ? "キャンセル" : "新規課題作成"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 新規作成フォーム */}
        {isAdding && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="課題名"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="難易度（1～5）"
              value={newDifficulty}
              onChangeText={setNewDifficulty}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.textarea}
              placeholder="内容"
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleAddAssignment}>
              <Text style={styles.submitButtonText}>追加</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : error ? (
          <Text style={styles.errorText}>エラー: {error}</Text>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.difficulty}>
                  難易度: {item.difficulty}
                </Text>
                <Text style={styles.content}>{item.content}</Text>
                <Text style={styles.date}>
                  作成日時: {formatDate(item.createdAt)}
                </Text>
                <Text style={styles.date}>
                  更新日時: {formatDate(item.updatedAt)}
                </Text>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() =>
                    navigation.navigate('AssignmentDetail', { id: item.id })
                  }
                >
                  <Text style={styles.detailButtonText}>詳細</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  addButton: {
    backgroundColor: "#10B981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  successText: {
    color: "green",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    minHeight: 80,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "bold" },
  item: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  difficulty: { fontSize: 14, color: '#007BFF', marginBottom: 6 },
  content: { fontSize: 14, color: '#555', marginBottom: 6 },
  date: { fontSize: 12, color: '#777' },
  detailButton: {
    backgroundColor: "#007BFF",
    padding: 8,
    marginTop: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  detailButtonText: { color: "#fff", fontWeight: "bold" },
  errorText: {
    fontSize: 16, color: 'red', textAlign: 'center', marginTop: 20,
  },
});

export default AssignmentsScreen;
