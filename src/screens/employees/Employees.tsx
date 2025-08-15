import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomPicker from '../../components/CustomPicker';

export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: string;
  hireDate: string;
};

type StatusLabel = '現場' | '内勤' | '研修中' | '現場探し中';

const statusMap: Record<StatusLabel, string> = {
  '現場': 'ONSITE',
  '内勤': 'OFFICE',
  '研修中': 'TRAINING',
  '現場探し中': 'SEARCHING',
};

const translateStatus = (status: string): string => {
  switch (status) {
    case 'ONSITE':
      return '現場';
    case 'OFFICE':
      return '内勤';
    case 'TRAINING':
      return '研修中';
    case 'SEARCHING':
      return '現場探し中';
    default:
      return status; // 万が一未定義のステータスが来た場合はそのまま表示
  }
};

const EmployeesScreen = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [newEmployee, setNewEmployee] = useState<{
  email: string;
  lastName: string;
  firstName: string;
  department: string;
  position: string;
  status: string;
  hireDate: string;
}>({
  email: '',
  lastName: '',
  firstName: '',
  department: '',
  position: '',
  status: '現場',
  hireDate: '',
});

const handleDateChange = (event: any, selectedDate?: Date) => {
  setShowDatePicker(false); // カレンダーを閉じる
  if (selectedDate) {
    const formattedDate = selectedDate.toISOString().split('T')[0]; // yyyy-mm-dd
    setNewEmployee({ ...newEmployee, hireDate: formattedDate });
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

useFocusEffect(
  useCallback(() => {
    fetchEmployees();
  }, [])
);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

const fetchEmployees = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setError('トークンが見つかりません');
        return;
      }

      const response = await fetch('https://nextjs-skill-viewer.vercel.app/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ステータスエラー: ${response.status}`);
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    const { email, firstName, lastName, department, position, status, hireDate } = newEmployee;

    if (!email || !firstName || !lastName || !department || !position || !status || !hireDate) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    const emailExists = employees.some((emp) => emp.email === email);
    if (emailExists) {
      Alert.alert('重複エラー', 'このメールアドレスはすでに登録されています');
      return;
    }

    const apiPayload = {
      email,
      firstName,
      lastName,
      department,
      position,
      status: statusMap[status as StatusLabel], // ← ★ここで日本語→Enum形式に変換
      hireDate,
    };

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      const response = await fetch('https://nextjs-skill-viewer.vercel.app/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiPayload),
      });

      console.log('送信するデータ:', apiPayload);


      if (!response.ok) {
        const errorText = await response.text();
        console.error('APIエラー詳細:', errorText);
        throw new Error(`登録失敗: ${response.status} - ${errorText}`);
      }

      Alert.alert('成功', '社員を追加しました');
      setNewEmployee({
        email: '',
        lastName: '',
        firstName: '',
        department: '',
        position: '',
        status: '現場',
        hireDate: '',
      });
      setShowForm(false);
      fetchEmployees();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  const renderItem = ({ item }: { item: Employee }) => (
    <View style={styles.item}>
      <Text>ID: {item.id}</Text>
      <Text>名前: {item.lastName} {item.firstName}</Text>
      <Text>Email: {item.email}</Text>
      <Text>部署: {item.department}</Text>
      <Text>役職: {item.position}</Text>
      <Text>ステータス: {translateStatus(item.status)}</Text>
      <Text>入社日: {formatDate(item.hireDate)}</Text>
      <Button
        title="詳細"
        onPress={() => navigation.navigate('EmployeeDetail', { employee: item })}
      />
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>社員一覧</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addButton}>{showForm ? 'キャンセル' : '社員を追加'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              value={newEmployee.email}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="姓"
              value={newEmployee.lastName}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, lastName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="名"
              value={newEmployee.firstName}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, firstName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="部署"
              value={newEmployee.department}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, department: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="役職"
              value={newEmployee.position}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, position: text })}
            />
            <CustomPicker
              selectedValue={newEmployee.status}
              onSelect={(value) => setNewEmployee({ ...newEmployee, status: value })}
              options={[
                { label: '現場', value: '現場' },
                { label: '内勤', value: '内勤' },
                { label: '研修中', value: '研修中' },
                { label: '現場探し中', value: '現場探し中' },
              ]}
            />
            <View>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {newEmployee.hireDate ? newEmployee.hireDate : '入社日を選択'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newEmployee.hireDate ? new Date(newEmployee.hireDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
            <Button title="保存" onPress={handleSave} />
          </View>
        )}

        {error ? (
          <Text style={styles.error}>エラー: {error}</Text>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />
        )}
      </View>
      <Footer />
    </View>
  );
};

export default EmployeesScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    color: '#4F46E5',
    fontSize: 16,
  },
  item: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  form: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  input: {
    height: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  datePickerButton: {
    height: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
});
