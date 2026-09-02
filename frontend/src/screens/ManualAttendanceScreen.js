import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';
import { showAlert } from '../utils/dialog';

const ManualAttendanceScreen = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendedUsers, setAttendedUsers] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const fetchData = async () => {
    try {
      const [usersRes, eventsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/events?status=Active'),
      ]);

      // Filter out admin user from attendance toggle list
      const regularUsers = (usersRes.data.users || []).filter((u) => u.role !== 'Admin');
      setAllUsers(regularUsers);

      const active = eventsRes.data.events?.filter((e) => e.status === 'Active') || [];
      setActiveEvents(active);

      if (active.length > 0 && !selectedEvent) {
        setSelectedEvent(active[0]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // When event is selected, fetch who already attended
  useEffect(() => {
    if (selectedEvent) {
      fetchAttendance();
    }
  }, [selectedEvent]);

  const fetchAttendance = async () => {
    if (!selectedEvent) return;
    try {
      const response = await api.get(`/attendance/event/${selectedEvent._id}`);
      const attendedIds = new Set(
        (response.data.attendance || []).map((r) => r.user_id?._id)
      );
      setAttendedUsers(attendedIds);
    } catch (error) {
      console.error('Attendance fetch error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const toggleAttendance = async (userId) => {
    if (!selectedEvent) {
      showAlert('No Active Event', 'Please select an active event first.');
      return;
    }

    try {
      setToggling(userId);
      const response = await api.post('/admin/manual-attendance', {
        eventId: selectedEvent._id,
        userId,
      });

      // Update local state
      const newSet = new Set(attendedUsers);
      if (response.data.action === 'added') {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      setAttendedUsers(newSet);
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to toggle attendance');
    } finally {
      setToggling(null);
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      (u.username || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderUser = ({ item }) => {
    const isPresent = attendedUsers.has(item._id);
    const isToggling = toggling === item._id;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.username || item.name}</Text>
            <View style={[styles.typeBadge, item.is_manual_entry && styles.typeBadgeOffline]}>
              <Text style={[styles.typeText, item.is_manual_entry && styles.typeTextOffline]}>
                {item.is_manual_entry ? '📝 Offline' : '👤 Registered'}
              </Text>
            </View>
          </View>
          <Text style={styles.userPhone}>📱 {item.phone || 'No Phone'}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            isPresent ? styles.togglePresent : styles.toggleAbsent,
          ]}
          onPress={() => toggleAttendance(item._id)}
          disabled={isToggling || !selectedEvent}
          activeOpacity={0.7}
        >
          {isToggling ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.toggleText}>
              {isPresent ? '✅ Present' : '❌ Absent'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Event Selector */}
      <View style={styles.eventSelector}>
        <Text style={styles.selectorLabel}>SELECT ACTIVE EVENT</Text>
        {activeEvents.length === 0 ? (
          <Text style={styles.noEvents}>No active events. Activate an event first in Manage Events.</Text>
        ) : (
          <View style={styles.eventPills}>
            {activeEvents.map((event) => (
              <TouchableOpacity
                key={event._id}
                style={[
                  styles.eventPill,
                  selectedEvent?._id === event._id && styles.eventPillActive,
                ]}
                onPress={() => setSelectedEvent(event)}
              >
                <Text
                  style={[
                    styles.eventPillText,
                    selectedEvent?._id === event._id && styles.eventPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  🟢 {event.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search user by name or phone..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
  eventSelector: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  selectorLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  noEvents: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.sm,
  },
  eventPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  eventPill: {
    backgroundColor: theme.colors.bgCard,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  eventPillText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  eventPillTextActive: {
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  searchInput: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addUserBtn: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  addUserBtnText: {
    color: theme.colors.warning,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  addUserForm: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  addInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addSubmitBtn: {
    backgroundColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addSubmitText: {
    color: '#000',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  typeBadge: {
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  typeBadgeOffline: {
    backgroundColor: theme.colors.warning + '20',
  },
  typeText: { color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
  typeTextOffline: { color: theme.colors.warning },
  userPhone: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 2 },
  toggleBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  togglePresent: {
    backgroundColor: theme.colors.success + '20',
  },
  toggleAbsent: {
    backgroundColor: theme.colors.error + '15',
  },
  toggleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold },
});

export default ManualAttendanceScreen;
