import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import theme from '../theme';
import { reverseGeocode } from '../utils/reverseGeocode';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const saveMobileNumber = async () => {
    if (!newPhone.trim() || !/^\d{10,15}$/.test(newPhone.trim())) {
      alert('Please enter a valid 10-15 digit mobile number.');
      return;
    }

    try {
      setSavingPhone(true);
      await api.put('/auth/profile', { phone: newPhone.trim() });
      user.phone = newPhone.trim(); // Local update
      setNewPhone('');
      alert('Mobile number saved successfully!');
    } catch (err) {
      alert('Failed to save mobile number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      const eventsData = response.data.events || [];

      // Reverse geocode each event's coordinates
      const eventsWithAddress = await Promise.all(
        eventsData.map(async (event) => {
          try {
            const address = await reverseGeocode(event.latitude, event.longitude);
            return { ...event, address };
          } catch {
            return { ...event, address: { short: 'Location unavailable' } };
        })
      );

      const statusPriority = { Active: 1, Upcoming: 2, Completed: 3 };
      eventsWithAddress.sort((a, b) => {
        const prioA = statusPriority[a.status] || 4;
        const prioB = statusPriority[b.status] || 4;
        if (prioA !== prioB) return prioA - prioB;
        return new Date(b.scheduled_date) - new Date(a.scheduled_date);
      });

      setEvents(eventsWithAddress);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (events.length === 0) setLoading(true);
      fetchEvents();
    }, [events.length])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const filteredEvents = events.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = item.name?.toLowerCase().includes(q);
    const locMatch = (item.address?.full || item.address?.short || '').toLowerCase().includes(q);
    return nameMatch || locMatch;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return { bg: theme.colors.success + '20', text: theme.colors.success };
      case 'Upcoming':
        return { bg: theme.colors.info + '20', text: theme.colors.info };
      case 'Completed':
        return { bg: theme.colors.textMuted + '20', text: theme.colors.textMuted };
      default:
        return { bg: theme.colors.border, text: theme.colors.textSecondary };
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

  const renderEventCard = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const mapUrl = `https://static-maps.yandex.ru/v1?ll=${item.longitude},${item.latitude}&z=15&size=400,150&l=map&pt=${item.longitude},${item.latitude},pm2rdl`;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
      >
        {/* Mini Map */}
        <View style={styles.mapContainer}>
          <Image
            source={{
              uri: `https://maps.geoapify.com/v1/staticmap?style=dark-matter&width=600&height=200&center=lonlat:${item.longitude},${item.latitude}&zoom=15&marker=lonlat:${item.longitude},${item.latitude};color:%236C63FF;size:large&apiKey=demo`,
            }}
            style={styles.miniMap}
            resizeMode="cover"
          />
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{formatDate(item.scheduled_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailText}>{formatTime12h(item.start_time)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address?.short || 'Loading address...'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.devotionalHeader}>जय सच्चिदानंद 🚩</Text>
          <Text style={styles.userName}>Welcome back, {user?.username || user?.name || 'User'} 👋</Text>
        </View>
      </View>

      {/* Missing Mobile Prompt Banner */}
      {!user?.phone ? (
        <View style={styles.phoneBanner}>
          <View style={styles.phoneBannerHeader}>
            <Text style={styles.phoneBannerEmoji}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.phoneBannerTitle}>Add Mobile Number</Text>
              <Text style={styles.phoneBannerSub}>Organizers need your phone number for event attendance verification</Text>
            </View>
          </View>
          <View style={styles.phoneBannerInputRow}>
            <TextInput
              style={styles.phoneBannerInput}
              placeholder="Enter mobile number"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            <TouchableOpacity style={styles.phoneBannerBtn} onPress={saveMobileNumber} disabled={savingPhone}>
              <Text style={styles.phoneBannerBtnText}>{savingPhone ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchEmoji}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events by name or location..."
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

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Events List ({filteredEvents.length})</Text>

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{searchQuery ? '🔍' : '📭'}</Text>
          <Text style={styles.emptyTitle}>{searchQuery ? 'No Events Found' : 'No Events Yet'}</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? `No events match "${searchQuery}"` : 'Events will appear here once created by admin'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  phoneBanner: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.warning + '18',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning + '40',
  },
  phoneBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  phoneBannerEmoji: {
    fontSize: 24,
  },
  phoneBannerTitle: {
    color: theme.colors.warning,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  phoneBannerSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  phoneBannerInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  phoneBannerInput: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  phoneBannerBtn: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneBannerBtnText: {
    color: '#000',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  searchEmoji: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },
  devotionalHeader: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 150,
  },
  eventCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.md,
  },
  mapContainer: {
    height: 120,
    backgroundColor: theme.colors.bgElevated,
    position: 'relative',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard + 'E0',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventInfo: {
    padding: theme.spacing.md,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: theme.spacing.sm,
    width: 20,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
