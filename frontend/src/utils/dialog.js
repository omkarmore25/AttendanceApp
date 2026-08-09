import { Platform, Alert } from 'react-native';

/**
 * Cross-platform Alert helper for Native and Web
 */
export const showAlert = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message || ''}`);
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

/**
 * Cross-platform Confirm helper for Native and Web
 */
export const showConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message || ''}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: onConfirm },
    ]);
  }
};
