import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomPicker from '../../components/CustomPicker';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Assignment {
  id: number;
  taskId: number;
  userId: number;
  assignedAt: string;
  user: User;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  completedAt: string | null;
  isSendMail: boolean;
  createdAt: string;
  updatedAt: string;
  relatedEmployeeId: number;
  createdById: number;
  assignments: Assignment[];
  createdBy: User;
  relatedEmployee: Employee;
  tags: Tag[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export default function Tasks() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // フォームデータ
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '',
    relatedEmployeeId: '',
    assignedUserIds: [] as string[],
    selectedTags: [] as string[],
    isSendMail: false,
  });

  // 選択肢データ
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  const priorityMap: Record<Task['priority'], { label: string; style: any }> = {
    LOW: { label: '低', style: { backgroundColor: '#d3d3d3', color: '#000' } },
    MEDIUM: {
      label: '中',
      style: { backgroundColor: '#fff8c2', color: '#ffc107' },
    },
    HIGH: {
      label: '高',
      style: { backgroundColor: '#ffe5b4', color: '#ff8c00' },
    },
    URGENT: {
      label: '緊急',
      style: { backgroundColor: '#ffc2c2', color: '#ff0000' },
    },
  };

  const statusMap: Record<Task['status'], { label: string; style: any }> = {
    PENDING: {
      label: '未対応',
      style: { backgroundColor: '#d3d3d3', color: '#000' },
    },
    IN_PROGRESS: {
      label: '進行中',
      style: { backgroundColor: '#cce5ff', color: '#007bff' },
    },
    COMPLETED: {
      label: '完了',
      style: { backgroundColor: '#d4edda', color: '#28a745' },
    },
    CANCELLED: {
      label: 'キャンセル',
      style: { backgroundColor: '#fee2e2', color: '#dc2626' },
    },
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          Alert.alert('エラー', 'トークンがありません');
          return;
        }

        const res = await fetch(
          'https://nextjs-skill-viewer.vercel.app/api/tasks',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // 従業員一覧取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) return;

        const res = await fetch(
          'https://nextjs-skill-viewer.vercel.app/api/employees',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        setEmployees(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (showForm) fetchEmployees();
  }, [showForm]);

  // ユーザー一覧取得
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) return;

        const res = await fetch(
          'https://nextjs-skill-viewer.vercel.app/api/users',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (showForm) fetchUsers();
  }, [showForm]);

  // タグ一覧取得（既存タスクから抽出）
  useEffect(() => {
    if (showForm && tasks.length > 0) {
      const tagMap = new Map<string, Tag>();
      tasks.forEach(task => {
        task.tags.forEach(tag => {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, tag);
          }
        });
      });
      setAvailableTags(Array.from(tagMap.values()));
    }
  }, [showForm, tasks]);

  // 統計データの計算
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
  const inProgressTasks = tasks.filter(
    task => task.status === 'IN_PROGRESS',
  ).length;
  const overdueTasks = tasks.filter(
    task => task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(),
  ).length;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString();
      setNewTask({ ...newTask, dueDate: formattedDate });
    }
  };

  const handleSave = async () => {
    if (!newTask.title || !newTask.description || !newTask.dueDate) {
      Alert.alert('エラー', 'タイトル、説明、期限は必須です');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      // タスク作成（APIがアクティビティも自動作成するため、手動作成は不要）
      const taskPayload = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: newTask.status,
        dueDate: newTask.dueDate,
        relatedEmployeeId: newTask.relatedEmployeeId
          ? Number(newTask.relatedEmployeeId)
          : null,
        assignedUserIds: newTask.assignedUserIds.map(id => Number(id)),
        tags: newTask.selectedTags,
        isSendMail: newTask.isSendMail,
      };

      const taskRes = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/tasks',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskPayload),
        },
      );

      if (!taskRes.ok) {
        throw new Error('タスク作成に失敗しました');
      }

      Alert.alert('成功', 'タスクを作成しました');

      // フォームリセット
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: '',
        relatedEmployeeId: '',
        assignedUserIds: [],
        selectedTags: [],
        isSendMail: false,
      });
      setShowForm(false);

      // タスク一覧を再取得
      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/tasks',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  const renderItem = ({ item }: { item: Task }) => {
    const isOverdue =
      item.status !== 'COMPLETED' && new Date(item.dueDate) < new Date();
    const cardBackground = isOverdue ? '#ffe5e5' : '#f5f5f5';

    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <View style={styles.titleRow}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('TaskDetail', { task: item })}
          >
            <Text style={styles.detailButtonText}>詳細</Text>
          </TouchableOpacity>
        </View>

        {isOverdue && (
          <View style={styles.overdueContainer}>
            <Text style={styles.overdueText}>期限切れ</Text>
          </View>
        )}

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.row}>
          <Text style={[styles.badge, priorityMap[item.priority].style]}>
            {priorityMap[item.priority].label}
          </Text>
          <Text style={[styles.badge, statusMap[item.status].style]}>
            {statusMap[item.status].label}
          </Text>
        </View>

        <Text>期限: {formatDate(item.dueDate)}</Text>
        <Text>作成者: {item.createdBy?.name}</Text>
        <Text>
          担当者:{' '}
          {item.assignments.map(a => a.user.name).join(', ') || '未割当'}
        </Text>
        <Text>
          関連従業員:{' '}
          {item.relatedEmployee
            ? `${item.relatedEmployee.lastName} ${item.relatedEmployee.firstName}`
            : '未設定'}
        </Text>

        <View style={styles.tagsRow}>
          {item.tags.length > 0 ? (
            item.tags.map(tag => (
              <Text
                key={tag.id}
                style={[
                  styles.tag,
                  { backgroundColor: tag.color || '#8B5CF6' },
                ]}
              >
                {tag.name}
              </Text>
            ))
          ) : (
            <Text>タグなし</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>タスク一覧</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addButton}>
              {showForm ? 'キャンセル' : '新規タスク作成'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 新規作成フォーム */}
        {showForm && (
          <ScrollView style={styles.form} nestedScrollEnabled>
            <TextInput
              style={styles.input}
              placeholder="タイトル"
              value={newTask.title}
              onChangeText={text => setNewTask({ ...newTask, title: text })}
            />

            <TextInput
              style={styles.textArea}
              placeholder="説明"
              value={newTask.description}
              onChangeText={text =>
                setNewTask({ ...newTask, description: text })
              }
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>優先度</Text>
            <CustomPicker
              selectedValue={newTask.priority}
              onSelect={value => setNewTask({ ...newTask, priority: value })}
              options={[
                { label: '低', value: 'LOW' },
                { label: '中', value: 'MEDIUM' },
                { label: '高', value: 'HIGH' },
                { label: '緊急', value: 'URGENT' },
              ]}
            />

            <Text style={styles.label}>ステータス</Text>
            <CustomPicker
              selectedValue={newTask.status}
              onSelect={value => setNewTask({ ...newTask, status: value })}
              options={[
                { label: '未対応', value: 'PENDING' },
                { label: '進行中', value: 'IN_PROGRESS' },
                { label: '完了', value: 'COMPLETED' },
                { label: 'キャンセル', value: 'CANCELLED' },
              ]}
            />

            <Text style={styles.label}>期限</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {newTask.dueDate ? formatDate(newTask.dueDate) : '期限を選択'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={newTask.dueDate ? new Date(newTask.dueDate) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>関連従業員</Text>
            <CustomPicker
              selectedValue={newTask.relatedEmployeeId}
              onSelect={value =>
                setNewTask({ ...newTask, relatedEmployeeId: value })
              }
              options={[
                { label: '選択してください', value: '' },
                ...employees.map(emp => ({
                  label: `${emp.lastName} ${emp.firstName}`,
                  value: emp.id.toString(),
                })),
              ]}
            />

            <Text style={styles.label}>担当者</Text>
            {/* 選択欄 */}
            <TouchableOpacity
              style={styles.selectorBox}
              onPress={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              {newTask.assignedUserIds.length === 0 ? (
                <Text style={styles.placeholder}>担当者を選択してください</Text>
              ) : (
                <View style={styles.selectedTagsContainer}>
                  {newTask.assignedUserIds.map(userId => {
                    const user = users.find(u => u.id.toString() === userId);
                    if (!user) return null;
                    return (
                      <View key={user.id} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{user.name}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            setNewTask({
                              ...newTask,
                              assignedUserIds: newTask.assignedUserIds.filter(
                                id => id !== userId,
                              ),
                            })
                          }
                        >
                          <Text style={styles.removeTag}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>

            {/* ドロップダウン */}
            {userDropdownOpen && (
              <View style={styles.dropdown}>
                {users.map(user => {
                  const userId = user.id.toString();
                  const isSelected = newTask.assignedUserIds.includes(userId);
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setNewTask({
                            ...newTask,
                            assignedUserIds: newTask.assignedUserIds.filter(
                              id => id !== userId,
                            ),
                          });
                        } else {
                          setNewTask({
                            ...newTask,
                            assignedUserIds: [
                              ...newTask.assignedUserIds,
                              userId,
                            ],
                          });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          isSelected && styles.dropdownTextSelected,
                        ]}
                      >
                        {user.name} ({user.email})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>タグ</Text>
            {/* 選択欄 */}
            <TouchableOpacity
              style={styles.selectorBox}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              {newTask.selectedTags.length === 0 ? (
                <Text style={styles.placeholder}>タグを選択してください</Text>
              ) : (
                <View style={styles.selectedTagsContainer}>
                  {newTask.selectedTags.map(tagName => (
                    <View key={tagName} style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>{tagName}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setNewTask({
                            ...newTask,
                            selectedTags: newTask.selectedTags.filter(
                              t => t !== tagName,
                            ),
                          })
                        }
                      >
                        <Text style={styles.removeTag}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            {/* ドロップダウン */}
            {dropdownOpen && (
              <View style={styles.dropdown}>
                {availableTags.map(tag => {
                  const isSelected = newTask.selectedTags.includes(tag.name);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setNewTask({
                            ...newTask,
                            selectedTags: newTask.selectedTags.filter(
                              t => t !== tag.name,
                            ),
                          });
                        } else {
                          setNewTask({
                            ...newTask,
                            selectedTags: [...newTask.selectedTags, tag.name],
                          });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          isSelected && styles.dropdownTextSelected,
                        ]}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setNewTask({ ...newTask, isSendMail: !newTask.isSendMail })
                }
              >
                <Text style={styles.checkboxText}>
                  {newTask.isSendMail ? '☑' : '☐'}{' '}
                  期限が近づいた際にメールで通知する
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>タスクを作成</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* 統計情報 */}
        {!loading && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.totalCard]}>
              <Text style={styles.totalText}>総タスク数</Text>
              <Text style={styles.totalNumber}>{totalTasks}</Text>
            </View>

            <View style={[styles.statCard, styles.pendingCard]}>
              <Text style={styles.pendingText}>未対応</Text>
              <Text style={styles.pendingNumber}>{pendingTasks}</Text>
            </View>

            <View style={[styles.statCard, styles.inProgressCard]}>
              <Text style={styles.inProgressText}>進行中</Text>
              <Text style={styles.inProgressNumber}>{inProgressTasks}</Text>
            </View>

            <View style={[styles.statCard, styles.overdueCard]}>
              <Text style={styles.overdueText2}>期限切れ</Text>
              <Text style={styles.overdueNumber}>{overdueTasks}</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 60 }}
          />
        )}
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  multiSelectContainer: {
    marginBottom: 12,
  },
  multiSelectItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  multiSelectItemSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  multiSelectText: {
    fontSize: 14,
    color: '#374151',
  },
  multiSelectTextSelected: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  input: {
    height: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  datePickerButton: {
    height: 44,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  checkboxRow: {
    marginVertical: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
  },
  description: { marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  detailButton: {
    backgroundColor: '#007bff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  detailButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overdueContainer: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    backgroundColor: '#fecaca',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalCard: {
    backgroundColor: '#f3f4f6',
  },
  totalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  totalNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  pendingCard: {
    backgroundColor: '#fef3c7',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: 4,
  },
  pendingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d97706',
  },
  inProgressCard: {
    backgroundColor: '#dbeafe',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  inProgressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  overdueCard: {
    backgroundColor: '#fee2e2',
  },
  overdueText2: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  overdueNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  selectorBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  placeholder: {
    color: '#999',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  selectedTagText: {
    color: '#2563eb',
    fontWeight: 'bold',
    marginRight: 4,
  },
  removeTag: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemSelected: {
    backgroundColor: '#dbeafe',
  },
  dropdownText: {
    color: '#111',
  },
  dropdownTextSelected: {
    fontWeight: 'bold',
    color: '#2563eb',
  },
});
