import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

export type Company = {
  id: number;
  name: string;
  industry: string;
  size: string;
  website: string;
  createdAt: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/companies',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [])
  );

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>企業一覧</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={companies}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() =>
                      navigation.navigate('CompanyDetail', { company: item })
                    }
                  >
                    <Text style={styles.detailText}>詳細</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => Linking.openURL(item.website)}>
                  <Text style={styles.link}>{item.website}</Text>
                </TouchableOpacity>
                <Text style={styles.text}>業界: {item.industry}</Text>
                <Text style={styles.text}>規模: {item.size}</Text>
                <Text style={styles.date}>
                  登録日: {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                </Text>
              </View>
            )}
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
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  detailText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  link: {
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
