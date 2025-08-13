import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Button, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Skill = {
  id: number;
  name: string;
  category: string;
  description?: string;
};

type SkillsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Skills"
>;

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "",
    description: "",
  });

  const navigation = useNavigation<SkillsScreenNavigationProp>();

  const fetchSkills = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        setError('トークンが見つかりません');
        setLoading(false);
        return;
      }

      const res = await fetch("https://nextjs-skill-viewer.vercel.app/api/skills", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`ステータスエラー: ${res.status}`);
      }

      const data: Skill[] = await res.json();
      setSkills(data);
    } catch (error: any) {
      console.error("スキル取得エラー:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSkills();
    }, [])
  );

  const handleSave = async () => {
    const { name, category, description } = newSkill;

    if (!name || !category) {
      Alert.alert("エラー", "スキル名とカテゴリは必須です");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('エラー', 'トークンがありません');
        return;
      }

      const response = await fetch("https://nextjs-skill-viewer.vercel.app/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category,
          description,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`登録失敗: ${response.status} - ${errText}`);
      }

      Alert.alert("成功", "スキルを追加しました");
      setNewSkill({ name: "", category: "", description: "" });
      setShowForm(false);
      fetchSkills();
    } catch (err: any) {
      Alert.alert("エラー", err.message);
    }
  };

  const renderItem = ({ item }: { item: Skill }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("SkillDetail", { id: item.id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.category}>{item.category}</Text>
      {item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>スキル一覧</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addButton}>{showForm ? "キャンセル" : "スキルを追加"}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="スキル名"
              value={newSkill.name}
              onChangeText={(text) => setNewSkill({ ...newSkill, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="カテゴリ"
              value={newSkill.category}
              onChangeText={(text) => setNewSkill({ ...newSkill, category: text })}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="説明（任意）"
              multiline
              value={newSkill.description}
              onChangeText={(text) => setNewSkill({ ...newSkill, description: text })}
            />
            <Button title="保存" onPress={handleSave} />
          </View>
        )}

        {error ? (
          <Text style={{ color: "red", textAlign: "center" }}>エラー: {error}</Text>
        ) : (
          <FlatList
            data={skills}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
          />
        )}
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  addButton: { color: "#4F46E5", fontSize: 16 },
  form: { marginBottom: 20, padding: 10, backgroundColor: "#F3F4F6", borderRadius: 8 },
  input: { height: 44, borderColor: "#D1D5DB", borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, marginBottom: 10, backgroundColor: "#fff" },
  item: { backgroundColor: "#f8f8f8", padding: 12, marginBottom: 10, borderRadius: 8 },
  name: { fontSize: 18, fontWeight: "bold" },
  category: { fontSize: 14, color: "#666" },
  description: { fontSize: 12, color: "#999", marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
