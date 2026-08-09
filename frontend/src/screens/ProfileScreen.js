import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import api from '../api/client';
import { showAlert, showConfirm } from '../utils/dialog';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

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
      });

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
});

export default ProfileScreen;
