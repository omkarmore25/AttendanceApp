import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import api from '../api/client';
import theme from '../theme';
import { reverseGeocode } from '../utils/reverseGeocode';
import { showAlert } from '../utils/dialog';

const { width } = Dimensions.get('window');

const EventDetailScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.event);

      // Reverse geocode
      const addr = await reverseGeocode(
        response.data.event.latitude,
        response.data.event.longitude
      );
      setAddress(addr);
    } catch (error) {
      showAlert('Error', 'Failed to load event details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setMarking(true);
      setAttendanceStatus(null);
      setErrorMessage('');

      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permission Denied',
          'Location permission is required to mark attendance. Please enable it in Settings.'
        );
        setMarking(false);
        return;
      }

      // 2. Get current GPS coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // 3. Send to backend for geofence verification
      const response = await api.post('/attendance/mark', {
        eventId: event._id,
        latitude,
        longitude,
      });

      setAttendanceStatus('success');
      showAlert('✅ Success!', response.data.message);
    } catch (error) {
      setAttendanceStatus('error');
      const message = error.response?.data?.message || 'Failed to mark attendance';
      setErrorMessage(message);
      showAlert('❌ Attendance Failed', message);
    } finally {
      setMarking(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return theme.colors.success;
      case 'Upcoming': return theme.colors.info;
      case 'Completed': return theme.colors.textMuted;
      default: return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!event) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Map Header */}
      <View style={styles.mapArea}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPin}>📍</Text>
          <Text style={styles.mapCoords}>
            {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
          </Text>
        </View>
        <View style={styles.radiusBadge}>
          <Text style={styles.radiusText}>📡 {event.radius_in_meters}m radius</Text>
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.content}>
        {/* Status + Name */}
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(event.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(event.status) }]} />
            <Text style={[styles.statusLabel, { color: getStatusColor(event.status) }]}>
              {event.status}
            </Text>
          </View>
        </View>

        <Text style={styles.eventName}>{event.name}</Text>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(event.scheduled_date)}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoLabel}>Start Time</Text>
            <Text style={styles.infoValue}>{formatTime12h(event.start_time)}</Text>
          </View>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.addressText}>
              {address?.full || 'Loading address...'}
            </Text>
          </View>
        </View>

        {/* Attendance Button / Status */}
        {event.status === 'Active' && (
          <View style={styles.attendanceSection}>
            {attendanceStatus === 'success' ? (
              <View style={styles.successCard}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successTitle}>Attendance Marked!</Text>
                <Text style={styles.successSubtitle}>Your presence has been recorded</Text>
              </View>
            ) : (
              <>
                {attendanceStatus === 'error' && errorMessage ? (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorEmoji}>❌</Text>
                    <Text style={styles.errorTitle}>Attendance Rejected</Text>
                    <Text style={styles.errorSubtitle}>{errorMessage}</Text>
                  </View>
                ) : null}

                <Text style={styles.attendanceHint}>
                  You must be within {event.radius_in_meters}m of the venue
                </Text>
                <TouchableOpacity
                  style={[styles.attendanceBtn, marking && styles.attendanceBtnDisabled]}
                  onPress={handleMarkAttendance}
                  disabled={marking}
                  activeOpacity={0.8}
                >
                  {marking ? (
                    <View style={styles.markingRow}>
                      <ActivityIndicator color="#000" size="small" />
                      <Text style={styles.attendanceBtnText}>  Verifying Distance...</Text>
                    </View>
                  ) : (
                    <Text style={styles.attendanceBtnText}>📍 Mark Attendance</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {event.status === 'Upcoming' && (
          <View style={styles.upcomingCard}>
            <Text style={styles.upcomingEmoji}>⏳</Text>
            <Text style={styles.upcomingText}>
              Attendance will be available once the event is marked as Active by the admin
            </Text>
          </View>
        )}

        {event.status === 'Completed' && (
          <View style={styles.completedCard}>
            <Text style={styles.completedEmoji}>✔️</Text>
            <Text style={styles.completedText}>This event has been completed</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  mapArea: {
    height: 220,
    backgroundColor: theme.colors.bgElevated,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapPin: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  mapCoords: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  radiusBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary + '30',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  radiusText: {
    color: theme.colors.primaryLight,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    padding: theme.spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  addressInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  addressText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  attendanceSection: {
    marginTop: theme.spacing.md,
  },
  attendanceHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  attendanceBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    ...theme.shadow.glow,
    shadowColor: theme.colors.accent,
  },
  attendanceBtnDisabled: {
    opacity: 0.7,
  },
  attendanceBtnText: {
    color: theme.colors.textDark,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  markingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: theme.colors.success + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  successTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  errorCard: {
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error + '40',
    marginBottom: theme.spacing.md,
  },
  errorEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  upcomingCard: {
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  upcomingEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  upcomingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  completedCard: {
    backgroundColor: theme.colors.textMuted + '15',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.textMuted + '30',
  },
  completedEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  completedText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default EventDetailScreen;
