import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CustomPicker from '../../components/CustomPicker';

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigation = useNavigation<any>();

  // 新規顧客フォームのデータ
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    notes: '',
    companyId: '',
  });

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

  const fetchCompanies = async () => {
    try {
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, []),
  );

  // フォームを開いたときに企業一覧を取得
  const handleToggleForm = () => {
    if (!showForm) {
      fetchCompanies();
    }
    setShowForm(!showForm);
  };

  const handleSave = async () => {
    // バリデーション
    if (!newCustomer.name || !newCustomer.email || !newCustomer.companyId) {
      Alert.alert('エラー', '名前、メールアドレス、企業は必須です');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      const payload = {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        position: newCustomer.position,
        department: newCustomer.department,
        notes: newCustomer.notes,
        companyId: Number(newCustomer.companyId),
      };

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/customers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`顧客作成に失敗しました: ${errorText}`);
      }

      Alert.alert('成功', '顧客を追加しました');

      // フォームリセット
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        notes: '',
        companyId: '',
      });
      setShowForm(false);

      // 顧客一覧を再取得
      await fetchCustomers();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>顧客一覧</Text>
          <TouchableOpacity onPress={handleToggleForm}>
            <Text style={styles.addButton}>
              {showForm ? 'キャンセル' : '顧客を追加'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 新規顧客追加フォーム */}
        {showForm && (
          <ScrollView style={styles.form} nestedScrollEnabled>
            <Text style={styles.formTitle}>新しい顧客を追加</Text>

            <Text style={styles.label}>名前 *</Text>
            <TextInput
              style={styles.input}
              placeholder="田中太郎"
              value={newCustomer.name}
              onChangeText={text => setNewCustomer({ ...newCustomer, name: text })}
            />

            <Text style={styles.label}>メールアドレス *</Text>
            <TextInput
              style={styles.input}
              placeholder="tanaka@example.com"
              value={newCustomer.email}
              onChangeText={text => setNewCustomer({ ...newCustomer, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>企業 *</Text>
            <CustomPicker
              selectedValue={newCustomer.companyId}
              onSelect={value => setNewCustomer({ ...newCustomer, companyId: value })}
              options={[
                { label: '選択してください', value: '' },
                ...companies.map(company => ({
                  label: company.name,
                  value: company.id.toString(),
                })),
              ]}
            />

            <Text style={styles.label}>電話番号</Text>
            <TextInput
              style={styles.input}
              placeholder="03-1234-5678"
              value={newCustomer.phone}
              onChangeText={text => setNewCustomer({ ...newCustomer, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>役職</Text>
            <TextInput
              style={styles.input}
              placeholder="CTO"
              value={newCustomer.position}
              onChangeText={text => setNewCustomer({ ...newCustomer, position: text })}
            />

            <Text style={styles.label}>部署</Text>
            <TextInput
              style={styles.input}
              placeholder="技術開発部"
              value={newCustomer.department}
              onChangeText={text =>
                setNewCustomer({ ...newCustomer, department: text })
              }
            />

            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={styles.textArea}
              placeholder="システム開発の責任者"
              value={newCustomer.notes}
              onChangeText={text => setNewCustomer({ ...newCustomer, notes: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

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
                  <Text style={styles.rowLabel}>電話番号：</Text>
                  <Text style={styles.value}>{item.phone}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>メール：</Text>
                  <Text style={styles.value}>{item.email}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>企業：</Text>
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
                  <Text style={styles.rowLabel}>役職：</Text>
                  <Text style={styles.value}>{item.position}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>部署：</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
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
    maxHeight: 400,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
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
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  rowLabel: {
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