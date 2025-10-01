import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CustomPicker from "../../components/CustomPicker";

type Company = {
  id: number;
  name: string;
  website: string;
  industry: string;
  size: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  company: Company;
};

export default function CustomerDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialCustomer = route.params.customer;

  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [isEditing, setIsEditing] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // 編集用フォームデータ
  const [editCustomer, setEditCustomer] = useState({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    position: customer.position,
    department: customer.department,
    notes: customer.notes,
    companyId: customer.company.id.toString(),
  });

  // 企業一覧を取得
  useEffect(() => {
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

    if (isEditing) fetchCompanies();
  }, [isEditing]);

  // 顧客情報を再取得
  const fetchUpdatedCustomer = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const res = await fetch(
        'https://nextjs-skill-viewer.vercel.app/api/customers',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      const updatedCustomer = data.find((c: Customer) => c.id === customer.id);

      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        // 編集フォームも更新
        setEditCustomer({
          name: updatedCustomer.name,
          email: updatedCustomer.email,
          phone: updatedCustomer.phone,
          position: updatedCustomer.position,
          department: updatedCustomer.department,
          notes: updatedCustomer.notes,
          companyId: updatedCustomer.company.id.toString(),
        });
      }
    } catch (err) {
      console.error('Failed to fetch updated customer:', err);
    }
  };

  const handleSave = async () => {
    // バリデーション
    if (!editCustomer.name || !editCustomer.email || !editCustomer.companyId) {
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
        name: editCustomer.name,
        email: editCustomer.email,
        phone: editCustomer.phone,
        position: editCustomer.position,
        department: editCustomer.department,
        notes: editCustomer.notes,
        companyId: Number(editCustomer.companyId),
      };

      const res = await fetch(
        `https://nextjs-skill-viewer.vercel.app/api/customers/${customer.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`顧客更新に失敗しました: ${errorText}`);
      }

      Alert.alert('成功', '顧客情報を更新しました');
      setIsEditing(false);

      // 顧客情報を再取得
      await fetchUpdatedCustomer();
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    }
  };

  const handleDelete = async () => {
  Alert.alert(
    "確認",
    "本当にこの顧客を削除しますか？",
    [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("jwtToken");
            if (!token) {
              Alert.alert("エラー", "トークンがありません");
              return;
            }

            const res = await fetch(
              `https://nextjs-skill-viewer.vercel.app/api/customers/${customer.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`削除に失敗しました: ${errorText}`);
            }

            Alert.alert("成功", "顧客を削除しました");
            navigation.goBack(); // 一覧に戻る
          } catch (error: any) {
            Alert.alert("エラー", error.message);
          }
        },
      },
    ]
  );
};


  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>顧客一覧に戻る</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => setIsEditing(!isEditing)}
    >
      <Text style={styles.editButtonText}>
        {isEditing ? "キャンセル" : "編集"}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.deleteButton}
      onPress={handleDelete}
    >
      <Text style={styles.deleteButtonText}>削除</Text>
    </TouchableOpacity>
  </View>
        </View>

        {/* 編集フォーム */}
        {isEditing && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>顧客情報を編集</Text>

            <Text style={styles.label}>名前 *</Text>
            <TextInput
              style={styles.input}
              placeholder="田中太郎"
              value={editCustomer.name}
              onChangeText={text => setEditCustomer({ ...editCustomer, name: text })}
            />

            <Text style={styles.label}>メールアドレス *</Text>
            <TextInput
              style={styles.input}
              placeholder="tanaka@example.com"
              value={editCustomer.email}
              onChangeText={text => setEditCustomer({ ...editCustomer, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>企業 *</Text>
            <CustomPicker
              selectedValue={editCustomer.companyId}
              onSelect={value => setEditCustomer({ ...editCustomer, companyId: value })}
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
              value={editCustomer.phone}
              onChangeText={text => setEditCustomer({ ...editCustomer, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>役職</Text>
            <TextInput
              style={styles.input}
              placeholder="CTO"
              value={editCustomer.position}
              onChangeText={text => setEditCustomer({ ...editCustomer, position: text })}
            />

            <Text style={styles.label}>部署</Text>
            <TextInput
              style={styles.input}
              placeholder="技術開発部"
              value={editCustomer.department}
              onChangeText={text =>
                setEditCustomer({ ...editCustomer, department: text })
              }
            />

            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={styles.textArea}
              placeholder="システム開発の責任者"
              value={editCustomer.notes}
              onChangeText={text => setEditCustomer({ ...editCustomer, notes: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        )}

        {customer ? (
          <View style={styles.card}>
            {/* 名前は大きく表示 */}
            <Text style={styles.name}>{customer.name}</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>メールアドレス：</Text>
              <Text style={styles.value}>{customer.email}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>企業：</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("CompanyDetail", {
                    company: customer.company,
                  })
                }
              >
                <Text style={styles.link}>{customer.company.name}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>電話番号：</Text>
              <Text style={styles.value}>{customer.phone}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>役職：</Text>
              <Text style={styles.value}>{customer.position}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>部署：</Text>
              <Text style={styles.value}>{customer.department}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>メモ：</Text>
              <Text style={styles.value}>{customer.notes}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>登録日：</Text>
              <Text style={styles.value}>
                {new Date(customer.createdAt).toLocaleDateString("ja-JP")}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>更新日：</Text>
              <Text style={styles.value}>
                {new Date(customer.updatedAt).toLocaleDateString("ja-JP")}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.error}>顧客情報を取得できませんでした。</Text>
        )}
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    textDecorationLine: 'underline',
  },
  editButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
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
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  rowLabel: {
    width: 120,
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    flexShrink: 1,
  },
  link: {
    fontSize: 14,
    color: "#2563eb",
    textDecorationLine: "underline",
  },
  error: {
    color: "red",
    marginTop: 20,
  },
  actionButtons: {
  flexDirection: "row",
  alignItems: "center",
},
deleteButton: {
  backgroundColor: "#DC2626",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  marginLeft: 8,
},
deleteButtonText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "bold",
},

});