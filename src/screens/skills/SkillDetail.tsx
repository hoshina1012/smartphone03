import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Skill = {
  id: number;
  name: string;
  category: string;
  description?: string;
};

type RouteParams = {
  SkillDetail: {
    skill: Skill;
  };
};

const SkillDetail = () => {
  const route = useRoute<RouteProp<RouteParams, 'SkillDetail'>>();
  const navigation = useNavigation();
  const { skill } = route.params;

  const [isEditing, setIsEditing] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<Skill>({ ...skill });
  const [formData, setFormData] = useState<Skill>({ ...skill });

  const handleChange = (key: keyof Skill, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleUpdate = async () => {
    const { name, category, description } = formData;

    if (!name || !category) {
      Alert.alert('エラー', 'スキル名とカテゴリは必須です');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const res = await fetch(`https://nextjs-skill-viewer.vercel.app/api/skills/${skill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, category, description }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`更新失敗: ${res.status} - ${errText}`);
      }

      Alert.alert('保存完了', 'スキル情報が更新されました');
      setIsEditing(false);
      setCurrentSkill(formData);
    } catch (error: any) {
      Alert.alert('エラー', '更新処理中にエラーが発生しました');
      console.error('Update Error:', error);
    }
  };

  const handleCancel = () => {
    setFormData({ ...currentSkill });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      '確認',
      'このスキルを本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              const res = await fetch(`https://nextjs-skill-viewer.vercel.app/api/skills/${skill.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                const errText = await res.text();
                throw new Error(`削除失敗: ${res.status} - ${errText}`);
              }

              Alert.alert('削除完了', 'スキルを削除しました');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('エラー', '削除処理中にエラーが発生しました');
              console.error('Delete Error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <Header />
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>スキル一覧に戻る</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        {isEditing ? (
          <>
            <Button title="保存" onPress={handleUpdate} />
            <Button title="キャンセル" onPress={handleCancel} color="gray" />
          </>
        ) : (
          <>
            <Button title="編集" onPress={() => setIsEditing(true)} />
            <Button title="削除" color="red" onPress={handleDelete} />
          </>
        )}
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>ID: {currentSkill.id}</Text>

        <Text style={styles.label}>スキル名:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
          />
        ) : (
          <Text style={styles.value}>{currentSkill.name}</Text>
        )}

        <Text style={styles.label}>カテゴリ:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) => handleChange('category', text)}
          />
        ) : (
          <Text style={styles.value}>{currentSkill.category}</Text>
        )}

        <Text style={styles.label}>説明:</Text>
        {isEditing ? (
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
          />
        ) : (
          <Text style={styles.value}>{currentSkill.description || '-'}</Text>
        )}
      </View>

      <Footer />
    </View>
  );
};

export default SkillDetail;

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  backContainer: { paddingHorizontal: 20, paddingVertical: 10 },
  backText: { fontSize: 16, color: '#4F46E5', textDecorationLine: 'underline' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  container: { padding: 20 },
  label: { fontWeight: 'bold', fontSize: 14, marginTop: 10 },
  value: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginBottom: 8,
  },
});
