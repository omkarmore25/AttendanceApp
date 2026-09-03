import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const JAPMALA_QUEUE_KEY = 'attendance_app_offline_japmala_v1';
const ATTENDANCE_QUEUE_KEY = 'attendance_app_offline_attendance_v1';

/**
 * Check if device currently has internet access
 */
export const checkIsOnline = async () => {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  try {
    // Quick lightweight ping check on native mobile
    const res = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return res.status === 200;
  } catch {
    return false;
  }
};

/**
 * Get all pending offline Japmala records
 */
export const getOfflineJapmalaQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(JAPMALA_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save an offline Japmala record to queue
 */
export const saveOfflineJapmala = async (entry) => {
  try {
    const queue = await getOfflineJapmalaQueue();
    const newEntry = {
      id: `offline_jap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      count: entry.count,
      date: entry.date || new Date().toISOString().slice(0, 10),
      note: entry.note || '',
      for_user_id: entry.for_user_id || undefined,
      user_name: entry.user_name || undefined,
      timestamp: new Date().toISOString(),
    };
    queue.push(newEntry);
    await AsyncStorage.setItem(JAPMALA_QUEUE_KEY, JSON.stringify(queue));
    return newEntry;
  } catch (err) {
    console.error('Error saving offline japmala:', err);
    throw err;
  }
};

/**
 * Get all pending offline Attendance records
 */
export const getOfflineAttendanceQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(ATTENDANCE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save an offline Attendance check-in to queue
 */
export const saveOfflineAttendance = async (event_id, user_id, user_name, status = 'present') => {
  try {
    const queue = await getOfflineAttendanceQueue();
    const newEntry = {
      id: `offline_att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_id,
      user_id,
      user_name,
      status,
      timestamp: new Date().toISOString(),
    };
    queue.push(newEntry);
    await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(queue));
    return newEntry;
  } catch (err) {
    console.error('Error saving offline attendance:', err);
    throw err;
  }
};

/**
 * Get total count of pending items across all queues
 */
export const getPendingCounts = async () => {
  try {
    const [japmala, attendance] = await Promise.all([
      getOfflineJapmalaQueue(),
      getOfflineAttendanceQueue(),
    ]);
    return {
      japmalaCount: japmala.length,
      attendanceCount: attendance.length,
      totalCount: japmala.length + attendance.length,
    };
  } catch {
    return { japmalaCount: 0, attendanceCount: 0, totalCount: 0 };
  }
};

/**
 * Synchronize all pending records with backend API
 */
export const syncAllPending = async (apiClient) => {
  let syncedJapmala = 0;
  let syncedAttendance = 0;
  let errors = [];

  // 1. Sync Japmala Queue
  try {
    const japmalaQueue = await getOfflineJapmalaQueue();
    if (japmalaQueue.length > 0) {
      const remaining = [];
      for (const item of japmalaQueue) {
        try {
          await apiClient.post('/japmala', {
            count: item.count,
            date: item.date,
            note: item.note,
            for_user_id: item.for_user_id,
          });
          syncedJapmala++;
        } catch (err) {
          console.warn('Failed to sync japmala item:', item, err);
          remaining.push(item);
          errors.push(err);
        }
      }
      await AsyncStorage.setItem(JAPMALA_QUEUE_KEY, JSON.stringify(remaining));
    }
  } catch (err) {
    console.error('Japmala sync loop error:', err);
  }

  // 2. Sync Attendance Queue
  try {
    const attendanceQueue = await getOfflineAttendanceQueue();
    if (attendanceQueue.length > 0) {
      const remaining = [];
      for (const item of attendanceQueue) {
        try {
          await apiClient.post('/attendance/manual', {
            event_id: item.event_id,
            user_id: item.user_id,
            status: item.status,
          });
          syncedAttendance++;
        } catch (err) {
          console.warn('Failed to sync attendance item:', item, err);
          remaining.push(item);
          errors.push(err);
        }
      }
      await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(remaining));
    }
  } catch (err) {
    console.error('Attendance sync loop error:', err);
  }

  const counts = await getPendingCounts();

  return {
    success: errors.length === 0,
    syncedJapmala,
    syncedAttendance,
    totalSynced: syncedJapmala + syncedAttendance,
    remainingPending: counts.totalCount,
  };
};
