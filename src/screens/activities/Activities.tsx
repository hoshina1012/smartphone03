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

export default function Activities() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const [stats, setStats] = useState({
  total: 0,
  taskRelated: 0,
  today: 0,
});

  const activityTypeMap: Record<string, { label: string; style: any }> = {
    TASK_CREATED: {
      label: 'タスク作成',
      style: { backgroundColor: '#dbeafe', color: '#2563eb' },
    },
    TASK_UPDATED: {
      label: 'タスク更新',
      style: { backgroundColor: '#fef3c7', color: '#d97706' },
    },
    TASK_COMPLETED: {
      label: 'タスク完了',
      style: { backgroundColor: '#d1fae5', color: '#059669' },
    },
    USER_LOGIN: {
      label: 'ログイン',
      style: { backgroundColor: '#fed7aa', color: '#ea580c' },
    },
    USER_LOGOUT: {
      label: 'ログアウト',
      style: { backgroundColor: '#fed7aa', color: '#ea580c' },
    },
    TASK_ASSIGNED: {
      label: 'タスク割り当て',
      style: { backgroundColor: '#e9d5ff', color: '#9333ea' },
    },
    OTHER: {
      label: 'その他',
      style: { backgroundColor: '#d1d5db', color: '#000' },
    },
  };

  const fetchStats = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    const res = await fetch(
      `https://nextjs-skill-viewer.vercel.app/api/activities?page=1&limit=10000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    const all = data.activities || [];

    const taskRelatedTypes = ["TASK_CREATED", "TASK_UPDATED", "TASK_COMPLETED", "TASK_ASSIGNED"];
    const taskRelated = all.filter((a: Activity) => taskRelatedTypes.includes(a.type)).length;

    const todayString = new Date().toISOString().split("T")[0];
    const today = all.filter(
      (a: Activity) => new Date(a.createdAt).toISOString().split("T")[0] === todayString
    ).length;

    setStats({
      total: data.pagination?.total ?? all.length,
      taskRelated,
      today,
    });

  } catch (err) {
    console.error(err);
  }
};

  const fetchActivities = async (pageNum = 1) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("エラー", "トークンがありません");
        return;
      }

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/activities?page=${pageNum}&pageSize=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      setActivities(data.activities || []);

      if (data.pagination) {
        const { total, limit } = data.pagination;
        setTotalPages(Math.ceil(total / limit));
      } else {
        // pagination が無い場合は仮に totalPages を判定
        setTotalPages(data.activities.length < pageSize ? pageNum : pageNum + 1);
      }

      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1);
  fetchStats();
  }, []);

  const renderItem = ({ item }: { item: Activity }) => {
    const activityType = activityTypeMap[item.type] || activityTypeMap.OTHER;
    
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={[styles.typeBadge, activityType.style]}>
            {activityType.label}
          </Text>
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Text>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
          >
            <Text style={styles.detailButtonText}>詳細</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.userText}>
            実行者: {item.user.name}
          </Text>
          {item.employee && (
            <Text style={styles.employeeText}>
              関連従業員: {item.employee.lastName} {item.employee.firstName}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>アクティビティ一覧</Text>
        
        {/* 統計情報 */}
        <View style={styles.statsContainer}>
  <View style={[styles.statCard, styles.totalCard]}>
    <Text style={styles.totalText}>総アクティビティ数</Text>
    <Text style={styles.totalNumber}>{stats.total}</Text>
  </View>
  
  <View style={[styles.statCard, styles.taskCard]}>
    <Text style={styles.taskText}>タスク関連</Text>
    <Text style={styles.taskNumber}>{stats.taskRelated}</Text>
  </View>
  
  <View style={[styles.statCard, styles.todayCard]}>
    <Text style={styles.todayText}>今日のアクティビティ</Text>
    <Text style={styles.todayNumber}>{stats.today}</Text>
  </View>
</View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <>
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 60 }}
            />

            {/* ページネーション操作 */}
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => fetchActivities(page - 1)}
                style={[
                  styles.pageButton,
                  page === 1 && styles.disabledButton,
                ]}
              >
                <Text style={styles.pageButtonText}>前へ</Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                {page} / {totalPages}
              </Text>

              <TouchableOpacity
                disabled={page === totalPages}
                onPress={() => fetchActivities(page + 1)}
                style={[
                  styles.pageButton,
                  page === totalPages && styles.disabledButton,
                ]}
              >
                <Text style={styles.pageButtonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          </>
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
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalCard: {
    backgroundColor: '#f3f4f6',
  },
  totalText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  totalNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  taskCard: {
    backgroundColor: '#dbeafe',
  },
  taskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
    textAlign: 'center',
  },
  taskNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  todayCard: {
    backgroundColor: '#d1fae5',
  },
  todayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
    textAlign: 'center',
  },
  todayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
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
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsRow: {
    gap: 4,
  },
  userText: {
    fontSize: 13,
    color: '#6b7280',
  },
  employeeText: {
    fontSize: 13,
    color: '#6b7280',
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginVertical: 16,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#2563eb",
    borderRadius: 4,
  },
  pageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
});