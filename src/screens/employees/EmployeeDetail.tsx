import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomPicker, { PickerOption } from '../../components/CustomPicker';

type Skill = {
  id: number;
  name: string;
  category: string;
  description?: string;
};

type EmployeeSkill = {
  id: number;
  skillId: number;
  employeeId: number;
  proficiency: number;
  yearsOfExp?: number;
  certified: boolean;
  certDetails?: string;
  lastUsed?: string;
  skill: Skill;
};

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

type EmployeeSkillForm = {
  skillId: number | null;
  proficiency: number;
  yearsOfExp: number;
  certified: boolean;
  certDetails: string;
  lastUsed: string;
};

type EmployeeAssignmentItem = {
  isCompleted: boolean;
  startDate: string;
  endDate: string;
  assignment: {
    id: number;
    name: string;
    difficulty: number;
    content: string;
  };
};

type Assignment = {
  id: number;
  name: string;
  difficulty: number;
  content: string;
};

const proficiencyOptions = [
  { label: '1 - 初心者', value: 1 },
  { label: '2 - 基礎知識あり', value: 2 },
  { label: '3 - 中級者', value: 3 },
  { label: '4 - 上級者', value: 4 },
  { label: '5 - エキスパート', value: 5 },
];

type StatusLabel = '現場' | '内勤' | '研修中' | '現場探し中';

const statusMap: Record<StatusLabel, string> = {
  現場: 'ONSITE',
  内勤: 'OFFICE',
  研修中: 'TRAINING',
  現場探し中: 'SEARCHING',
};

const reverseStatusMap: Record<string, StatusLabel> = Object.fromEntries(
  Object.entries(statusMap).map(([jp, en]) => [en, jp as StatusLabel]),
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
  const employeeId = employee.id;

  const navigationAssign = useNavigation<any>();

  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee>({
    ...employee,
  });
  const [formData, setFormData] = useState<Employee>({ ...employee });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [assignments, setAssignments] = useState<EmployeeAssignmentItem[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const convertStatus = (status: string) => {
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
        return status;
    }
  };

  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<
    { id: number; name: string }[]
  >([]);
  const [skillForm, setSkillForm] = useState<EmployeeSkillForm>({
    skillId: null,
    proficiency: 1,
    yearsOfExp: 0.1,
    certified: false,
    certDetails: '',
    lastUsed: new Date().toISOString().split('T')[0],
  });

  const [yearsOfExpInput, setYearsOfExpInput] = useState(
    String(skillForm.yearsOfExp),
  );

  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    proficiency: '',
    yearsOfExp: '',
    certified: false,
    certDetails: '',
    lastUsed: '',
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
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
      hireDate,
    } = formData;

    const dataToSend = {
      email,
      firstName,
      lastName,
      department,
      position,
      status: statusMap[status as StatusLabel] || status,
      hireDate,
    };

    try {
      const token = await AsyncStorage.getItem('jwtToken');

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employees/${employee.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        },
      );

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
    Alert.alert('確認', 'この社員を本当に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('jwtToken');

            const res = await fetch(
              `https://nextjs-skill-viewer.vercel.app/api/employees/${employee.id}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              },
            );

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
    ]);
  };

  // --- EmployeeSkill取得 ---
  const fetchEmployeeSkills = async () => {
    try {
      setSkillsLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      // 社員詳細から skills.id の一覧を取得
      const resEmp = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employees/${employee.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const employeeData = await resEmp.json();
      const skillIds = employeeData.skills.map((es: any) => es.id);

      // EmployeeSkill を個別取得
      const resSkills = await Promise.all(
        skillIds.map((id: number) =>
          fetch(
            `https://nextjs-skill-viewer.vercel.app/api/employee-skills/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ).then(r => r.json()),
        ),
      );

      setEmployeeSkills(resSkills);
    } catch (err) {
      console.error('EmployeeSkill取得エラー:', err);
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeSkills();
  }, []);

  // 未保有スキルを取得
  useEffect(() => {
    const fetchAvailableSkills = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) return;

        // 1. 社員に紐づくEmployeeSkill.id一覧
        const resEmployeeSkills = await fetch(
          `https://nextjs-skill-viewer.vercel.app/api/employees/${currentEmployee.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const employeeData = await resEmployeeSkills.json();
        const ownedSkillIds = employeeData.skills.map((es: any) => es.skillId);

        // 2. 全スキルから未保有スキルのみ
        const resAllSkills = await fetch(
          'https://nextjs-skill-viewer.vercel.app/api/skills',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const allSkills = await resAllSkills.json();
        const filteredSkills = allSkills.filter(
          (s: any) => !ownedSkillIds.includes(s.id),
        );

        setAvailableSkills(filteredSkills);
      } catch (err) {
        console.error('スキル取得エラー', err);
      }
    };

    if (showAddSkillForm) fetchAvailableSkills();
  }, [showAddSkillForm]);

  const handleAddSkill = async () => {
    if (!skillForm.skillId) {
      Alert.alert('エラー', 'スキルを選択してください');
      return;
    }

    const years = parseFloat(yearsOfExpInput);
    if (isNaN(years)) {
      Alert.alert('エラー', '経験年数には数値を入力してください');
      return;
    }
    if (years < 0.1) {
      Alert.alert('エラー', '経験年数は0.1以上で入力してください');
      return;
    }

    if (!Number.isInteger(years * 10)) {
      Alert.alert('エラー', '経験年数は0.1刻みで入力してください');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/employee-skills',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: currentEmployee.id,
            skillId: skillForm.skillId,
            proficiency: skillForm.proficiency,
            yearsOfExp: skillForm.yearsOfExp,
            certified: skillForm.certified,
            certDetails: skillForm.certified ? skillForm.certDetails : '',
            lastUsed: skillForm.lastUsed,
          }),
        },
      );

      if (!res.ok) {
        throw new Error('追加失敗');
      }

      Alert.alert('成功', 'スキルを追加しました');
      setShowAddSkillForm(false);
      await fetchEmployeeSkills();
    } catch (err) {
      console.error(err);
      Alert.alert('エラー', 'スキル追加中にエラーが発生しました');
    }
  };

  const handleDeleteSkill = (employeeSkillId: number) => {
    Alert.alert(
      '確認',
      'このスキルを本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              if (!token) return;

              const res = await fetch(
                `https://nextjs-skill-viewer.vercel.app/api/employee-skills/${employeeSkillId}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                },
              );

              if (res.ok) {
                // 削除成功 → state から削除
                setEmployeeSkills(prev =>
                  prev.filter(es => es.id !== employeeSkillId),
                );
                Alert.alert('削除成功', 'スキルを削除しました。');
              } else {
                Alert.alert('削除失敗', 'スキルを削除できませんでした。');
              }
            } catch (err) {
              console.error('スキル削除エラー', err);
              Alert.alert('エラー', '削除処理中にエラーが発生しました。');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const startEditingSkill = (skill: any) => {
    setEditingSkillId(skill.id);
    setEditData({
      proficiency: skill.proficiency?.toString() || '',
      yearsOfExp: skill.yearsOfExp?.toString() || '',
      certified: !!skill.certified,
      certDetails: skill.certDetails || '',
      lastUsed: skill.lastUsed ? skill.lastUsed.split('T')[0] : '',
    });
  };

  const handleSaveSkill = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token || editingSkillId === null) return;

      const value = parseFloat(editData.yearsOfExp);

      // 数値かどうかの判定
      if (isNaN(value)) {
        Alert.alert('エラー', '経験年数には数値を入力してください');
        return;
      }

      // 最小値チェック
      if (value < 0.1) {
        Alert.alert('エラー', '経験年数は0.1以上で入力してください');
        return;
      }

      // 0.1刻みチェック
      if (!Number.isInteger(value * 10)) {
        Alert.alert('エラー', '経験年数は0.1刻みで入力してください');
        return;
      }

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employee-skills/${editingSkillId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            proficiency: Number(editData.proficiency),
            yearsOfExp: editData.yearsOfExp
              ? Number(editData.yearsOfExp)
              : null,
            certified: editData.certified,
            certDetails: editData.certified ? editData.certDetails : null,
            lastUsed: editData.lastUsed || null,
          }),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setEmployeeSkills(prev =>
          prev.map(es => (es.id === editingSkillId ? updated : es)),
        );
        setEditingSkillId(null);
        Alert.alert('更新成功', 'スキルを更新しました。');
      } else {
        Alert.alert('更新失敗', 'スキルを更新できませんでした。');
      }
    } catch (err) {
      console.error('スキル更新エラー', err);
      Alert.alert('エラー', '更新処理中にエラーが発生しました。');
    }
  };

  const handleCancelEdit = () => {
    setEditingSkillId(null);
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setError('トークンが見つかりません');
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://nextjs-skill-viewer.vercel.app/api/employee-assignments?employeeId=${employee.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error(`ステータスエラー: ${res.status}`);

        const data = await res.json();
        setAssignments(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [employee.id]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setError('トークンが見つかりません');
        setLoading(false);
        return;
      }

      // 既存の担当課題
      const res1 = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employee-assignments?employeeId=${employee.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res1.ok) throw new Error('担当課題の取得に失敗しました');
      const data1 = await res1.json();

      // 課題一覧
      const res2 = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res2.ok) throw new Error('課題一覧の取得に失敗しました');
      const data2 = await res2.json();

      setAssignments(data1);
      setAllAssignments(data2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignment || !startDate) {
      Alert.alert('エラー', '課題と開始日は必須です');
      return;
    }

    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) throw new Error('トークンがありません');

    try {
      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employee-assignments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId,
            assignmentId: Number(selectedAssignment),
            startDate,
            endDate: endDate || null,
            isCompleted,
          }),
        },
      );

      if (!res.ok) throw new Error('課題の割り当てに失敗しました');

      Alert.alert('成功', '課題を割り当てました');
      setIsAdding(false);
      setSelectedAssignment('');
      setStartDate('');
      setEndDate('');
      setIsCompleted(false);

      fetchAssignments(); // 更新
    } catch (err: any) {
      Alert.alert('エラー', err.message);
    }
  };

  // 自分に割り当て済み課題を除外した選択肢
  const assignedIds = assignments.map(a => a.assignment.id);
  const availableAssignments: PickerOption[] = allAssignments
    .filter(a => !assignedIds.includes(a.id))
    .map(a => ({ label: a.name, value: a.id }));

  const handleDeleteAssignment = (assignmentId: number) => {
    Alert.alert(
      '確認',
      '本当に削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              if (!token) throw new Error('トークンが見つかりません');

              const employeeId = employee.id;

              const res = await fetch(
                `https://nextjs-skill-viewer.vercel.app/api/employee-assignments`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ employeeId, assignmentId }),
                },
              );

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || '削除に失敗しました');
              }

              Alert.alert('成功', '課題を削除しました');
              fetchAssignments(); // リストを更新
            } catch (err: any) {
              Alert.alert('エラー', err.message);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    startDate: '',
    endDate: '',
    isCompleted: false,
  });

  // 編集開始
  const handleEditStart = (item: any) => {
    setEditingId(item.assignment.id);
    setEditForm({
      startDate: item.startDate,
      endDate: item.endDate || '',
      isCompleted: item.isCompleted,
    });
  };

  // 保存処理
  const handleSaveEdit = async (assignmentId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) throw new Error('トークンが見つかりません');

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employee-assignments`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: employee.id,
            assignmentId,
            startDate: editForm.startDate,
            endDate: editForm.endDate || null,
            isCompleted: editForm.isCompleted,
          }),
        },
      );

      if (!res.ok) throw new Error('更新に失敗しました');

      Alert.alert('成功', '課題を更新しました');
      setEditingId(null);
      fetchAssignments();
    } catch (err: any) {
      Alert.alert('エラー', err.message);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
              <Button
                title="編集"
                onPress={() => {
                  setFormData({
                    ...formData,
                    status:
                      reverseStatusMap[formData.status] || formData.status,
                  });
                  setIsEditing(true);
                }}
              />
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
                onChangeText={text => handleChange('lastName', text)}
                placeholder="姓"
              />
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={text => handleChange('firstName', text)}
                placeholder="名"
              />
            </>
          ) : (
            <Text style={styles.value}>
              {currentEmployee.lastName} {currentEmployee.firstName}
            </Text>
          )}

          <Text style={styles.label}>メールアドレス:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={text => handleChange('email', text)}
            />
          ) : (
            <Text style={styles.value}>{currentEmployee.email}</Text>
          )}

          <Text style={styles.label}>部署:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.department}
              onChangeText={text => handleChange('department', text)}
            />
          ) : (
            <Text style={styles.value}>{currentEmployee.department}</Text>
          )}

          <Text style={styles.label}>役職:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.position}
              onChangeText={text => handleChange('position', text)}
            />
          ) : (
            <Text style={styles.value}>{currentEmployee.position}</Text>
          )}

          <Text style={styles.label}>ステータス:</Text>
          {isEditing ? (
            <CustomPicker
              selectedValue={formData.status}
              onSelect={value => handleChange('status', value)}
              options={[
                { label: '現場', value: '現場' },
                { label: '内勤', value: '内勤' },
                { label: '研修中', value: '研修中' },
                { label: '現場探し中', value: '現場探し中' },
              ]}
            />
          ) : (
            <Text style={styles.value}>
              {convertStatus(currentEmployee.status)}
            </Text>
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
                    ? new Date(formData.hireDate).toISOString().split('T')[0]
                    : '入社日を選択'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={
                    formData.hireDate ? new Date(formData.hireDate) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          ) : (
            <Text style={styles.value}>
              {formatDate(currentEmployee.hireDate)}
            </Text>
          )}

          <View style={styles.skillHeaderRow}>
            <Text style={styles.label}>スキル:</Text>
            {!skillsLoading && (
              <TouchableOpacity
                onPress={() => setShowAddSkillForm(!showAddSkillForm)}
              >
                <Text style={styles.addSkillButton}>
                  {showAddSkillForm ? 'キャンセル' : 'スキルを追加'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showAddSkillForm && (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: '#f3f3f3',
                borderRadius: 6,
              }}
            >
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                スキル
              </Text>
              <CustomPicker
                selectedValue={
                  skillForm.skillId !== null ? String(skillForm.skillId) : ''
                }
                onSelect={value =>
                  setSkillForm({ ...skillForm, skillId: Number(value) })
                }
                options={availableSkills.map(s => ({
                  label: s.name,
                  value: s.id,
                }))} // label/value形式に変更
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                習熟度
              </Text>
              <CustomPicker
                selectedValue={
                  skillForm.proficiency !== null
                    ? String(skillForm.proficiency)
                    : ''
                }
                onSelect={value =>
                  setSkillForm({ ...skillForm, proficiency: Number(value) })
                }
                options={proficiencyOptions.map(p => ({
                  label: p.label,
                  value: p.value,
                }))} // label/value形式に変更
              />

              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                経験年数
              </Text>
              <TextInput
                keyboardType="numeric"
                value={yearsOfExpInput}
                onChangeText={setYearsOfExpInput}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 4,
                  padding: 6,
                  marginBottom: 6,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontWeight: 'bold', marginRight: 6 }}>
                  資格あり
                </Text>
                <Switch
                  value={skillForm.certified}
                  onValueChange={val =>
                    setSkillForm({ ...skillForm, certified: val })
                  }
                />
              </View>

              {skillForm.certified && (
                <>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    資格詳細
                  </Text>
                  <TextInput
                    value={skillForm.certDetails}
                    onChangeText={text =>
                      setSkillForm({ ...skillForm, certDetails: text })
                    }
                    style={{
                      borderWidth: 1,
                      borderColor: '#ccc',
                      borderRadius: 4,
                      padding: 6,
                      marginBottom: 6,
                    }}
                  />
                </>
              )}

              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                最終使用日
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 6,
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{skillForm.lastUsed}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(skillForm.lastUsed)}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date)
                      setSkillForm({
                        ...skillForm,
                        lastUsed: date.toISOString().split('T')[0],
                      });
                  }}
                />
              )}

              <Button title="追加" onPress={handleAddSkill} />
            </View>
          )}

          {skillsLoading ? (
            <Text>読み込み中...</Text>
          ) : employeeSkills.length === 0 ? (
            <Text>スキルは登録されていません</Text>
          ) : (
            employeeSkills.map(es => (
              <View key={es.id} style={styles.skillBox}>
                {editingSkillId === es.id ? (
                  // ===== 編集モード =====
                  <>
                    <View style={styles.skillHeader}>
                      <Text style={{ fontWeight: 'bold' }}>
                        {es.skill.name}
                      </Text>
                    </View>

                    <Text style={{ fontWeight: 'bold', marginTop: 6 }}>
                      習熟度
                    </Text>
                    <CustomPicker
                      selectedValue={String(editData.proficiency)}
                      onSelect={value =>
                        setEditData(prev => ({ ...prev, proficiency: value }))
                      }
                      options={proficiencyOptions.map(p => ({
                        label: p.label,
                        value: p.value,
                      }))}
                    />

                    <Text>経験年数</Text>
                    <TextInput
                      style={styles.input}
                      value={editData.yearsOfExp}
                      onChangeText={text =>
                        setEditData(prev => ({ ...prev, yearsOfExp: text }))
                      }
                      keyboardType="numeric"
                    />

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginVertical: 5,
                      }}
                    >
                      <Text>資格あり</Text>
                      <Switch
                        value={editData.certified}
                        onValueChange={val =>
                          setEditData(prev => ({ ...prev, certified: val }))
                        }
                      />
                    </View>

                    {editData.certified && (
                      <>
                        <Text>資格詳細</Text>
                        <TextInput
                          style={styles.input}
                          value={editData.certDetails}
                          onChangeText={text =>
                            setEditData(prev => ({
                              ...prev,
                              certDetails: text,
                            }))
                          }
                        />
                      </>
                    )}

                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      最終使用日
                    </Text>
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 4,
                        padding: 10,
                        marginBottom: 6,
                      }}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text>{editData.lastUsed}</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={new Date(editData.lastUsed)}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowDatePicker(false);
                          if (date)
                            setEditData(prev => ({
                              ...prev,
                              lastUsed: date.toISOString().split('T')[0],
                            }));
                        }}
                      />
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveSkill}
                      >
                        <Text style={styles.saveButtonText}>保存</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.cancelButtonText}>キャンセル</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  // ===== 通常表示モード =====
                  <>
                    <View style={styles.skillHeader}>
                      <Text style={{ fontWeight: 'bold' }}>
                        {es.skill.name}
                      </Text>

                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => startEditingSkill(es)}
                        >
                          <Text style={styles.editButtonText}>修正</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteSkill(es.id)}
                        >
                          <Text style={styles.deleteButtonText}>削除</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.skillCategory}>
                      {es.skill.category}
                    </Text>
                    <Text>習熟度: {es.proficiency}</Text>
                    {es.yearsOfExp !== undefined && (
                      <Text>経験年数: {es.yearsOfExp}</Text>
                    )}
                    {es.certified && <Text>資格: {es.certDetails}</Text>}
                    {es.lastUsed && (
                      <Text>最終使用日: {formatDate(es.lastUsed)}</Text>
                    )}
                  </>
                )}
              </View>
            ))
          )}

          <View style={styles.headerRow}>
            <Text style={styles.label}>担当課題:</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAdding(!isAdding)}
            >
              <Text style={styles.addButtonText}>
                {isAdding ? 'キャンセル' : '課題を割り当て'}
              </Text>
            </TouchableOpacity>
          </View>
          {isAdding && (
            <View style={styles.form}>
              <Text style={styles.formLabel}>課題を選択</Text>
              <CustomPicker
                selectedValue={selectedAssignment}
                onSelect={setSelectedAssignment}
                options={availableAssignments}
              />

              <Text style={styles.formLabel}>開始日</Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 6,
                }}
                onPress={() => setShowStartPicker(true)}
              >
                <Text>{startDate || '選択してください'}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate ? new Date(startDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date.toISOString().split('T')[0]);
                  }}
                />
              )}

              <Text style={styles.formLabel}>終了日</Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 6,
                }}
                onPress={() => setShowEndPicker(true)}
              >
                <Text>{endDate || '選択してください'}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate ? new Date(endDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date.toISOString().split('T')[0]);
                  }}
                />
              )}

              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>完了済み</Text>
                <Switch value={isCompleted} onValueChange={setIsCompleted} />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAssign}
              >
                <Text style={styles.submitButtonText}>割り当て</Text>
              </TouchableOpacity>
            </View>
          )}
          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : error ? (
            <Text style={styles.errorText}>エラー: {error}</Text>
          ) : assignments.length === 0 ? (
            <Text>担当課題はありません</Text>
          ) : (
            assignments.map(item => (
              <View key={item.assignment.id} style={styles.card}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.statusContainer,
                      item.isCompleted
                        ? { backgroundColor: '#DFF6DD' }
                        : { backgroundColor: '#FFF9DB' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.isCompleted
                          ? { color: '#28A745' }
                          : { color: '#FFC107' },
                      ]}
                    >
                      {item.isCompleted ? '完了' : '進行中'}
                    </Text>
                  </View>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={styles.detailButton}
                      onPress={() =>
                        navigationAssign.navigate('AssignmentDetail', {
                          id: item.assignment.id,
                        })
                      }
                    >
                      <Text style={styles.detailButtonText}>詳細</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        editingId === item.assignment.id
                          ? setEditingId(null)
                          : handleEditStart(item)
                      }
                    >
                      <Text style={styles.editButtonText}>
                        {editingId === item.assignment.id
                          ? 'キャンセル'
                          : '編集'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAssignment(item.assignment.id)}
                    >
                      <Text style={styles.deleteButtonText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {editingId === item.assignment.id ? (
                  <>
                    <Text style={styles.formLabel}>開始日</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text>
                        {formatDate(editForm.startDate) || '選択してください'}
                      </Text>
                    </TouchableOpacity>
                    {showStartPicker && (
                      <DateTimePicker
                        value={
                          editForm.startDate
                            ? new Date(editForm.startDate)
                            : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowStartPicker(false);
                          if (date)
                            setEditForm({
                              ...editForm,
                              startDate: date.toISOString().split('T')[0],
                            });
                        }}
                      />
                    )}

                    <Text style={styles.formLabel}>終了日</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text>
                        {formatDate(editForm.endDate) || '選択してください'}
                      </Text>
                    </TouchableOpacity>
                    {showEndPicker && (
                      <DateTimePicker
                        value={
                          editForm.endDate
                            ? new Date(editForm.endDate)
                            : new Date()
                        }
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowEndPicker(false);
                          setEditForm({
                            ...editForm,
                            endDate: date
                              ? date.toISOString().split('T')[0]
                              : '',
                          });
                        }}
                      />
                    )}

                    <View style={styles.checkboxRow}>
                      <Text style={{ marginRight: 8 }}>完了済み</Text>
                      <Switch
                        value={editForm.isCompleted}
                        onValueChange={val =>
                          setEditForm({ ...editForm, isCompleted: val })
                        }
                        thumbColor={
                          editForm.isCompleted ? '#28A745' : '#f4f3f4'
                        }
                        trackColor={{ false: '#ccc', true: '#A5D6A7' }}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => handleSaveEdit(item.assignment.id)}
                    >
                      <Text style={styles.saveButtonText}>保存</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>{item.assignment.name}</Text>
                    <Text style={styles.difficulty}>
                      難易度: {item.assignment.difficulty}
                    </Text>
                    <Text style={styles.content}>
                      {item.assignment.content}
                    </Text>
                    <Text style={styles.date}>
                      期間: {formatDate(item.startDate)} ～{' '}
                      {item.endDate ? formatDate(item.endDate) : '未設定'}
                    </Text>
                  </>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  skillBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f3f3f3',
    borderRadius: 6,
  },
  skillCategory: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
  },
  skillHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  addSkillButton: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 左右に配置
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },

  editButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 4,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#333',
  },
  card: {
    backgroundColor: '#E9F5FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  difficulty: { fontSize: 14, color: '#007BFF', marginBottom: 4 },
  content: { fontSize: 14, color: '#555', marginBottom: 4 },
  date: { fontSize: 12, color: '#777' },
  errorText: { fontSize: 16, color: 'red', marginBottom: 8 },
  statusContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  form: {
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 6,
    backgroundColor: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailButton: {
    backgroundColor: '#17A2B8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 5,
  },
  detailButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8,
  },
});
