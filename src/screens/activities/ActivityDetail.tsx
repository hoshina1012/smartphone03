import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
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

type ActivityDetailRouteProp = RouteProp<RootStackParamList, 'ActivityDetail'>;

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

export default function ActivityDetail() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ActivityDetailRouteProp>();
  const { activity } = route.params;

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

  const activityType = activityTypeMap[activity.type] || activityTypeMap.OTHER;

  const handleEmployeeNavigation = async () => {
    if (!activity.employee) return;

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/employees/${activity.employee.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        throw new Error('従業員情報の取得に失敗しました');
      }

      const fullEmployeeData = await res.json();
      navigation.navigate('EmployeeDetail', { employee: fullEmployeeData });
    } catch (error) {
      console.error('Employee fetch error:', error);
      Alert.alert('エラー', '従業員情報の取得に失敗しました');
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView style={styles.container}>
        {/* アクティビティ一覧に戻るリンク */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← アクティビティ一覧に戻る</Text>
        </TouchableOpacity>

        {/* カード① - 基本情報 */}
        <View style={styles.card}>
          <View style={styles.typeRow}>
            <Text style={[styles.typeBadge, activityType.style]}>
              {activityType.label}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(activity.createdAt)}
            </Text>
          </View>

          <Text style={styles.title}>{activity.title}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>説明</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </View>

          {activity.metadata && (
            <View style={[styles.section]}>
              <Text style={styles.sectionTitle}>追加情報</Text>
              <View style={[styles.metadataSection]}>
                <Text style={styles.metadataText}>
                  {JSON.stringify(activity.metadata, null, 2)}
                </Text>
              </View>
            </View>
          )}

          {activity.employee && (
            <View style={[styles.section]}>
              <Text style={styles.sectionTitle}>関連従業員</Text>
              <View style={[styles.employeeSection]}>
                <TouchableOpacity onPress={handleEmployeeNavigation}>
                  <Text style={styles.employeeName}>
                    {activity.employee.lastName} {activity.employee.firstName}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.employeeEmail}>
                  {activity.employee.email}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* カード② - 実行者情報 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>実行者情報</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>名前:</Text>
            <Text style={styles.detailValue}>{activity.user.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{activity.user.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ユーザーID:</Text>
            <Text style={styles.detailValue}>{activity.user.id}</Text>
          </View>
        </View>

        {/* カード③ - アクティビティ情報 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>アクティビティ情報</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID:</Text>
            <Text style={styles.detailValue}>{activity.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>タイプ:</Text>
            <Text style={styles.detailValue}>{activity.type}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>作成日時:</Text>
            <Text style={styles.detailValue}>
              {formatDate(activity.createdAt)}
            </Text>
          </View>
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  metadataSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
  },
  metadataText: {
    fontSize: 12,
    color: '#92400e',
    fontFamily: 'monospace',
  },
  employeeSection: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 6,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065f46',
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 13,
    color: '#065f46',
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
    width: 100,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
});
