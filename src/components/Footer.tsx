import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>© {currentYear} 社員スキル管理システム</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 12,
    color: '#6b7280',
  },
});
