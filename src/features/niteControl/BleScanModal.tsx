import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bleService, BLEDevice } from '../../lib/ble';
import { theme } from '../../lib/theme';
import { useNiteControlStore } from '../../store/niteControlStore';

interface BleScanModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BleScanModal: React.FC<BleScanModalProps> = ({ visible, onClose }) => {
  const { cups, connectToCup, addCup } = useNiteControlStore();
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    let unsubscribeScan: (() => void) | undefined;
    const run = async () => {
      setScanning(true);
      await bleService.initialize();
      const perm = await bleService.requestPermissions();
      if (!perm) {
        Alert.alert('Permissions required', 'Bluetooth permission is needed to scan for cups.');
        setScanning(false);
        return;
      }
      unsubscribeScan = bleService.onScanResult((list) => setDevices(list));
      await bleService.startScan();
      setScanning(false);
    };
    run();
    return () => {
      unsubscribeScan?.();
      bleService.stopScan();
    };
  }, [visible]);

  const handleConnect = async (deviceId: string) => {
    try {
      setConnectingId(deviceId);
      await bleService.connectToDevice(deviceId);
      // add to store if missing
      const exists = cups.find((c) => c.id === deviceId);
      if (!exists) {
        const dev = devices.find((d) => d.id === deviceId);
        const fallbackName = `Cup ${deviceId.slice(-4)}`;
        addCup({ id: deviceId, name: dev?.name ?? fallbackName, isConnected: true });
      }
      await connectToCup(deviceId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (e: any) {
      Alert.alert('Connection failed', e?.message || 'Could not connect to cup.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Scan for Cups (Bluetooth)</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {scanning && (
            <View style={styles.scanningRow}>
              <ActivityIndicator color={theme.colors.neon.blue} />
              <Text style={styles.scanningText}>Scanning…</Text>
            </View>
          )}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <View style={styles.deviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceMeta}>RSSI {item.rssi} • {item.isConnectable ? 'Connectable' : 'Unavailable'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.connectBtn, !item.isConnectable && styles.disabled]}
                  disabled={!item.isConnectable || connectingId === item.id}
                  onPress={() => handleConnect(item.id)}
                >
                  {connectingId === item.id ? (
                    <ActivityIndicator color={theme.colors.text.primary} />
                  ) : (
                    <Text style={styles.connectText}>Connect</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={{ paddingVertical: 12 }}>
                <Text style={styles.emptyText}>No devices yet — keep Bluetooth on and cup powered.</Text>
              </View>
            )}
          />
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
    maxHeight: 600,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scanningRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  scanningText: {
    color: theme.colors.text.secondary,
  },
  deviceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  deviceName: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deviceMeta: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
  },
  connectBtn: {
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  connectText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  disabled: {
    opacity: 0.5,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
  },
};

export default BleScanModal;