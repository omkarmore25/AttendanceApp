import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import theme from '../theme';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!stats) setLoading(true);
      fetchStats();
    }, [stats])
  );

  const StatCard = ({ emoji, label, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionCard = ({ emoji, title, subtitle, onPress, accentColor }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.actionIcon, { backgroundColor: accentColor + '20' }]}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <View style={styles.actionInfo}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.devotionalHeader}>जय सच्चिदानंद 🚩</Text>
          <Text style={styles.userName}>Admin Panel — {user?.username || user?.name || 'Admin'} 🛡️</Text>
        </View>
      </View>

      {/* Stats Grid */}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard emoji="👥" label="Total Users" value={stats?.totalUsers} color={theme.colors.primary} />
          <StatCard emoji="📝" label="Offline Users" value={stats?.manualUsers} color={theme.colors.warning} />
          <StatCard emoji="📅" label="Total Events" value={stats?.totalEvents} color={theme.colors.accent} />
          <StatCard emoji="🟢" label="Active Events" value={stats?.activeEvents} color={theme.colors.success} />
        </View>
      )}

      {/* Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actions}>
        <ActionCard
          emoji="👥"
          title="Manage Users"
          subtitle="View all accounts & remove permenantly"
          accentColor={theme.colors.primary}
          onPress={() => navigation.navigate('ManageUsers')}
        />
        <ActionCard
          emoji="➕"
          title="Create Event"
          subtitle="Schedule a new cultural program"
          accentColor={theme.colors.accent}
          onPress={() => navigation.navigate('CreateEvent')}
        />
        <ActionCard
          emoji="📋"
          title="Manage Events"
          subtitle="View, activate, or complete events"
          accentColor={theme.colors.info}
          onPress={() => navigation.navigate('ManageEvents')}
        />
        <ActionCard
          emoji="📝"
          title="Offline Attendance"
          subtitle="Mark attendance for kids & non-smartphone users"
          accentColor={theme.colors.warning}
          onPress={() => navigation.navigate('ManualAttendance')}
        />
        <ActionCard
          emoji="🏷️"
          title="Manage Groups"
          subtitle="Create, view, and delete groups & members"
          accentColor={theme.colors.primaryLight}
          onPress={() => navigation.navigate('ManageGroups')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  devotionalHeader: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  statCard: {
    width: '47%',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 150,
    gap: theme.spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 28,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.regular,
  },
});

export default AdminDashboard;
