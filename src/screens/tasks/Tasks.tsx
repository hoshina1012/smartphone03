import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
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

  // 統計データの計算（fetchTasks useEffectの後に追加）
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
  const inProgressTasks = tasks.filter(
    task => task.status === 'IN_PROGRESS',
  ).length;
  const overdueTasks = tasks.filter(
    task => task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(),
  ).length;

  const renderItem = ({ item }: { item: Task }) => {
    const isOverdue =
      item.status !== 'COMPLETED' && new Date(item.dueDate) < new Date();
    const cardBackground = isOverdue ? '#ffe5e5' : '#f5f5f5'; // 薄い赤 or 薄いグレー

    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('TaskDetail', { task: item })}
          >
            <Text style={styles.detailButtonText}>詳細</Text>
          </TouchableOpacity>
        </View>

        {/* 期限切れ表示 */}
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
        <Text style={styles.title}>タスク一覧</Text>

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
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
    color: '#dc2626', // 赤色
    backgroundColor: '#fecaca', // 薄い赤背景
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
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
    backgroundColor: '#f3f4f6', // グレー背景
  },
  totalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000', // 黒文字
    marginBottom: 4,
  },
  totalNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  pendingCard: {
    backgroundColor: '#fef3c7', // 薄い黄色背景
  },
  pendingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706', // 黄色文字
    marginBottom: 4,
  },
  pendingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d97706',
  },
  inProgressCard: {
    backgroundColor: '#dbeafe', // 薄い青背景
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb', // 青文字
    marginBottom: 4,
  },
  inProgressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  overdueCard: {
    backgroundColor: '#fee2e2', // 薄い赤背景
  },
  overdueText2: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626', // 赤文字
    marginBottom: 4,
  },
  overdueNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
});
