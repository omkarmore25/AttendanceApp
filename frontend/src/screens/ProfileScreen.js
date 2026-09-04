import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import api from '../api/client';
import { showAlert, showConfirm } from '../utils/dialog';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age !== undefined && user?.age !== null ? String(user.age) : '');
  const [saving, setSaving] = useState(false);

  // Japmala summary state
  const [japmalaTotal, setJapmalaTotal] = useState(0);
  const [japmalaDays, setJapmalaDays] = useState(0);
  const [loadingJapmala, setLoadingJapmala] = useState(true);

  const fetchJapmalaStats = async () => {
    try {
      const res = await api.get('/japmala/my');
      setJapmalaTotal(res.data.total ?? 0);
      setJapmalaDays(res.data.days ?? res.data.count ?? 0);
    } catch (err) {
      console.error('Error fetching japmala stats:', err);
    } finally {
      setLoadingJapmala(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJapmalaStats();
      if (user) {
        setName(user.name || user.username || '');
        setPhone(user.phone || '');
        setAge(user.age !== undefined && user.age !== null ? String(user.age) : '');
      }
    }, [user])
  );

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showAlert('Missing Field', 'Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/auth/profile', {
        name: name.trim(),
        username: name.trim(),
        phone: phone.trim(),
        age: age.trim() ? Number(age.trim()) : null,
      });

      if (response.data.user && updateUserProfile) {
        updateUserProfile(response.data.user);
      }

      showAlert('✅ Profile Updated', 'Your profile details have been saved.');
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      '🚨 Delete Account',
      'Are you sure you want to permanently delete your account? All your attendance history will be erased from the database.',
      async () => {
        try {
          await api.delete('/auth/account');
          showAlert('Account Deleted', 'Your account has been permanently removed.');
          logout();
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Failed to delete account');
        }
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.title}>{user?.username || user?.name || 'User Profile'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'Admin' ? '🛡️ Administrator' : '👤 Standard User'}</Text>
        </View>
      </View>

      {/* 📿 Japmala Card on Profile */}
      <View style={[styles.card, styles.japmalaCard]}>
        <View style={styles.japmalaHeaderRow}>
          <Text style={styles.japmalaCardTitle}>📿 JAPMALA RECORD (जपानुष्ठान)</Text>
          <Text style={styles.japmalaLiveBadge}>● Live</Text>
        </View>
        <Text style={styles.japmalaSubtitle}>Includes your entries & entries verified by Secretary / Admin</Text>

        <View style={styles.japmalaStatsRow}>
          <View style={styles.japmalaStatBox}>
            <Text style={styles.japmalaNumber}>{loadingJapmala ? '—' : japmalaTotal}</Text>
            <Text style={styles.japmalaLabel}>Total Malas (एकूण माळा)</Text>
          </View>
          <View style={styles.japmalaDivider} />
          <View style={styles.japmalaStatBox}>
            <Text style={styles.japmalaNumber}>{loadingJapmala ? '—' : japmalaDays}</Text>
            <Text style={styles.japmalaLabel}>Total Days (एकूण दिवस)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openJapmalaBtn}
          onPress={() => navigation.navigate('JapmalaTab')}
        >
          <Text style={styles.openJapmalaBtnText}>📿 Open Japmala Tracker / नोंदी पहा →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>EDIT PROFILE DETAILS</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>FULL NAME / USERNAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>MOBILE NUMBER (FOR EVENT ORGANIZERS)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter mobile number (e.g. 9876543210)"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>AGE / वय (YEARS)</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age (e.g. 45)"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.inputGroupDisabled}>
          <Text style={styles.inputLabel}>EMAIL ADDRESS (PRIMARY ID)</Text>
          <Text style={styles.disabledValue}>{user?.email}</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Save Profile Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Account Settings / Actions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>🚪 Logout Session</Text>
        </TouchableOpacity>

        {user?.role !== 'Admin' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>🗑 Delete Account Permanently</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Subtle Legal Footer ─── */}
      <View style={styles.subtleLegalFooter}>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.subtleLegalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.subtleDot}>•</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.subtleLegalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '25',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: 40,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  email: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.bgCard,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleText: {
    color: theme.colors.primaryLight,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Japmala Card Styles
  japmalaCard: {
    borderColor: theme.colors.primary + '60',
    backgroundColor: theme.colors.bgCard,
  },
  japmalaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  japmalaCardTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 1.2,
  },
  japmalaLiveBadge: {
    color: theme.colors.success,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  japmalaSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  japmalaStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
  },
  japmalaStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  japmalaNumber: {
    fontSize: 28,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.accent,
  },
  japmalaLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  japmalaDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
  },
  openJapmalaBtn: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  openJapmalaBtnText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputGroupDisabled: {
    marginBottom: theme.spacing.lg,
    opacity: 0.7,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
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
  disabledValue: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  logoutBtn: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  deleteBtn: {
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  deleteText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  subtleLegalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: theme.spacing.xl,
    paddingBottom: 40,
  },
  subtleLegalLink: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
  },
  subtleDot: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
});

export default ProfileScreen;
