import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/Header';
import Footer from '../components/Footer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Dashboard = () => {
  const navigation = useNavigation<NavigationProp>();

  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [skillCount, setSkillCount] = useState<number | null>(null);
  const [employeeSkillCount, setEmployeeSkillCount] = useState<number | null>(null);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingEmployeeSkills, setLoadingEmployeeSkills] = useState(true);

  const [errorEmployees, setErrorEmployees] = useState<string | null>(null);
  const [errorSkills, setErrorSkills] = useState<string | null>(null);
  const [errorEmployeeSkills, setErrorEmployeeSkills] = useState<string | null>(null);

  // 社員数取得
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setErrorEmployees('トークンが見つかりません');
          setLoadingEmployees(false);
          return;
        }

        const res = await fetch('https://nextjs-skill-viewer.vercel.app/api/employees', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`ステータスエラー: ${res.status}`);

        const data = await res.json();
        setEmployeeCount(data.length);
      } catch (err: any) {
        console.error(err);
        setErrorEmployees(err.message);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // スキル数取得
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setErrorSkills('トークンが見つかりません');
          setLoadingSkills(false);
          return;
        }

        const res = await fetch('https://nextjs-skill-viewer.vercel.app/api/skills', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error(`ステータスエラー: ${res.status}`);

        const data = await res.json();
        setSkillCount(data.length);
      } catch (err: any) {
        console.error(err);
        setErrorSkills(err.message);
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchSkills();
  }, []);

  // 社員スキル登録数の合計を取得
  useEffect(() => {
    const fetchAllEmployeeSkills = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) {
          setErrorEmployeeSkills('トークンが見つかりません');
          setLoadingEmployeeSkills(false);
          return;
        }

        // まず社員一覧を取得
        const res = await fetch('https://nextjs-skill-viewer.vercel.app/api/employees', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`社員一覧ステータスエラー: ${res.status}`);

        const employees = await res.json();

        let totalSkills = 0;

        // 各社員の詳細を取得してスキル数を加算
        for (const emp of employees) {
          const resEmp = await fetch(
            `https://nextjs-skill-viewer.vercel.app/api/employees/${emp.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!resEmp.ok) throw new Error(`社員詳細ステータスエラー: ${resEmp.status}`);

          const employeeData = await resEmp.json();
          const skillIds = employeeData.skills.map((es: any) => es.id);

          totalSkills += skillIds.length; // ここで件数を足す
        }

        setEmployeeSkillCount(totalSkills);
      } catch (err: any) {
        console.error(err);
        setErrorEmployeeSkills(err.message);
      } finally {
        setLoadingEmployeeSkills(false);
      }
    };

    fetchAllEmployeeSkills();
  }, []);




  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        {/* 上部ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>社員スキル管理ダッシュボード</Text>
          <Text style={styles.subtitle}>
            社員のスキルと習熟度を一元管理するシステムです
          </Text>
        </View>

        {/* 社員数カード */}
        <View style={styles.card}>
          {loadingEmployees ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : errorEmployees ? (
            <Text style={styles.errorText}>エラー: {errorEmployees}</Text>
          ) : (
            <>
              <Text style={styles.infoText}>社員数: {employeeCount} 人</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Employees')}
              >
                <Text style={styles.buttonText}>社員一覧ページへ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* スキル数カード */}
        <View style={[styles.card, { backgroundColor: '#DFF6DD' }]}>
          {loadingSkills ? (
            <ActivityIndicator size="large" color="#28A745" />
          ) : errorSkills ? (
            <Text style={styles.errorText}>エラー: {errorSkills}</Text>
          ) : (
            <>
              <Text style={[styles.infoText, { color: '#28A745' }]}>スキル数: {skillCount} 件</Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28A745' }]}
                onPress={() => navigation.navigate('Skills')}
              >
                <Text style={styles.buttonText}>スキル一覧ページへ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* スキル登録数カード */}
        <View style={[styles.card, { backgroundColor: '#FFF3CD' }]}>
          {loadingEmployeeSkills ? (
            <ActivityIndicator size="large" color="#FFC107" />
          ) : errorEmployeeSkills ? (
            <Text style={styles.errorText}>エラー: {errorEmployeeSkills}</Text>
          ) : (
            <Text style={[styles.infoText, { color: '#FFC107' }]}>
              スキル登録数: {employeeSkillCount} 件
            </Text>
          )}
        </View>
      </View>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#007BFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#E0F0FF',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Dashboard;
