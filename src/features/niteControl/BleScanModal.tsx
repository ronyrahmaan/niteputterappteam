import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bleService, BLEDevice } from '../../lib/ble';
import { theme } from '../../lib/theme';
import { useNiteControlStore } from '../../store/niteControlStore';
import { DevBuildModal } from '../../components/ui/DevBuildModal';

interface BleScanModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BleScanModal: React.FC<BleScanModalProps> = ({ visible, onClose }) => {
  const { cups, connectToCup, addCup } = useNiteControlStore();
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showDevBuildModal, setShowDevBuildModal] = useState(false);

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
            <Text style={styles.title}>Scan for LED Controllers</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowDevBuildModal(true)}
              >
                <Ionicons name="information-circle" size={18} color={theme.colors.neon.blue} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
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
            renderItem={({ item }) => {
              const isLEDRing = item.name.toLowerCase().includes('sp105e') ||
                               item.name.toLowerCase().includes('magic') ||
                               item.name.toLowerCase().includes('led');

              return (
                <View style={styles.deviceRow}>
                  <View style={styles.deviceIconContainer}>
                    <Ionicons
                      name={isLEDRing ? "radio-button-on" : "golf"}
                      size={24}
                      color={isLEDRing ? "#FF6B6B" : "#00FF88"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.deviceHeader}>
                      <Text style={styles.deviceName}>{item.name}</Text>
                      {isLEDRing && (
                        <View style={styles.deviceTypeTag}>
                          <Text style={styles.deviceTypeText}>LED Ring</Text>
                        </View>
                      )}
                    </View>
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
              );
            }}
            ListEmptyComponent={() => (
              <View style={{ paddingVertical: 12 }}>
                <Text style={styles.emptyText}>No devices yet — keep Bluetooth on and LED controllers powered.</Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* Dev Build Info Modal */}
      <DevBuildModal
        visible={showDevBuildModal}
        onClose={() => setShowDevBuildModal(false)}
      />
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
  headerButtons: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[3],
  },
  infoButton: {
    padding: 4,
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
  deviceIconContainer: {
    width: 40,
    alignItems: 'center' as const,
  },
  deviceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing[2],
  },
  deviceTypeTag: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing[1],
    paddingVertical: 2,
  },
  deviceTypeText: {
    color: '#FF6B6B',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
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