import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
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

export default function CompanyDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { company } = route.params as { company: Company };

  return (
    <View style={styles.wrapper}>
      <Header />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>企業一覧に戻る</Text>
        </TouchableOpacity>

        {company ? (
          <View style={styles.card}>
            <Text style={styles.label}>企業名</Text>
            <Text style={styles.value}>{company.name}</Text>

            <Text style={styles.label}>ウェブサイト</Text>
            <TouchableOpacity onPress={() => Linking.openURL(company.website)}>
              <Text style={styles.link}>{company.website}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>業界</Text>
            <Text style={styles.value}>{company.industry}</Text>

            <Text style={styles.label}>企業規模</Text>
            <Text style={styles.value}>{company.size}</Text>

            <Text style={styles.label}>住所</Text>
            <Text style={styles.value}>{company.address}</Text>

            <Text style={styles.label}>企業概要</Text>
            <Text style={styles.value}>{company.description}</Text>

            <Text style={styles.label}>登録日</Text>
            <Text style={styles.value}>
              {new Date(company.createdAt).toLocaleDateString("ja-JP")}
            </Text>

            <Text style={styles.label}>更新日</Text>
            <Text style={styles.value}>
              {new Date(company.updatedAt).toLocaleDateString("ja-JP")}
            </Text>
          </View>
        ) : (
          <Text style={styles.error}>企業情報を取得できませんでした。</Text>
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
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 4,
  },
  link: {
    fontSize: 14,
    color: "#2563eb",
    textDecorationLine: "underline",
    marginBottom: 4,
  },
  error: {
    color: "red",
    marginTop: 20,
  },
});
