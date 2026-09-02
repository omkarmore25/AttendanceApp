import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';
import { showConfirm, showAlert } from '../utils/dialog';

const ManageEventsScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      const fetched = response.data.events || [];
      const statusPriority = { Active: 1, Upcoming: 2, Completed: 3 };
      fetched.sort((a, b) => {
        const prioA = statusPriority[a.status] || 4;
        const prioB = statusPriority[b.status] || 4;
        if (prioA !== prioB) return prioA - prioB;
        const dateDiff = new Date(a.scheduled_date) - new Date(b.scheduled_date);
        if (dateDiff !== 0) return dateDiff;
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
      setEvents(fetched);
    } catch (error) {
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEvents();
    }, [])
  );

  const updateStatus = (eventId, newStatus) => {
    showConfirm('Change Status', `Change event status to "${newStatus}"?`, async () => {
      try {
        await api.patch(`/events/${eventId}/status`, { status: newStatus });
        fetchEvents();
      } catch (error) {
        showAlert('Error', error.response?.data?.message || 'Failed to update status');
      }
    });
  };

  const deleteEvent = (eventId, eventName) => {
    showConfirm('Delete Event', `Are you sure you want to delete "${eventName}"? This cannot be undone.`, async () => {
      try {
        await api.delete(`/events/${eventId}`);
        fetchEvents();
      } catch (error) {
        showAlert('Error', 'Failed to delete event');
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return theme.colors.success;
      case 'Upcoming': return theme.colors.info;
      case 'Completed': return theme.colors.textMuted;
      default: return theme.colors.textSecondary;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    if (/AM|PM|am|pm/i.test(timeStr)) return timeStr.toUpperCase();
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${period}`;
  };

  const renderEvent = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.eventDate}>📅 {formatDate(item.scheduled_date)}  ·  🕐 {formatTime12h(item.start_time)}</Text>

      {/* Status Actions */}
      <View style={styles.actions}>
        {item.status === 'Upcoming' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.success + '20' }]}
            onPress={() => updateStatus(item._id, 'Active')}
          >
            <Text style={[styles.actionText, { color: theme.colors.success }]}>▶ Activate</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Active' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.warning + '20' }]}
            onPress={() => updateStatus(item._id, 'Completed')}
          >
            <Text style={[styles.actionText, { color: theme.colors.warning }]}>✓ Complete</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Completed' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.success + '20' }]}
            onPress={() => updateStatus(item._id, 'Active')}
          >
            <Text style={[styles.actionText, { color: theme.colors.success }]}>🔄 Re-open Event</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.error + '15' }]}
          onPress={() => deleteEvent(item._id, item.name)}
        >
          <Text style={[styles.actionText, { color: theme.colors.error }]}>🗑 Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={() => navigation.navigate('EventAttendance', { eventId: item._id, eventName: item.name })}
        >
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>📊 Attendance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredEvents = events.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.name?.toLowerCase().includes(q) || item.status?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchEmoji}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events by name..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{searchQuery ? '🔍' : '📅'}</Text>
            <Text style={styles.emptyText}>{searchQuery ? `No events match "${searchQuery}"` : 'No events created yet'}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchEmoji: { fontSize: 18, marginRight: theme.spacing.sm },
  searchInput: { flex: 1, color: theme.colors.textPrimary, fontSize: theme.fontSize.md, height: '100%' },
  clearSearchBtn: { padding: 6 },
  clearSearchText: { color: theme.colors.textMuted, fontSize: 16, fontWeight: 'bold' },
  list: { padding: theme.spacing.lg, paddingBottom: 150 },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  eventName: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, flex: 1, marginRight: theme.spacing.sm },
  statusBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  statusText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, textTransform: 'uppercase' },
  eventDate: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  actionBtn: { paddingHorizontal: theme.spacing.md, paddingVertical: 8, borderRadius: theme.borderRadius.md },
  actionText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md },
});

export default ManageEventsScreen;
