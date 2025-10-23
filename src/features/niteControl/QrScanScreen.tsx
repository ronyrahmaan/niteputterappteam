import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// Using dynamic import for BarCodeScanner to avoid runtime errors
import type { BarCodeScannerResult } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { useNiteControlStore } from '../../store/niteControlStore';
import { theme } from '../../lib/theme';
import type { NiteControlStackScreenProps } from '../../types/navigation';
import { StackActions } from '@react-navigation/native';

type Props = NiteControlStackScreenProps<'QrScan'>;

// Frontend-only placeholder QR scanning screen.
// Provides a manual code entry and simple instructions.
export default function QrScanScreen({ navigation }: Props) {
  const { addCup } = useNiteControlStore();
  const [code, setCode] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const scannerModuleRef = React.useRef<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (Platform.OS === 'web') {
        if (mounted) {
          setHasPermission(false);
          setScannerAvailable(false);
        }
        return;
      }
      try {
        const core = require('expo-modules-core');
        const proxy = core?.NativeModulesProxy;
        const hasNative = !!proxy?.ExpoBarCodeScanner;
        if (!hasNative) {
          if (mounted) {
            setScannerAvailable(false);
            setHasPermission(false);
          }
          return;
        }
        const mod = require('expo-barcode-scanner');
        scannerModuleRef.current = mod;
        if (mounted) setScannerAvailable(!!mod?.BarCodeScanner);
        const { status } = await mod.requestPermissionsAsync();
        if (mounted) setHasPermission(status === 'granted');
      } catch (e) {
        if (mounted) {
          setHasPermission(false);
          setScannerAvailable(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onAdd = () => {
    const id = code.trim() || `qr-${Date.now()}`;
    addCup({ id, name: `Cup ${id.slice(-4)}`, isConnected: false });
    navigation.dispatch(StackActions.replace('MultiCupControl'));
  };

  const handleScan = ({ data }: BarCodeScannerResult) => {
    if (!data) return;
    setIsScanning(false);
    const id = String(data).trim();
    const safeId = id || `qr-${Date.now()}`;
    addCup({ id: safeId, name: `Cup ${safeId.slice(-4)}`, isConnected: false });
    navigation.dispatch(StackActions.replace('MultiCupControl'));
  };

  const reRequestPermission = async () => {
    try {
      const mod = scannerModuleRef.current;
      if (mod?.requestPermissionsAsync) {
        const { status } = await mod.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    } catch {}
  };

  const openSettings = () => {
    try {
      Linking.openSettings?.();
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Accessory</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {hasPermission && scannerAvailable ? (
        <View style={styles.cameraContainer}>
          {hasPermission ? (
            React.createElement(
              scannerModuleRef.current?.BarCodeScanner || View,
              {
                ...(isScanning ? { onBarCodeScanned: handleScan } : {}),
                style: StyleSheet.absoluteFillObject,
              }
            )
          ) : null}
          <View style={styles.scanFrame} />
        </View>
      ) : (
        <View style={styles.cameraStub}>
          <Ionicons name="qr-code" size={88} color={theme.colors.text.secondary} />
          <Text style={styles.stubText}>
            {!scannerAvailable
              ? 'Barcode scanner not available in this client. Use a dev build or update Expo Go.'
              : hasPermission === false
              ? 'Camera permission denied. Enter code manually or enable in Settings.'
              : Platform.OS === 'web'
              ? 'Camera scanning not available in web preview. Use a device.'
              : 'Requesting camera permission…'}
          </Text>
          {hasPermission === false && (
            <>
              <TouchableOpacity onPress={reRequestPermission} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openSettings} style={[styles.secondaryBtn, { marginTop: 8 }] }>
                <Text style={styles.secondaryBtnText}>Open Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <Text style={styles.subtitle}>Scan a Setup Code or Enter Manually</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter setup code"
        value={code}
        onChangeText={setCode}
        placeholderTextColor={theme.colors.text.secondary}
      />

      <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
        <Text style={styles.addBtnText}>Add Cup</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  cameraContainer: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#000',
  },
  cameraStub: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.background.secondary,
  },
  scanFrame: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: theme.colors.neon.blue,
    borderRadius: 12,
  },
  stubText: {
    marginTop: 8,
    color: theme.colors.text.secondary,
  },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    paddingHorizontal: 12,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
  },
  addBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.neon.blue,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});