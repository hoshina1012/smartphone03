import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';
import type { Task } from './Tasks';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomPicker from '../../components/CustomPicker';

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  metadata: any;
  createdAt: string;
  userId: number;
  taskId: number | null;
  employeeId: number | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  task: {
    id: number;
    title: string;
    status: string;
    priority: string;
  } | null;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

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

type TaskDetailRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export default function TaskDetail() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TaskDetailRouteProp>();
  const initialTask = route.params.task;

  const [currentTask, setCurrentTask] = useState<Task>(initialTask);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // 編集用フォームデータ
  const [editTask, setEditTask] = useState({
    title: currentTask.title,
    description: currentTask.description,
    priority: currentTask.priority as Task['priority'],
    status: currentTask.status as Task['status'],
    dueDate: currentTask.dueDate,
    relatedEmployeeId: currentTask.relatedEmployeeId ? currentTask.relatedEmployeeId.toString() : '',
    assignedUserIds: currentTask.assignments.map(a => a.user.id.toString()),
    selectedTags: currentTask.tags.map(t => t.name),
    isSendMail: currentTask.isSendMail,
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

  const fetchActivities = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/activities?page=1&limit=10000',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();

      const taskActivities = (data.activities || []).filter(
        (activity: Activity) => activity.taskId === currentTask.id,
      );
      setActivities(taskActivities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdatedTask = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/tasks',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      const updatedTask = (data.tasks || []).find((t: Task) => t.id === currentTask.id);
      
      if (updatedTask) {
        setCurrentTask(updatedTask);
        // 編集フォームも更新
        setEditTask({
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority as Task['priority'],
          status: updatedTask.status as Task['status'],
          dueDate: updatedTask.dueDate,
          relatedEmployeeId: updatedTask.relatedEmployeeId ? updatedTask.relatedEmployeeId.toString() : '',
          assignedUserIds: updatedTask.assignments.map((a: { user: { id: number } }) => a.user.id.toString()),
          selectedTags: updatedTask.tags.map((t: { name: string }) => t.name),
          isSendMail: updatedTask.isSendMail,
        });
      }
    } catch (err) {
      console.error('Failed to fetch updated task:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentTask.id]);

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

    if (isEditing) fetchEmployees();
  }, [isEditing]);

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

    if (isEditing) fetchUsers();
  }, [isEditing]);

  // タグ一覧取得
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) return;

        const res = await fetch(
          'https://nextjs-skill-viewer.vercel.app/api/tasks',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        const tasks = data.tasks || [];
        
        const tagMap = new Map<string, Tag>();
        tasks.forEach((t: Task) => {
          t.tags.forEach(tag => {
            if (!tagMap.has(tag.id)) {
              tagMap.set(tag.id, tag);
            }
          });
        });
        setAvailableTags(Array.from(tagMap.values()));
      } catch (err) {
        console.error(err);
      }
    };

    if (isEditing) fetchTags();
  }, [isEditing]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString();
      setEditTask({ ...editTask, dueDate: formattedDate });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '確認',
      'このタスクを削除してもよろしいですか？この操作は取り消せません。',
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
              if (!token) {
                Alert.alert('エラー', 'トークンがありません');
                return;
              }

              const deleteRes = await fetch(
                `https://nextjs-skill-viewer.vercel.app/api/tasks/${currentTask.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (!deleteRes.ok) {
                const errorText = await deleteRes.text();
                throw new Error(`タスク削除に失敗しました: ${errorText}`);
              }

              Alert.alert('成功', 'タスクを削除しました', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('エラー', error.message);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (!editTask.title || !editTask.description || !editTask.dueDate) {
      Alert.alert('エラー', 'タイトル、説明、期限は必須です');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      const taskPayload = {
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        status: editTask.status,
        dueDate: editTask.dueDate,
        relatedEmployeeId: editTask.relatedEmployeeId ? Number(editTask.relatedEmployeeId) : null,
        assignedUserIds: editTask.assignedUserIds.map(id => Number(id)),
        tags: editTask.selectedTags,
        isSendMail: editTask.isSendMail,
      };

      console.log('Sending task update payload:', taskPayload);

      let taskRes = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/tasks/${currentTask.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskPayload),
        },
      );

      // 暫定的な回避策: 1回目失敗したら自動リトライ
      if (!taskRes.ok) {
        const errorText = await taskRes.text();
        console.warn('First attempt failed, retrying after 1 second...', {
          status: taskRes.status,
          error: errorText
        });
        
        // 1秒待ってリトライ
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        taskRes = await fetch(
          `https://nextjs-skill-viewer.vercel.app/api/tasks/${currentTask.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(taskPayload),
          },
        );
      }

      if (!taskRes.ok) {
        const errorText = await taskRes.text();
        console.error('Task update failed after retry:', {
          status: taskRes.status,
          statusText: taskRes.statusText,
          error: errorText
        });
        throw new Error(`タスク更新に失敗しました (${taskRes.status}): ${errorText}`);
      }

      // アクティビティ作成
      const activityPayload = {
        type: 'TASK_UPDATED',
        title: `タスクを更新しました: ${editTask.title}`,
        description: `タスク「${editTask.title}」が更新されました`,
        taskId: currentTask.id,
        employeeId: editTask.relatedEmployeeId ? Number(editTask.relatedEmployeeId) : null,
        metadata: {
          tags: editTask.selectedTags,
          assignedUserIds: editTask.assignedUserIds.map(id => Number(id)),
        },
      };

      await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/activities',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(activityPayload),
        },
      );

      Alert.alert('成功', 'タスクを更新しました');
      setIsEditing(false);

      // タスク情報とアクティビティを再取得
      await fetchUpdatedTask();
      await fetchActivities();

    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView style={styles.container}>
        {/* タスク一覧に戻るリンク */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>タスク一覧に戻る</Text>
        </TouchableOpacity>

        {/* タスクタイトルと編集ボタン */}
        <View style={styles.titleRow}>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.buttonText}>
                {isEditing ? 'キャンセル' : '編集'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.buttonText}>削除</Text>
            </TouchableOpacity>
        </View>

        {/* 編集フォーム */}
        {isEditing && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="タイトル"
              value={editTask.title}
              onChangeText={text => setEditTask({ ...editTask, title: text })}
            />

            <TextInput
              style={styles.textArea}
              placeholder="説明"
              value={editTask.description}
              onChangeText={text => setEditTask({ ...editTask, description: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>優先度</Text>
            <CustomPicker
              selectedValue={editTask.priority}
              onSelect={value => setEditTask({ ...editTask, priority: value as Task['priority'] })}
              options={[
                { label: '低', value: 'LOW' },
                { label: '中', value: 'MEDIUM' },
                { label: '高', value: 'HIGH' },
                { label: '緊急', value: 'URGENT' },
              ]}
            />

            <Text style={styles.label}>ステータス</Text>
            <CustomPicker
              selectedValue={editTask.status}
              onSelect={value => setEditTask({ ...editTask, status: value as Task['status'] })}
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
                {editTask.dueDate ? formatDate(editTask.dueDate) : '期限を選択'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editTask.dueDate ? new Date(editTask.dueDate) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.label}>関連従業員</Text>
            <CustomPicker
              selectedValue={editTask.relatedEmployeeId}
              onSelect={value => setEditTask({ ...editTask, relatedEmployeeId: value })}
              options={[
                { label: '選択してください', value: '' },
                ...employees.map(emp => ({
                  label: `${emp.lastName} ${emp.firstName}`,
                  value: emp.id.toString(),
                })),
              ]}
            />

            <Text style={styles.label}>担当者</Text>
            <TouchableOpacity
              style={styles.selectorBox}
              onPress={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              {editTask.assignedUserIds.length === 0 ? (
                <Text style={styles.placeholder}>担当者を選択してください</Text>
              ) : (
                <View style={styles.selectedTagsContainer}>
                  {editTask.assignedUserIds.map(userId => {
                    const user = users.find(u => u.id.toString() === userId);
                    if (!user) return null;
                    return (
                      <View key={user.id} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{user.name}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            setEditTask({
                              ...editTask,
                              assignedUserIds: editTask.assignedUserIds.filter(
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

            {userDropdownOpen && (
              <View style={styles.dropdown}>
                {users.map(user => {
                  const userId = user.id.toString();
                  const isSelected = editTask.assignedUserIds.includes(userId);
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setEditTask({
                            ...editTask,
                            assignedUserIds: editTask.assignedUserIds.filter(
                              id => id !== userId,
                            ),
                          });
                        } else {
                          setEditTask({
                            ...editTask,
                            assignedUserIds: [
                              ...editTask.assignedUserIds,
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
            <TouchableOpacity
              style={styles.selectorBox}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              {editTask.selectedTags.length === 0 ? (
                <Text style={styles.placeholder}>タグを選択してください</Text>
              ) : (
                <View style={styles.selectedTagsContainer}>
                  {editTask.selectedTags.map(tagName => (
                    <View key={tagName} style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>{tagName}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setEditTask({
                            ...editTask,
                            selectedTags: editTask.selectedTags.filter(
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

            {dropdownOpen && (
              <View style={styles.dropdown}>
                {availableTags.map(tag => {
                  const isSelected = editTask.selectedTags.includes(tag.name);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setEditTask({
                            ...editTask,
                            selectedTags: editTask.selectedTags.filter(
                              t => t !== tag.name,
                            ),
                          });
                        } else {
                          setEditTask({
                            ...editTask,
                            selectedTags: [...editTask.selectedTags, tag.name],
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
                  setEditTask({ ...editTask, isSendMail: !editTask.isSendMail })
                }
              >
                <Text style={styles.checkboxText}>
                  {editTask.isSendMail ? '☑' : '☐'}{' '}
                  期限が近づいた際にメールで通知する
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>タスクを編集</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* カード① - 基本情報 */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, priorityMap[currentTask.priority].style]}>
              {priorityMap[currentTask.priority].label}
            </Text>
            <Text style={[styles.badge, statusMap[currentTask.status].style]}>
              {statusMap[currentTask.status].label}
            </Text>
          </View>
          <Text style={styles.description}>{currentTask.description}</Text>
        </View>

        {/* カード② - アクティビティ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>アクティビティ</Text>
          {loading ? (
            <ActivityIndicator size="small" style={{ marginTop: 10 }} />
          ) : activities.length > 0 ? (
            activities.map(activity => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityUser}>{activity.user.name}</Text>
                  <Text style={styles.activityDate}>
                    {formatDate(activity.createdAt)}
                  </Text>
                </View>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noActivities}>
              このタスクに関するアクティビティはありません
            </Text>
          )}
        </View>

        {/* カード③ - タスク詳細 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>タスク詳細</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>期限:</Text>
            <Text style={styles.detailValue}>{formatDate(currentTask.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>作成日:</Text>
            <Text style={styles.detailValue}>{formatDate(currentTask.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>更新日:</Text>
            <Text style={styles.detailValue}>{formatDate(currentTask.updatedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>作成者:</Text>
            <Text style={styles.detailValue}>{currentTask.createdBy.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>メール送信:</Text>
            <Text style={styles.detailValue}>
              {currentTask.isSendMail ? '有効' : '無効'}
            </Text>
          </View>
        </View>

        {/* カード④ - 担当者 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>担当者</Text>
          {currentTask.assignments.length > 0 ? (
            currentTask.assignments.map(assignment => (
              <View key={assignment.id} style={styles.assignmentItem}>
                <Text style={styles.assignmentName}>
                  {assignment.user.name}
                </Text>
                <Text style={styles.assignmentEmail}>
                  {assignment.user.email}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noAssignments}>担当者が割り当てられていません</Text>
          )}
        </View>

        {/* カード⑤ - 関連従業員 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>関連従業員</Text>
          {currentTask.relatedEmployee ? (
            <View>
              <Text style={styles.employeeName}>
                {currentTask.relatedEmployee.lastName} {currentTask.relatedEmployee.firstName}
              </Text>
              <Text style={styles.employeeEmail}>
                {currentTask.relatedEmployee.email}
              </Text>
            </View>
          ) : (
            <Text style={styles.noEmployee}>関連従業員が設定されていません</Text>
          )}
        </View>

        {/* カード⑥ - タグ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>タグ</Text>
          {currentTask.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {currentTask.tags.map(tag => (
                <Text
                  key={tag.id}
                  style={[
                    styles.tag,
                    { backgroundColor: tag.color || '#8B5CF6' },
                  ]}
                >
                  {tag.name}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.noTags}>タグが設定されていません</Text>
          )}
        </View>
      </ScrollView>
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
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
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
  selectorBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 12,
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
    marginBottom: 12,
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
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  activityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  noActivities: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    width: 80,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  assignmentItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  assignmentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  assignmentEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  noAssignments: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  noEmployee: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noTags: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
});