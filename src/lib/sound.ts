import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let ExpoAudio: any = null;
try {
  // Dynamically require to avoid bundling issues if expo-av isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoAudio = require('expo-av').Audio;
} catch (_) {
  ExpoAudio = null;
}

const SOUND_MAP: Record<'confirm' | 'error' | 'connect', string> = {
  confirm: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  error: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
  connect: 'https://actions.google.com/sounds/v1/notifications/medium_bell_ringing.ogg',
};

export async function play(type: 'confirm' | 'error' | 'connect'): Promise<void> {
  const uri = SOUND_MAP[type];

  // Always do a small haptic companion
  if (type === 'confirm') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  if (type === 'connect') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  try {
    if (Platform.OS === 'web') {
      const audioEl = new Audio(uri);
      audioEl.volume = type === 'error' ? 0.6 : 0.35;
      await audioEl.play();
      return;
    }

    if (!ExpoAudio) return;
    const sound = new ExpoAudio.Sound();
    await sound.loadAsync({ uri });
    await sound.playAsync();
    // Give it a moment and unload
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, 600);
  } catch (_) {
    // Ignore sound errors silently
  }
}

// Debounced confirm sound to avoid double-triggering when multiple actions run together
let lastConfirmAt = 0;
export async function maybePlayConfirm(debounceMs = 500) {
  const now = Date.now();
  if (now - lastConfirmAt > debounceMs) {
    lastConfirmAt = now;
    await play('confirm');
  }
}