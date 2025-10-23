import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

interface AddDeviceMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddAccessory: () => void;
  onAddCup: () => void;
}

export const AddDeviceMenu: React.FC<AddDeviceMenuProps> = ({ visible, onClose, onAddAccessory, onAddCup }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Add</Text>

          <TouchableOpacity style={styles.item} onPress={() => { onAddAccessory(); onClose(); }}>
            <Ionicons name="cube-outline" size={18} color={theme.colors.text.primary} />
            <Text style={styles.itemText}>Add Accessory</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => { onAddCup(); }}>
            <Ionicons name="golf" size={18} color={theme.colors.text.primary} />
            <Text style={styles.itemText}>Add New Cup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeRow} onPress={onClose}>
            <Ionicons name="close" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-start' as const,
    alignItems: 'flex-end' as const,
    paddingTop: 60,
    paddingRight: 16,
  },
  card: {
    width: 220,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    padding: theme.spacing[3],
    gap: theme.spacing[2],
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  item: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  itemText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  closeRow: {
    marginTop: theme.spacing[2],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[1],
  },
  closeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
};

export default AddDeviceMenu;