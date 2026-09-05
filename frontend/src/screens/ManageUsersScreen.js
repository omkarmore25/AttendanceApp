import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import api from '../api/client';
import theme from '../theme';
import { toMarathiDigits, toEnglishDigits } from '../utils/marathiUtils';

const ManageUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Delete Modal State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Edit User Modal State
  const [userToEdit, setUserToEdit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAge, setEditAge] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (isRetry = false) => {
    try {
      if (!isRetry && users.length === 0) setLoading(true);
      setFeedbackMsg('');
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!isRetry) {
        // Auto silent retry after 1.2s to absorb Render cold wake-ups
        setTimeout(() => fetchUsers(true), 1200);
      } else {
        setFeedbackMsg('❌ Failed to load users. Please tap below or pull down to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    setEditName(user.name || user.username || '');
    setEditPhone(user.phone || '');
    setEditAge(user.age !== undefined && user.age !== null ? String(user.age) : '');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      alert('Please enter a name.');
      return;
    }

    try {
      setSavingEdit(true);
      const response = await api.put(`/admin/users/${userToEdit._id}`, {
        name: editName.trim(),
        username: editName.trim(),
        phone: editPhone.trim(),
        age: editAge.trim() ? Number(editAge.trim()) : null,
      });

      // Update local state immediately
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userToEdit._id
            ? {
                ...u,
                name: editName.trim(),
                username: editName.trim(),
                phone: editPhone.trim(),
                age: editAge.trim() ? Number(editAge.trim()) : null,
              }
            : u
        )
      );

      setFeedbackMsg(`✅ Profile of "${editName.trim()}" updated successfully.`);
      setUserToEdit(null);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (error) {
      console.error('Edit user error:', error);
      alert(error.response?.data?.message || 'Failed to update user.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${userToDelete._id}`);
      setFeedbackMsg(`✅ User "${userToDelete.username || userToDelete.name}" was permanently deleted.`);
      setUserToDelete(null);
      // Immediately remove from local list
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (error) {
      console.error('Delete user error:', error);
      alert(error.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
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
          <Text style={styles.userName}>{item.name || item.username}</Text>
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
          {item.age !== undefined && item.age !== null && item.age !== '' ? ` • 🎂 Age: ${item.age}` : ''}
        </Text>
        <Text style={styles.userDate}>
          Joined: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {item.role !== 'Admin' && (
        <View style={styles.actionButtonsRow}>
          {/* Edit button for admin-added (manual) users or registered devotees */}
          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editIconText}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteIconBtn}
            onPress={() => setUserToDelete(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIconText} pointerEvents="none">🗑 Delete</Text>
          </TouchableOpacity>
        </View>
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

      {/* Toast Feedback Notification */}
      {feedbackMsg !== '' && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{feedbackMsg}</Text>
        </View>
      )}

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No users match your search.</Text>
          </View>
        }
      />

      {/* ─── EDIT USER MODAL ─── */}
      <Modal
        visible={!!userToEdit}
        transparent
        animationType="fade"
        onRequestClose={() => setUserToEdit(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitleEdit}>✏️ Edit Devotee Profile</Text>
                <Text style={styles.modalSubtitle}>
                  {userToEdit?.is_manual_entry
                    ? 'Offline / Manual Account (Added by Admin)'
                    : 'Registered User Account'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setUserToEdit(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME (नाव) *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter devotee name..."
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER (फोन नंबर)</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="10-digit mobile number..."
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AGE / वय (YEARS)</Text>
              <TextInput
                style={styles.input}
                value={editAge}
                onChangeText={setEditAge}
                placeholder="Enter age (e.g. 45)..."
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUserToEdit(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, savingEdit && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>💾 Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── DELETE USER MODAL ─── */}
      <Modal
        visible={!!userToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setUserToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚨 Delete User Account</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to permanently delete{' '}
              <Text style={{ fontWeight: 'bold', color: theme.colors.accent }}>
                "{userToDelete?.username || userToDelete?.name}"
              </Text>
              ?
            </Text>
            <Text style={styles.modalWarning}>
              ⚠️ This will permanently remove this account, all their attendance records, and group memberships. This cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setUserToDelete(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, deleting && { opacity: 0.7 }]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>🗑️ Yes, Delete</Text>
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
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
  toast: {
    backgroundColor: '#10b98125',
    borderColor: '#10b981',
    borderWidth: 1,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  toastText: {
    color: '#10b981',
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  searchInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
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

  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  editIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  deleteIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  deleteIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
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
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  modalTitleEdit: {
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
  modalDesc: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.bgInput,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    lineHeight: 18,
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
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgElevated,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: theme.fontSize.sm,
  },
  confirmDeleteBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  confirmDeleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: theme.fontSize.sm,
  },
});

export default ManageUsersScreen;
