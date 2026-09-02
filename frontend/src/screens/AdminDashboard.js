import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import theme from '../theme';
import { showAlert } from '../utils/dialog';

// ─── Stat Card Component (Defined outside to prevent unmounting) ───
const StatCard = ({ emoji, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Action Card Component (Defined outside, with pointer cursor & reliable click) ───
const ActionCard = ({ emoji, title, subtitle, onPress, accentColor }) => (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.actionIcon, { backgroundColor: accentColor + '20' }]} pointerEvents="none">
      <Text style={styles.actionEmoji}>{emoji}</Text>
    </View>
    <View style={styles.actionInfo} pointerEvents="none">
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.actionArrow} pointerEvents="none">›</Text>
  </TouchableOpacity>
);

const AdminDashboard = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [savingUser, setSavingUser] = useState(false);

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
      fetchStats();
    }, [])
  );

  const handleNavigate = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (err) {
      console.error('Direct navigation failed, attempting nested:', err);
      navigation.navigate('AdminHomeTab', { screen: screenName });
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      showAlert('Missing Field', 'Please enter devotee / user name.');
      return;
    }

    try {
      setSavingUser(true);
      await api.post('/admin/manual-users', {
        name: newUserName.trim(),
        username: newUserName.trim(),
        phone: newUserPhone.trim(),
      });

      showAlert('✅ User Created', `Devotee "${newUserName.trim()}" created successfully and added to all lists.`);
      setNewUserName('');
      setNewUserPhone('');
      setShowAddUserModal(false);
      fetchStats();
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to create user');
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.devotionalHeader}>जय सच्चिदानंद 🚩</Text>
            <Text style={styles.userName}>Admin Panel — {user?.username || user?.name || 'Admin'} 🛡️</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
            subtitle="View all accounts & remove permanently"
            accentColor={theme.colors.primary}
            onPress={() => handleNavigate('ManageUsers')}
          />
          <ActionCard
            emoji="👤➕"
            title="Add User"
            subtitle="Add a new devotee / non-smartphone account"
            accentColor={theme.colors.accent}
            onPress={() => setShowAddUserModal(true)}
          />
          <ActionCard
            emoji="➕"
            title="Create Event"
            subtitle="Schedule a new cultural program"
            accentColor={theme.colors.info}
            onPress={() => handleNavigate('CreateEvent')}
          />
          <ActionCard
            emoji="📋"
            title="Manage Events"
            subtitle="View, activate, or complete events"
            accentColor={theme.colors.primaryLight}
            onPress={() => handleNavigate('ManageEvents')}
          />
          <ActionCard
            emoji="📝"
            title="Offline Attendance"
            subtitle="Mark attendance for kids & non-smartphone users"
            accentColor={theme.colors.warning}
            onPress={() => handleNavigate('ManualAttendance')}
          />
          <ActionCard
            emoji="🏷️"
            title="Manage Groups"
            subtitle="Create, view, and delete groups & members"
            accentColor={theme.colors.primaryLight}
            onPress={() => handleNavigate('ManageGroups')}
          />
          <ActionCard
            emoji="📿"
            title="Japmala Report"
            subtitle="View consolidated Japmala counts of all members"
            accentColor={theme.colors.success}
            onPress={() => handleNavigate('JapmalaReport')}
          />
        </View>
      </ScrollView>

      {/* ─── ADD USER MODAL ─── */}
      <Modal visible={showAddUserModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>👤 Add Devotee / User</Text>
                <Text style={styles.modalSubtitle}>Create an account for kids, elders, or devotees without smartphones.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME (नाव) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter devotee name..."
                placeholderTextColor={theme.colors.textMuted}
                value={newUserName}
                onChangeText={setNewUserName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER (फोन नंबर) - OPTIONAL</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number..."
                placeholderTextColor={theme.colors.textMuted}
                value={newUserPhone}
                onChangeText={setNewUserPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddUserModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingUser && { opacity: 0.6 }]}
                onPress={handleAddUser}
                disabled={savingUser}
              >
                {savingUser ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  devotionalHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  logoutBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
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
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalCancelBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgElevated,
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  modalSubmitBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    minWidth: 120,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
});

export default AdminDashboard;
