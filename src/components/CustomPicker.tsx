import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

type CustomPickerProps = {
  selectedValue: string;
  onSelect: (val: string) => void;
  options: string[];
};

const CustomPicker: React.FC<CustomPickerProps> = ({ selectedValue, onSelect, options }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (value: string) => {
    onSelect(value);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.selectedItem} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectedText}>{selectedValue}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default CustomPicker;

const styles = StyleSheet.create({
  selectedItem: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  selectedText: {
    fontSize: 16,
    color: '#111',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 250,
    padding: 10,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 20,
    textAlign: 'center',
  },
});
