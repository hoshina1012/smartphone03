import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import Footer from '../components/Footer';

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: string;
};

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchEmployees();
  }, []);

  const renderItem = ({ item }: { item: Employee }) => (
    <View style={styles.item}>
      <Text>ID: {item.id}</Text>
      <Text>名前: {item.lastName} {item.firstName}</Text>
      <Text>Email: {item.email}</Text>
      <Text>部署: {item.department}</Text>
      <Text>役職: {item.position}</Text>
      <Text>ステータス: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
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

export default Dashboard;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
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
});
