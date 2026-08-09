import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import api from '../api/client';
import theme from '../theme';
import { showAlert, showConfirm } from '../utils/dialog';

const ManageUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (userId, userName, role) => {
    if (role === 'Admin') {
      showAlert('Protected Account', 'The Admin account cannot be deleted.');
      return;
    }

    showConfirm(
      'Delete User',
      `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
      async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          showAlert('User Deleted', `User "${userName}" has been removed.`);
          fetchUsers();
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Failed to delete user');
        }
      }
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.username || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.username || item.name}</Text>
          {item.role === 'Admin' ? (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>🛡️ Admin</Text>
            </View>
          ) : (
            <View style={[styles.typeBadge, item.is_manual_entry && styles.typeBadgeManual]}>
              <Text style={[styles.typeText, item.is_manual_entry && styles.typeTextManual]}>
                {item.is_manual_entry ? 'Offline / Manual' : 'Registered User'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.userPhone}>
          {item.phone ? `📱 ${item.phone}` : `📧 ${item.email}`}
        </Text>
        <Text style={styles.userDate}>
          Joined: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {item.role !== 'Admin' && (
        <TouchableOpacity
          style={styles.deleteIconBtn}
          onPress={() => deleteUser(item._id, item.username || item.name, item.role)}
          activeOpacity={0.75}
        >
          <Text style={styles.deleteIconText}>🗑 Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search user by username, phone, or email..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* User Counter */}
      <View style={styles.countRow}>
        <Text style={styles.countLabel}>
          Showing {filteredUsers.length} of {users.length} users
        </Text>
      </View>

      {/* User Table / List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  searchInput: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    marginTop: 4,
  },
  countLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
  },
  list: { padding: theme.spacing.lg, paddingBottom: 100 },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userInfo: { flex: 1, marginRight: theme.spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  userName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  adminBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  adminText: { color: theme.colors.primaryLight, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold },
  typeBadge: {
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  typeBadgeManual: {
    backgroundColor: theme.colors.warning + '20',
  },
  typeText: { color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
  typeTextManual: { color: theme.colors.warning },
  userPhone: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  userDate: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  deleteIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#dc2626',
  },
  deleteIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md },
});

export default ManageUsersScreen;
