import { Alert, Platform } from 'react-native';

/**
 * Alert.alert is not implemented by react-native-web, so destructive actions
 * fall back to the browser confirmation dialog when previewing on the web.
 * On Android/iOS the native alert is used.
 */
export function confirmAction(title: string, message: string, confirmLabel = 'Confirm'): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }

    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
