import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

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
  const { customer } = route.params;

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>顧客一覧に戻る</Text>
        </TouchableOpacity>

        {customer ? (
          <View style={styles.card}>
            {/* 名前は大きく表示 */}
            <Text style={styles.name}>{customer.name}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>メールアドレス：</Text>
              <Text style={styles.value}>{customer.email}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>企業：</Text>
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
              <Text style={styles.label}>電話番号：</Text>
              <Text style={styles.value}>{customer.phone}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>役職：</Text>
              <Text style={styles.value}>{customer.position}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>部署：</Text>
              <Text style={styles.value}>{customer.department}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>メモ：</Text>
              <Text style={styles.value}>{customer.notes}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>登録日：</Text>
              <Text style={styles.value}>
                {new Date(customer.createdAt).toLocaleDateString("ja-JP")}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>更新日：</Text>
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
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#4F46E5',
    textDecorationLine: 'underline',
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
  label: {
    width: 100,
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
});
