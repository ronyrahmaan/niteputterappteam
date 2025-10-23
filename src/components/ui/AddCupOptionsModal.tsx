import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

interface AddCupOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onScanQr: () => void;
  onBluetoothScan: () => void;
}

export const AddCupOptionsModal: React.FC<AddCupOptionsModalProps> = ({ visible, onClose, onScanQr, onBluetoothScan }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Add New Cup</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.item} onPress={onScanQr}>
            <Ionicons name="qr-code-outline" size={20} color={theme.colors.text.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Scan QR Code</Text>
              <Text style={styles.itemSub}>Use the code printed on your cup</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onBluetoothScan}>
            <Ionicons name="bluetooth" size={20} color={theme.colors.text.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>Bluetooth Scan</Text>
              <Text style={styles.itemSub}>Find nearby cups and connect</Text>
            </View>
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
    justifyContent: 'center' as const,
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    padding: theme.spacing[4],
    gap: theme.spacing[2],
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing[2],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  item: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  itemSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
};

export default AddCupOptionsModal;