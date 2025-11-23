import React from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

interface DevBuildModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DevBuildModal: React.FC<DevBuildModalProps> = ({ visible, onClose }) => {
  const openDocs = () => {
    Linking.openURL('https://docs.expo.dev/development/introduction/');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="construct" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>Development Build Required</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              To control your SP105E LED ring with real Bluetooth, you need to create a development build
              of this app. Expo Go doesn't support native Bluetooth modules.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 Current Demo Mode</Text>
              <Text style={styles.sectionText}>
                • Mock golf cups for UI testing{'\n'}
                • All app features work normally{'\n'}
                • Color controls simulate LED changes
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 For Real Hardware Control</Text>
              <Text style={styles.sectionText}>
                1. Create development build:{'\n'}
                   <Text style={styles.code}>npx expo install --fix</Text>{'\n'}
                   <Text style={styles.code}>eas build --profile development --platform ios</Text>{'\n\n'}
                2. Install on your device{'\n\n'}
                3. Connect SP105E LED ring controller{'\n\n'}
                4. Enjoy real Bluetooth control! 🎉
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Why Development Build?</Text>
              <Text style={styles.sectionText}>
                • Native Bluetooth modules require device-specific compilation{'\n'}
                • Expo Go can't include all possible native modules{'\n'}
                • Development builds give you full native access
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.docsButton} onPress={openDocs}>
              <Ionicons name="book" size={16} color="#FFFFFF" />
              <Text style={styles.docsText}>View Expo Docs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueText}>Continue in Demo Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center' as const,
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    maxHeight: '80%',
    overflow: 'hidden' as const,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing[3],
  },
  content: {
    padding: theme.spacing[4],
    maxHeight: 400,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing[4],
  },
  section: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[2],
  },
  sectionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'Courier' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 4,
    borderRadius: 4,
    color: theme.colors.neon.green,
  },
  actions: {
    flexDirection: 'row' as const,
    padding: theme.spacing[4],
    gap: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  docsButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#007AFF',
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[2],
  },
  docsText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
  },
  continueButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  continueText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
  },
};

export default DevBuildModal;