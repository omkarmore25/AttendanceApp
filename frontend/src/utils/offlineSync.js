import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const JAPMALA_QUEUE_KEY = 'attendance_app_offline_japmala_v1';
const JAPMALA_ACTIONS_KEY = 'attendance_app_offline_japmala_actions_v1';
const ATTENDANCE_QUEUE_KEY = 'attendance_app_offline_attendance_v1';

/**
 * Check if device currently has internet access
 */
export const checkIsOnline = async () => {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  try {
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
 * Get all pending offline Japmala creations
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
 * Get all pending offline Japmala actions (edits / deletes)
 */
export const getOfflineJapmalaActions = async () => {
  try {
    const raw = await AsyncStorage.getItem(JAPMALA_ACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save an offline Japmala record to creation queue
 */
export const saveOfflineJapmala = async (entry) => {
  try {
    const queue = await getOfflineJapmalaQueue();
    const entryId = `offline_jap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEntry = {
      id: entryId,
      _id: entryId,
      count: entry.count,
      date: entry.date || new Date().toISOString().slice(0, 10),
      toDate: entry.toDate || null,
      entryType: entry.entryType || 'daily',
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
 * Save an offline edit for Japmala record
 */
export const saveOfflineJapmalaEdit = async (id, updatedFields) => {
  try {
    const queue = await getOfflineJapmalaQueue();
    const itemIndex = queue.findIndex(
      (item) => item.id === id || item._id === id || (String(id).startsWith('offline_') && item.date === updatedFields.date)
    );

    if (itemIndex > -1) {
      // It's a local unsynced item — update it directly in the creation queue!
      queue[itemIndex] = { ...queue[itemIndex], ...updatedFields };
      await AsyncStorage.setItem(JAPMALA_QUEUE_KEY, JSON.stringify(queue));
      return { local: true, updated: queue[itemIndex] };
    } else {
      // If it's a non-server offline ID that wasn't in creation queue, don't create invalid server action
      if (String(id).startsWith('offline_') || String(id).startsWith('local_')) {
        return { local: true };
      }

      // It's a real server MongoDB item — queue the edit action
      const actions = await getOfflineJapmalaActions();
      const newAction = {
        actionId: `action_edit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'edit',
        targetId: id,
        data: updatedFields,
        timestamp: new Date().toISOString(),
      };
      const filtered = actions.filter((a) => !(a.targetId === id && a.type === 'edit'));
      filtered.push(newAction);
      await AsyncStorage.setItem(JAPMALA_ACTIONS_KEY, JSON.stringify(filtered));
      return { local: false, action: newAction };
    }
  } catch (err) {
    console.error('Error saving offline japmala edit:', err);
    throw err;
  }
};

/**
 * Save an offline deletion for Japmala record
 */
export const saveOfflineJapmalaDelete = async (id) => {
  try {
    const queue = await getOfflineJapmalaQueue();
    const itemIndex = queue.findIndex(
      (item) => item.id === id || item._id === id || String(id).startsWith('offline_')
    );

    if (itemIndex > -1) {
      // It was an unsynced local creation — simply remove it from creation queue so it's NEVER sent to server!
      queue.splice(itemIndex, 1);
      await AsyncStorage.setItem(JAPMALA_QUEUE_KEY, JSON.stringify(queue));
      return { local: true };
    } else {
      // If it was an offline ID, it never existed on server
      if (String(id).startsWith('offline_') || String(id).startsWith('local_')) {
        return { local: true };
      }

      // It was a real server MongoDB item — queue the delete action
      const actions = await getOfflineJapmalaActions();
      const newAction = {
        actionId: `action_del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'delete',
        targetId: id,
        timestamp: new Date().toISOString(),
      };
      const filtered = actions.filter((a) => a.targetId !== id);
      filtered.push(newAction);
      await AsyncStorage.setItem(JAPMALA_ACTIONS_KEY, JSON.stringify(filtered));
      return { local: false, action: newAction };
    }
  } catch (err) {
    console.error('Error saving offline japmala delete:', err);
    throw err;
  }
};

/**
 * Clear any invalid or stuck pending actions
 */
export const clearStuckActions = async () => {
  try {
    const actions = await getOfflineJapmalaActions();
    const valid = actions.filter(
      (a) => a.targetId && !a.targetId.startsWith('offline_') && !a.targetId.startsWith('local_')
    );
    await AsyncStorage.setItem(JAPMALA_ACTIONS_KEY, JSON.stringify(valid));
  } catch (e) {
    console.error('Error clearing stuck actions:', e);
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
    await clearStuckActions();
    const [japmala, actions, attendance] = await Promise.all([
      getOfflineJapmalaQueue(),
      getOfflineJapmalaActions(),
      getOfflineAttendanceQueue(),
    ]);
    return {
      japmalaCount: japmala.length + actions.length,
      attendanceCount: attendance.length,
      totalCount: japmala.length + actions.length + attendance.length,
    };
  } catch {
    return { japmalaCount: 0, attendanceCount: 0, totalCount: 0 };
  }
};

/**
 * Synchronize all pending records (Creations, Edits, Deletes) with backend API
 */
export const syncAllPending = async (apiClient) => {
  let syncedCreations = 0;
  let syncedActions = 0;
  let syncedAttendance = 0;
  let errors = [];

  // Clean stuck non-server actions first
  await clearStuckActions();

  // 1. Sync Japmala Creations Queue
  try {
    const japmalaQueue = await getOfflineJapmalaQueue();
    if (japmalaQueue.length > 0) {
      const remaining = [];
      for (const item of japmalaQueue) {
        try {
          await apiClient.post('/japmala', {
            count: item.count,
            date: item.date,
            toDate: item.toDate,
            entryType: item.entryType,
            note: item.note,
            for_user_id: item.for_user_id,
          });
          syncedCreations++;
        } catch (err) {
          console.warn('Failed to sync japmala creation:', item, err);
          remaining.push(item);
          errors.push(err);
        }
      }
      await AsyncStorage.setItem(JAPMALA_QUEUE_KEY, JSON.stringify(remaining));
    }
  } catch (err) {
    console.error('Japmala creations sync error:', err);
  }

  // 2. Sync Japmala Actions Queue (Edits / Deletes)
  try {
    const actionsQueue = await getOfflineJapmalaActions();
    if (actionsQueue.length > 0) {
      const remainingActions = [];
      for (const action of actionsQueue) {
        // Skip invalid non-MongoDB IDs
        if (!action.targetId || action.targetId.startsWith('offline_') || action.targetId.startsWith('local_')) {
          syncedActions++;
          continue;
        }

        try {
          if (action.type === 'edit') {
            await apiClient.put(`/japmala/${action.targetId}`, action.data);
            syncedActions++;
          } else if (action.type === 'delete') {
            await apiClient.delete(`/japmala/${action.targetId}`);
            syncedActions++;
          }
        } catch (err) {
          // If server returns 404 (already deleted/not found) or 400 (invalid ID), drop the action
          if (err.response?.status === 404 || err.response?.status === 400) {
            syncedActions++;
          } else {
            console.warn('Failed to sync japmala action:', action, err);
            remainingActions.push(action);
            errors.push(err);
          }
        }
      }
      await AsyncStorage.setItem(JAPMALA_ACTIONS_KEY, JSON.stringify(remainingActions));
    }
  } catch (err) {
    console.error('Japmala actions sync error:', err);
  }

  // 3. Sync Attendance Queue
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
    console.error('Attendance sync error:', err);
  }

  const counts = await getPendingCounts();

  return {
    success: errors.length === 0,
    syncedCreations,
    syncedActions,
    syncedAttendance,
    totalSynced: syncedCreations + syncedActions + syncedAttendance,
    remainingPending: counts.totalCount,
  };
};
