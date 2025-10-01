import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export type Company = {
  id: number;
  name: string;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  company: Company;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/customers',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, []),
  );

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>顧客一覧</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <FlatList
            data={customers}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() =>
                      navigation.navigate('CustomerDetail', { customer: item })
                    }
                  >
                    <Text style={styles.detailButtonText}>詳細</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>電話番号：</Text>
                  <Text style={styles.value}>{item.phone}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>メール：</Text>
                  <Text style={styles.value}>{item.email}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>企業：</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CompanyDetail', {
                        company: item.company,
                      })
                    }
                  >
                    <Text style={styles.link}>{item.company.name}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>役職：</Text>
                  <Text style={styles.value}>{item.position}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>部署：</Text>
                  <Text style={styles.value}>{item.department}</Text>
                </View>
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
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
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
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontSize: 14,
    color: '#374151',
  },
  value: {
    fontSize: 14,
    color: '#111827',
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});
