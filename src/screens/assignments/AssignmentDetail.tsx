import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Employee } from '../employees/Employees';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Assignment = {
  id: number;
  name: string;
  content: string;
  difficulty: number;
  createdAt: string;
  updatedAt: string;
};

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

const formatDate2 = (dateString: string) => {
  return new Date(dateString).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AssignmentDetail'
>;

interface EmployeeAssignment {
  id: number;
  employeeId: number;
  assignmentId: number;
  startDate: string;
  endDate: string | null;
  isCompleted: boolean;
  employee: Employee;
}

const AssignmentDetail = () => {
  const route = useRoute<RouteProp<{ params: { id: number } }, 'params'>>();
  const { id } = route.params;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // 編集用のstate
  const [editName, setEditName] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editContent, setEditContent] = useState('');

  const navigation = useNavigation();

  const route2 = useRoute<any>();
  const navigation2 = useNavigation<NavigationProp>();
  const { id: assignmentId } = route2.params;

  const [loading2, setLoading2] = useState(true);
  const [current, setCurrent] = useState<EmployeeAssignment[]>([]);
  const [past, setPast] = useState<EmployeeAssignment[]>([]);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setError('トークンが見つかりません');
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://nextjs-skill-viewer.vercel.app/api/assignments/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          throw new Error(`ステータスエラー: ${res.status}`);
        }

        const data = await res.json();
        setAssignment(data);
        setEditName(data.name);
        setEditDifficulty(String(data.difficulty));
        setEditContent(data.content);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  // 更新処理
  const handleUpdate = async () => {
    if (!editName.trim() || !editDifficulty.trim() || !editContent.trim()) {
      Alert.alert('入力エラー', '全ての項目を入力してください');
      return;
    }

    const difficultyNum = Number(editDifficulty);
    if (
      !Number.isInteger(difficultyNum) ||
      difficultyNum < 1 ||
      difficultyNum > 5
    ) {
      Alert.alert('入力エラー', '難易度は1～5の整数で入力してください');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンが見つかりません');
        return;
      }

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/assignments/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName,
            difficulty: difficultyNum,
            content: editContent,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`更新エラー: ${res.status}`);
      }

      const updated = await res.json();
      setAssignment(updated);
      setEditing(false);
      Alert.alert('成功', '課題を更新しました');
    } catch (err: any) {
      console.error(err);
      Alert.alert('エラー', err.message || '更新に失敗しました');
    }
  };

  // 削除処理
  const handleDelete = async () => {
    Alert.alert('確認', '本当に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('jwtToken');
            if (!token) {
              Alert.alert('エラー', 'トークンが見つかりません');
              return;
            }

            const res = await fetch(
              `https://nextjs-skill-viewer.vercel.app/api/assignments/${id}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              },
            );

            if (!res.ok) throw new Error(`削除エラー: ${res.status}`);

            Alert.alert('成功', '課題を削除しました');
            navigation.goBack(); // 一覧に戻る
          } catch (err: any) {
            console.error(err);
            Alert.alert('エラー', err.message || '削除に失敗しました');
          }
        },
      },
    ]);
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.warn("No token found");
        return;
      }

      // 全社員一覧
      const empRes = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const employees: Employee[] = await empRes.json();

      let allAssignments: EmployeeAssignment[] = [];

      for (const emp of employees) {
        const res = await fetch(
          `https://nextjs-skill-viewer.vercel.app/api/employee-assignments?employeeId=${emp.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) continue;
        const data = await res.json();

        const filtered = data
          .filter((ea: any) => ea.assignmentId === assignmentId)
          .map((ea: any) => ({ ...ea, employee: emp }));

        allAssignments = [...allAssignments, ...filtered];
      }

      setCurrent(allAssignments.filter((a: any) => a.isCompleted === false));
      setPast(allAssignments.filter((a: any) => a.isCompleted === true));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading2(false);
    }
  };

  fetchData();
}, [assignmentId]);


  return (
    <View style={styles.wrapper}>
      <Header />

      <ScrollView style={styles.container}>
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>課題一覧に戻る</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : error ? (
          <Text style={styles.errorText}>エラー: {error}</Text>
        ) : assignment ? (
          <View style={styles.card}>
            {editing ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="課題名"
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="難易度 (1～5)"
                  value={editDifficulty}
                  onChangeText={setEditDifficulty}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  placeholder="内容"
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleUpdate}
                  >
                    <Text style={styles.buttonText}>更新</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditing(false)}
                  >
                    <Text style={styles.buttonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>{assignment.name}</Text>
                <Text style={styles.difficulty}>
                  難易度: {assignment.difficulty}
                </Text>
                <Text style={styles.content}>{assignment.content}</Text>
                <Text style={styles.date}>
                  作成日時: {formatDate(assignment.createdAt)}
                </Text>
                <Text style={styles.date}>
                  更新日時: {formatDate(assignment.updatedAt)}
                </Text>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setEditing(true)}
                  >
                    <Text style={styles.buttonText}>課題を編集</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <Text style={styles.buttonText}>課題を削除</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>データが見つかりません</Text>
        )}
        <Text style={styles.title2}>現在の担当者</Text>
        {loading2 ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : current.length === 0 ? (
          <Text style={styles.noData}>担当者はいません</Text>
        ) : (
          current?.map(item => (
            <View key={`${item.employeeId}-${item.assignmentId}`} style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  navigation2.navigate('EmployeeDetail', {
                    employee: item.employee,
                  })
                }
              >
                <Text style={styles.link}>{item.employee.lastName} {item.employee.firstName}</Text>
              </TouchableOpacity>
              <Text>
                {formatDate2(item.startDate)} ～ {item.endDate ? formatDate2(item.endDate) : '未設定'}

              </Text>
            </View>
          ))
        )}

        <Text style={styles.title2}>過去の担当者</Text>
        {loading2 ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : past.length === 0 ? (
          <Text style={styles.noData}>担当者はいません</Text>
        ) : (
          past?.map(item => (
            <View key={`${item.employeeId}-${item.assignmentId}`} style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  navigation2.navigate('EmployeeDetail', {
                    employee: item.employee,
                  })
                }
              >
                <Text style={styles.link}>{item.employee.lastName} {item.employee.firstName}</Text>
              </TouchableOpacity>
              <Text>
                {formatDate2(item.startDate)} ～ {item.endDate ? formatDate2(item.endDate) : '未設定'}

              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  backContainer: { paddingHorizontal: 5, paddingVertical: 10 },
  backText: { fontSize: 16, color: '#4F46E5', textDecorationLine: 'underline' },
  card: {
    backgroundColor: '#E9F5FF',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  title2: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#333',marginTop: 30 },
  difficulty: { fontSize: 16, color: '#007BFF', marginBottom: 8 },
  content: { fontSize: 16, color: '#555', marginBottom: 12 },
  date: { fontSize: 13, color: '#777', marginBottom: 4 },
  errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginTop: 20 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    padding: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { color: 'blue', textDecorationLine: 'underline', marginBottom: 4 },
  noData: { color: '#666', fontStyle: 'italic' },
});

export default AssignmentDetail;
