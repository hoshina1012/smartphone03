import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';
import type { Task } from './Tasks';

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

type TaskDetailRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function TaskDetail() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<TaskDetailRouteProp>();
  const { task } = route.params;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          Alert.alert('エラー', 'トークンがありません');
          return;
        }

        const res = await fetch(
          'https://nextjs-skill-viewer.vercel.app/api/activities',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();

        // taskIdが一致するアクティビティのみフィルタリング
        const taskActivities = (data.activities || []).filter(
          (activity: Activity) => activity.taskId === task.id,
        );
        setActivities(taskActivities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [task.id]);

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

        {/* タスクタイトル */}
        <Text style={styles.taskTitle}>{task.title}</Text>

        {/* カード① - 基本情報 */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, priorityMap[task.priority].style]}>
              {priorityMap[task.priority].label}
            </Text>
            <Text style={[styles.badge, statusMap[task.status].style]}>
              {statusMap[task.status].label}
            </Text>
          </View>
          <Text style={styles.description}>{task.description}</Text>
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
            <Text style={styles.detailValue}>{formatDate(task.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>作成日:</Text>
            <Text style={styles.detailValue}>{formatDate(task.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>更新日:</Text>
            <Text style={styles.detailValue}>{formatDate(task.updatedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>作成者:</Text>
            <Text style={styles.detailValue}>{task.createdBy.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>メール送信:</Text>
            <Text style={styles.detailValue}>
              {task.isSendMail ? '有効' : '無効'}
            </Text>
          </View>
        </View>

        {/* カード④ - 担当者 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>担当者</Text>
          {task.assignments.length > 0 ? (
            task.assignments.map(assignment => (
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
          {task.relatedEmployee ? (
            <View>
              <Text style={styles.employeeName}>
                {task.relatedEmployee.lastName} {task.relatedEmployee.firstName}
              </Text>
              <Text style={styles.employeeEmail}>
                {task.relatedEmployee.email}
              </Text>
            </View>
          ) : (
            <Text style={styles.noEmployee}>関連従業員が設定されていません</Text>
          )}
        </View>

        {/* カード⑥ - タグ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>タグ</Text>
          {task.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {task.tags.map(tag => (
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
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
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