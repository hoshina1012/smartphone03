import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

type Employee = {
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

const reverseStatusMap: Record<string, StatusLabel> = Object.fromEntries(
  Object.entries(statusMap).map(([jp, en]) => [en, jp as StatusLabel])
);

type RouteParams = {
  EmployeeDetail: {
    employee: Employee;
  };
};

const EmployeeDetail = () => {
  const route = useRoute<RouteProp<RouteParams, 'EmployeeDetail'>>();
  const navigation = useNavigation();
  const { employee } = route.params;

  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>({ ...employee });
  const [formData, setFormData] = useState<Employee>({ ...employee });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const convertStatus = (status: string) => {
    switch (status) {
      case 'ONSITE': return '現場';
      case 'OFFICE': return '内勤';
      case 'TRAINING': return '研修中';
      case 'SEARCHING': return '現場探し中';
      default: return status;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // yyyy-mm-dd
      setFormData({ ...formData, hireDate: formattedDate });
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const handleChange = (key: keyof Employee, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleUpdate = async () => {
    const {
      email,
      firstName,
      lastName,
      department,
      position,
      status,
      hireDate
    } = formData;

    const dataToSend = {
      email,
      firstName,
      lastName,
      department,
      position,
      status: statusMap[status as StatusLabel] || status,
      hireDate
    };

    try {
      const token = await AsyncStorage.getItem('jwtToken');

      const res = await fetch(`https://nextjs-skill-viewer.vercel.app/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.text();
      console.log('Update Status:', res.status);
      console.log('Update Body:', data);

      if (!res.ok) {
        throw new Error('更新に失敗しました');
      }

      Alert.alert('保存完了', '社員情報が更新されました');
      setIsEditing(false);
      setCurrentEmployee(formData);
    } catch (error) {
      Alert.alert('エラー', '更新処理中にエラーが発生しました');
      console.error('Update Error:', error);
    }
  };

  const handleCancel = () => {
    setFormData({ ...employee });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      '確認',
      'この社員を本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');

              const res = await fetch(`https://nextjs-skill-viewer.vercel.app/api/employees/${employee.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await res.text();
              console.log('Delete Status:', res.status);
              console.log('Delete Body:', data);

              if (!res.ok) {
                throw new Error('削除に失敗しました');
              }

              Alert.alert('削除完了', '社員データを削除しました');
              navigation.goBack();
            } catch (error) {
              Alert.alert('エラー', '削除処理中にエラーが発生しました');
              console.error('Delete Error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>社員一覧に戻る</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        {isEditing ? (
          <>
            <Button title="保存" onPress={handleUpdate} />
            <Button title="キャンセル" onPress={handleCancel} color="gray" />
          </>
        ) : (
          <>
            <Button title="編集" onPress={() => setIsEditing(true)} />
            <Button title="削除" color="red" onPress={handleDelete} />
          </>
        )}
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>ID: {currentEmployee.id}</Text>

        <Text style={styles.label}>名前:</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              placeholder="姓"
            />
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              placeholder="名"
            />
          </>
        ) : (
          <Text style={styles.value}>{currentEmployee.lastName} {currentEmployee.firstName}</Text>
        )}

        <Text style={styles.label}>メールアドレス:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
          />
        ) : (
          <Text style={styles.value}>{currentEmployee.email}</Text>
        )}

        <Text style={styles.label}>部署:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.department}
            onChangeText={(text) => handleChange('department', text)}
          />
        ) : (
          <Text style={styles.value}>{currentEmployee.department}</Text>
        )}

        <Text style={styles.label}>役職:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.position}
            onChangeText={(text) => handleChange('position', text)}
          />
        ) : (
          <Text style={styles.value}>{currentEmployee.position}</Text>
        )}

        <Text style={styles.label}>ステータス:</Text>
        {isEditing ? (
          <View style={styles.pickerWrapper}>
    <Picker
      selectedValue={formData.status}
      onValueChange={(value) => handleChange('status', value)}
      style={styles.picker}
    >
      <Picker.Item label="現場" value="現場" />
      <Picker.Item label="内勤" value="内勤" />
      <Picker.Item label="研修中" value="研修中" />
      <Picker.Item label="現場探し中" value="現場探し中" />
    </Picker>
  </View>
        ) : (
          <Text style={styles.value}>{convertStatus(currentEmployee.status)}</Text>
        )}

        <Text style={styles.label}>入社日:</Text>
          {isEditing ? (
            <View>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {formData.hireDate
                    ? new Date(formData.hireDate).toISOString().split('T')[0] // yyyy-mm-dd形式
                    : '入社日を選択'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.hireDate ? new Date(formData.hireDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          ) : (
            <Text style={styles.value}>{formatDate(currentEmployee.hireDate)}</Text>
          )}
      </View>

      <Footer />
    </View>
  );
};

export default EmployeeDetail;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  container: {
    padding: 20,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginBottom: 8,
  },
    pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 8,
  },
  picker: {
    height: 54,
    fontSize: 16,
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
