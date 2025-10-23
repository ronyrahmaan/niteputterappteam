import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SkyBackground } from '../../components/ui/SkyBackground';

import { Cup, useNiteControlStore } from '../../store/niteControlStore';
import { MultiCupControlScreenProps } from '../../types/navigation';
import { AddCupOptionsModal } from '../../components/ui/AddCupOptionsModal';
import { BleScanModal } from './BleScanModal';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARDS_PER_ROW = 2;
const CARD_WIDTH = (width - (CARD_MARGIN * (CARDS_PER_ROW + 1))) / CARDS_PER_ROW;

const QUICK_GROUPS = [
  { id: 'all', name: 'All Cups', icon: 'apps', count: 0 },
  { id: 'first-6', name: 'First 6', icon: 'grid', count: 6 },
  { id: 'last-6', name: 'Last 6', icon: 'grid-outline', count: 6 },
  { id: 'even', name: 'Even', icon: 'duplicate', count: 0 },
  { id: 'odd', name: 'Odd', icon: 'copy', count: 0 },
];

const BULK_ACTIONS = [
  { id: 'color', name: 'Set Color', icon: 'color-palette', color: '#FF6B6B' },
  { id: 'brightness', name: 'Set Brightness', icon: 'sunny', color: '#FFD93D' },
  { id: 'mode', name: 'Set Mode', icon: 'flash', color: '#6BCF7F' },
  { id: 'connect', name: 'Connect All', icon: 'wifi', color: '#4ECDC4' },
  { id: 'disconnect', name: 'Disconnect All', icon: 'wifi-off', color: '#FF6B6B' },
];

interface CupCardProps {
  cup: Cup;
  onPress: () => void;
  onRename: () => void;
  onDelete: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const CupCard: React.FC<CupCardProps> = ({
  cup,
  onPress,
  onRename,
  onDelete,
  onConnect,
  onDisconnect,
  onSelect,
  isSelected
}) => {
  const [pressingChild, setPressingChild] = useState(false);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(cup.isConnected ? 0.3 : 0);
  const selectionScale = useSharedValue(isSelected ? 1.05 : 1);
  const childPressBlockUntilRef = useRef<number>(0);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: selectionScale.value }
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  useEffect(() => {
    selectionScale.value = withSpring(isSelected ? 1.02 : 1, { tension: 300, friction: 10 });
  }, [isSelected]);

  useEffect(() => {
    if (cup.isConnected) {
      glowOpacity.value = withSpring(1, { tension: 300, friction: 10 });

      const pulseInterval = setInterval(() => {
        scale.value = withSpring(1.01, { tension: 300, friction: 10 }, () => {
          scale.value = withSpring(1, { tension: 300, friction: 10 });
        });
        glowOpacity.value = withSpring(0.3, { tension: 300, friction: 10 }, () => {
          glowOpacity.value = withSpring(1, { tension: 300, friction: 10 });
        });
      }, 3000);

      return () => clearInterval(pulseInterval);
    } else {
      glowOpacity.value = withSpring(0, { tension: 300, friction: 10 });
    }
  }, [cup.isConnected]);

  const handleCardPress = useCallback(() => {
    if (pressingChild || Date.now() < childPressBlockUntilRef.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  }, [pressingChild, onSelect]);

  const handleChildPress = useCallback((action: () => void) => {
    setPressingChild(true);
    childPressBlockUntilRef.current = Date.now() + 300;

    setTimeout(() => {
      setPressingChild(false);
    }, 150);

    action();
  }, []);

  const getBatteryColor = (level: number) => {
    if (level > 60) return '#34C759';
    if (level > 30) return '#FF9500';
    return '#FF3B30';
  };

  const getBatteryIcon = (level: number) => {
    if (level > 75) return 'battery-full';
    if (level > 50) return 'battery-half';
    if (level > 25) return 'battery-charging';
    return 'battery-dead';
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, { width: CARD_WIDTH }]}
      onPress={handleCardPress}
      activeOpacity={0.95}
    >
      <Reanimated.View style={[styles.card, cardAnimatedStyle]}>
        {/* Glow Effect */}
        <Reanimated.View
          style={[
            styles.cardGlow,
            glowAnimatedStyle,
            { shadowColor: cup.color }
          ]}
        />

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#00D4FF" />
          </View>
        )}

        {/* Connection Status */}
        <View style={[styles.connectionStatus, cup.isConnected && styles.connectedStatus]}>
          <Ionicons
            name={cup.isConnected ? 'wifi' : 'wifi-off'}
            size={14}
            color={cup.isConnected ? '#34C759' : 'rgba(255, 255, 255, 0.5)'}
          />
          <Text style={[styles.connectionText, cup.isConnected && styles.connectedText]}>
            {cup.isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>

        {/* Cup Preview */}
        <View style={styles.cupPreview}>
          <View
            style={[
              styles.cupVisualization,
              {
                backgroundColor: cup.color,
                opacity: cup.isConnected ? cup.brightness / 100 : 0.3,
              }
            ]}
          >
            <Ionicons name="golf" size={28} color="#FFFFFF" />
          </View>
        </View>

        {/* Cup Info */}
        <View style={styles.cupInfo}>
          <Text style={styles.cupName} numberOfLines={1}>
            {cup.name}
          </Text>
          <Text style={styles.cupDetails}>
            {cup.color.toUpperCase()} • {cup.brightness}%
          </Text>
          <Text style={styles.cupMode}>
            {cup.mode.charAt(0).toUpperCase() + cup.mode.slice(1)} Mode
          </Text>
        </View>

        {/* Battery Level */}
        <View style={styles.batterySection}>
          <Ionicons
            name={getBatteryIcon(cup.batteryLevel)}
            size={16}
            color={getBatteryColor(cup.batteryLevel)}
          />
          <Text style={[styles.batteryText, { color: getBatteryColor(cup.batteryLevel) }]}>
            {cup.batteryLevel}%
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleChildPress(onRename)}
            activeOpacity={0.7}
          >
            <Ionicons name="create" size={16} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.connectionButton,
              cup.isConnected ? styles.disconnectButton : styles.connectButton
            ]}
            onPress={() => handleChildPress(cup.isConnected ? onDisconnect : onConnect)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={cup.isConnected ? 'close-circle' : 'wifi'}
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleChildPress(onDelete)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={16} color="#FF453A" />
          </TouchableOpacity>
        </View>
      </Reanimated.View>
    </TouchableOpacity>
  );
};

export const MultiCupControlScreen: React.FC<MultiCupControlScreenProps> = ({ navigation }) => {
  const {
    cups,
    selectedCups,
    connectToCup,
    disconnectFromCup,
    renameCup,
    removeCup,
    selectCup,
    deselectCup,
    selectAllCups,
    deselectAllCups,
    setColor,
    setBrightness,
    setMode,
    currentColor,
    currentBrightness,
    currentMode,
  } = useNiteControlStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showBleModal, setShowBleModal] = useState(false);
  const [renamingCup, setRenamingCup] = useState<Cup | null>(null);
  const [newCupName, setNewCupName] = useState('');
  const [bulkValue, setBulkValue] = useState('');

  const connectedCups = cups.filter(cup => cup.isConnected);
  const selectedConnectedCups = selectedCups.filter(id =>
    cups.find(cup => cup.id === id)?.isConnected
  );

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleQuickGroup = useCallback((groupId: string) => {
    if (connectedCups.length === 0) {
      Alert.alert('No Connected Cups', 'Please connect some cups first to use Quick Groups.');
      return;
    }

    const connectedCupIds = connectedCups.map(cup => cup.id);
    let groupCups: string[] = [];

    switch (groupId) {
      case 'all':
        groupCups = connectedCupIds;
        break;
      case 'first-6':
        groupCups = connectedCupIds.slice(0, 6);
        break;
      case 'last-6':
        groupCups = connectedCupIds.slice(-6);
        break;
      case 'even':
        groupCups = connectedCupIds.filter((_, index) => index % 2 === 1);
        break;
      case 'odd':
        groupCups = connectedCupIds.filter((_, index) => index % 2 === 0);
        break;
    }

    if (groupCups.length === 0) {
      Alert.alert('No Cups Available', `No cups available for ${groupId} group.`);
      return;
    }

    // Toggle selection
    const allSelected = groupCups.every(id => selectedCups.includes(id));

    if (allSelected) {
      groupCups.forEach(id => deselectCup(id));
    } else {
      groupCups.forEach(id => selectCup(id));
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [connectedCups, selectedCups, selectCup, deselectCup]);

  const handleBulkAction = useCallback(async (actionId: string) => {
    console.log('handleBulkAction called with:', actionId);

    const targetCups = actionId === 'connect' ? selectedCups : selectedConnectedCups;

    console.log('Target cups:', targetCups);
    console.log('Selected cups:', selectedCups);
    console.log('Selected connected cups:', selectedConnectedCups);

    if (targetCups.length === 0) {
      Alert.alert(
        'No Selection',
        actionId === 'connect' ? 'Please select cups to connect first.' : 'Please select connected cups first.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let successMessage = '';

      switch (actionId) {
        case 'color':
          await setColor(currentColor);
          successMessage = `Applied color ${currentColor} to ${targetCups.length} cups`;
          break;
        case 'brightness':
          await setBrightness(currentBrightness);
          successMessage = `Set brightness to ${currentBrightness}% on ${targetCups.length} cups`;
          break;
        case 'mode':
          await setMode(currentMode);
          successMessage = `Applied ${currentMode} mode to ${targetCups.length} cups`;
          break;
        case 'connect':
          let connectedCount = 0;
          for (const cupId of selectedCups) {
            const cup = cups.find(c => c.id === cupId);
            if (cup && !cup.isConnected) {
              await connectToCup(cupId);
              connectedCount++;
            }
          }
          successMessage = `Connected ${connectedCount} cups`;
          break;
        case 'disconnect':
          let disconnectedCount = 0;
          for (const cupId of selectedConnectedCups) {
            await disconnectFromCup(cupId);
            disconnectedCount++;
          }
          successMessage = `Disconnected ${disconnectedCount} cups`;
          break;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', successMessage);
    } catch (error) {
      console.error(`Bulk action ${actionId} failed:`, error);
      Alert.alert('Error', `Failed to ${actionId} selected cups. Please try again.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedConnectedCups, selectedCups, cups, currentColor, currentBrightness, currentMode, setColor, setBrightness, setMode, connectToCup, disconnectFromCup]);

  const handleCupConnect = useCallback(async (cupId: string) => {
    try {
      await connectToCup(cupId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Connection Failed', 'Could not connect to cup.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [connectToCup]);

  const handleCupDisconnect = useCallback(async (cupId: string) => {
    try {
      await disconnectFromCup(cupId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Disconnection Failed', 'Could not disconnect from cup.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [disconnectFromCup]);

  const handleCupRename = useCallback((cup: Cup) => {
    setRenamingCup(cup);
    setNewCupName(cup.name);
  }, []);

  const handleCupDelete = useCallback((cup: Cup) => {
    Alert.alert(
      'Delete Cup',
      `Are you sure you want to delete "${cup.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeCup(cup.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [removeCup]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingCup && newCupName.trim()) {
      renameCup(renamingCup.id, newCupName.trim());
      setRenamingCup(null);
      setNewCupName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [renamingCup, newCupName, renameCup]);

  const renderCup = useCallback(({ item }: { item: Cup }) => (
    <CupCard
      cup={item}
      onPress={() => {}}
      onRename={() => handleCupRename(item)}
      onDelete={() => handleCupDelete(item)}
      onConnect={() => handleCupConnect(item.id)}
      onDisconnect={() => handleCupDisconnect(item.id)}
      onSelect={() => {
        if (selectedCups.includes(item.id)) {
          deselectCup(item.id);
        } else {
          selectCup(item.id);
        }
      }}
      isSelected={selectedCups.includes(item.id)}
    />
  ), [selectedCups, handleCupRename, handleCupDelete, handleCupConnect, handleCupDisconnect, selectCup, deselectCup]);

  return (
    <View style={styles.container}>
      <SkyBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00FF88"
              colors={['#00FF88']}
            />
          }
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Multi-Cup Control</Text>
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, connectedCups.length > 0 && styles.connectedDot]} />
              <Text style={styles.connectionText}>
                {connectedCups.length} of {cups.length} connected
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddOptions(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
            style={styles.statsScrollView}
          >
            <View style={styles.statsCard}>
              <Ionicons name="golf" size={24} color="#34C759" />
              <Text style={styles.statsNumber}>{connectedCups.length}</Text>
              <Text style={styles.statsLabel}>Connected</Text>
            </View>

            <View style={styles.statsCard}>
              <Ionicons name="checkmark-circle" size={24} color="#00D4FF" />
              <Text style={styles.statsNumber}>{selectedCups.length}</Text>
              <Text style={styles.statsLabel}>Selected</Text>
            </View>

            <View style={styles.statsCard}>
              <Ionicons name="battery-half" size={24} color="#FF9500" />
              <Text style={styles.statsNumber}>
                {connectedCups.length > 0
                  ? Math.round(connectedCups.reduce((acc, cup) => acc + cup.batteryLevel, 0) / connectedCups.length)
                  : 0}%
              </Text>
              <Text style={styles.statsLabel}>Avg Battery</Text>
            </View>

            <View style={styles.statsCard}>
              <Ionicons name="flash" size={24} color="#FF6B6B" />
              <Text style={styles.statsNumber}>{cups.length}</Text>
              <Text style={styles.statsLabel}>Total Cups</Text>
            </View>
          </ScrollView>
        </View>

        {/* Quick Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Groups</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupsScrollContent}
            style={styles.groupsScrollView}
          >
            {QUICK_GROUPS.map((group) => {
              const actualCount = group.id === 'all' ? connectedCups.length :
                group.id === 'even' ? Math.ceil(connectedCups.length / 2) :
                group.id === 'odd' ? Math.floor(connectedCups.length / 2) :
                Math.min(group.count, connectedCups.length);

              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupButton}
                  onPress={() => handleQuickGroup(group.id)}
                  disabled={connectedCups.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons name={group.icon as any} size={20} color="#FFFFFF" />
                  <Text style={styles.groupButtonText}>{group.name}</Text>
                  <Text style={styles.groupCount}>({actualCount})</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Bulk Actions */}
        {selectedConnectedCups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Bulk Actions ({selectedConnectedCups.length} selected)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bulkActionsScrollContent}
              style={styles.bulkActionsScrollView}
            >
              {BULK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.bulkActionButton, { backgroundColor: action.color + '20', borderColor: action.color + '40' }]}
                  onPress={() => {
                    console.log('Bulk action pressed:', action.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleBulkAction(action.id);
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name={action.icon as any} size={18} color={action.color} />
                  <Text style={[styles.bulkActionText, { color: action.color }]}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cups Grid */}
        <View style={styles.cupsSection}>
          <View style={styles.cupsContainer}>
            {cups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="golf-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyTitle}>No Cups Added</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the + button to add your first Nite Cup
                </Text>
              </View>
            ) : (
              <View style={styles.cupsGrid}>
                {cups.map((item) => (
                  <View key={item.id} style={styles.cardContainer}>
                    {renderCup({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        </ScrollView>

        {/* Rename Modal */}
        <Modal
          visible={!!renamingCup}
          transparent
          animationType="fade"
          onRequestClose={() => setRenamingCup(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rename Cup</Text>
              <TextInput
                style={styles.modalInput}
                value={newCupName}
                onChangeText={setNewCupName}
                placeholder="Enter cup name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                autoFocus
                maxLength={20}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setRenamingCup(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={handleRenameSubmit}
                >
                  <Text style={styles.modalConfirmText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Cup Options Modal */}
        <AddCupOptionsModal
          visible={showAddOptions}
          onClose={() => setShowAddOptions(false)}
          onScanQr={() => {
            setShowAddOptions(false);
            navigation.navigate('QrScan');
          }}
          onBluetoothScan={() => {
            setShowAddOptions(false);
            setShowBleModal(true);
          }}
        />

        {/* BLE Scan Modal */}
        <BleScanModal visible={showBleModal} onClose={() => setShowBleModal(false)} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  connectedDot: {
    backgroundColor: '#34C759',
  },
  connectionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Cards
  statsScrollView: {
    marginBottom: 8,
  },
  statsScrollContent: {
    paddingRight: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 90,
    maxWidth: 110,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Quick Groups
  groupsScrollView: {
    marginBottom: 8,
  },
  groupsScrollContent: {
    paddingRight: 20,
  },
  groupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 14 : 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 90,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupButtonText: {
    fontSize: 12,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
    color: '#FFFFFF',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  groupCount: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Bulk Actions
  bulkActionsScrollView: {
    marginBottom: 8,
  },
  bulkActionsScrollContent: {
    paddingRight: 20,
  },
  bulkActionButton: {
    borderRadius: Platform.OS === 'ios' ? 14 : 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 120,
    minHeight: 56,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Cups Grid
  cupsSection: {
    flex: 1,
    minHeight: 200,
  },
  cupsContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  cupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: CARD_MARGIN,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: Platform.OS === 'ios' ? 22 : 18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Platform.OS === 'ios' ? 8 : 6,
    marginBottom: 12,
    gap: 6,
  },
  connectedStatus: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  connectedText: {
    color: '#34C759',
  },
  cupPreview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cupVisualization: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cupInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cupName: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cupDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  cupMode: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  batterySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Platform.OS === 'ios' ? 8 : 6,
    marginBottom: 12,
    gap: 6,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  connectionButton: {
    flex: 1.5,
  },
  connectButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  disconnectButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalConfirmButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});