import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';
import { showConfirm, showAlert } from '../utils/dialog';

const ManageGroupsScreen = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creating, setCreating] = useState(false);

  // Editing members for an existing group
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editMemberIds, setEditMemberIds] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);

  // Group Detail Modal state
  const [viewingGroup, setViewingGroup] = useState(null);

  const fetchData = async () => {
    try {
      const [groupsRes, usersRes] = await Promise.all([
        api.get('/admin/groups'),
        api.get('/admin/users'),
      ]);
      setGroups(groupsRes.data.groups || []);
      // Filter out admin users from selectable member list
      const regularUsers = (usersRes.data.users || []).filter((u) => u.role !== 'Admin');
      setUsers(regularUsers);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const toggleSelectMember = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleEditMember = (userId) => {
    setEditMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      showAlert('Missing Name', 'Group name is required.');
      return;
    }

    try {
      setCreating(true);
      await api.post('/admin/groups', {
        name: groupName.trim(),
        description: groupDesc.trim(),
        memberIds: selectedMemberIds,
      });

      setGroupName('');
      setGroupDesc('');
      setSelectedMemberIds([]);
      setShowCreate(false);
      fetchData();
      showAlert('✅ Group Created!', `Group "${groupName}" created with ${selectedMemberIds.length} members.`);
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const startEditMembers = (group) => {
    setEditingGroupId(group._id);
    const currentMemberIds = (group.members || []).map((m) => m._id);
    setEditMemberIds(currentMemberIds);
  };

  const saveGroupMembers = async (groupId) => {
    try {
      setSavingMembers(true);
      await api.put(`/admin/groups/${groupId}/members`, {
        memberIds: editMemberIds,
      });
      setEditingGroupId(null);
      fetchData();
      showAlert('✅ Members Updated!');
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to update members');
    } finally {
      setSavingMembers(false);
    }
  };

  const deleteGroup = (groupId, name) => {
    showConfirm('Delete Group', `Delete "${name}"? This cannot be undone.`, async () => {
      try {
        await api.delete(`/admin/groups/${groupId}`);
        fetchData();
      } catch (error) {
        showAlert('Error', 'Failed to delete group');
      }
    });
  };

  const renderGroup = ({ item }) => {
    const isEditingThisGroup = editingGroupId === item._id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setViewingGroup(item)}
          activeOpacity={0.7}
        >
          <View style={styles.groupIcon}>
            <Text style={styles.groupEmoji}>👥</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <Text style={styles.memberCount}>
              {item.members?.length || 0} member{item.members?.length !== 1 ? 's' : ''} (Tap to view)
            </Text>
          </View>
        </TouchableOpacity>

        {/* Existing Members Chips with Phone Numbers */}
        {item.members && item.members.length > 0 && !isEditingThisGroup && (
          <TouchableOpacity
            style={styles.membersPreview}
            onPress={() => setViewingGroup(item)}
            activeOpacity={0.7}
          >
            {item.members.map((member) => (
              <View key={member._id} style={styles.memberChip}>
                <Text style={styles.memberName}>
                  👤 {member.name} {member.phone ? `· 📱 ${member.phone}` : ''}
                </Text>
              </View>
            ))}
          </TouchableOpacity>
        )}

        {/* Member Selector Panel */}
        {isEditingThisGroup ? (
          <View style={styles.editMembersSection}>
            <Text style={styles.sectionLabel}>SELECT MEMBERS FOR THIS GROUP:</Text>
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {users.map((u) => {
                const isSelected = editMemberIds.includes(u._id);
                return (
                  <TouchableOpacity
                    key={u._id}
                    style={[styles.userOption, isSelected && styles.userOptionSelected]}
                    onPress={() => toggleEditMember(u._id)}
                  >
                    <Text style={[styles.userOptionName, isSelected && styles.userOptionNameSelected]}>
                      {isSelected ? '✓ ' : '+ '} {u.username || u.name} ({u.email}) {u.is_manual_entry ? '📝 (Offline)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => saveGroupMembers(item._id)}
                disabled={savingMembers}
              >
                {savingMembers ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Members ({editMemberIds.length})</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setEditingGroupId(null)}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cardButtons}>
            <TouchableOpacity
              style={styles.editMembersBtn}
              onPress={() => startEditMembers(item)}
            >
              <Text style={styles.editMembersBtnText}>✏️ Edit Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteGroup(item._id, item.name)}
            >
              <Text style={styles.deleteBtnText}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        )}
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
      {/* Create Group Button */}
      <TouchableOpacity
        style={styles.createToggle}
        onPress={() => setShowCreate(!showCreate)}
      >
        <Text style={styles.createToggleText}>
          {showCreate ? '✕ Cancel' : '+ Create New Group'}
        </Text>
      </TouchableOpacity>

      {/* Create Form */}
      {showCreate && (
        <View style={styles.createForm}>
          <TextInput
            style={styles.createInput}
            placeholder="Group Name"
            placeholderTextColor={theme.colors.textMuted}
            value={groupName}
            onChangeText={setGroupName}
          />
          <TextInput
            style={[styles.createInput, { height: 50 }]}
            placeholder="Description (optional)"
            placeholderTextColor={theme.colors.textMuted}
            value={groupDesc}
            onChangeText={setGroupDesc}
          />

          <Text style={styles.sectionLabel}>ADD PEOPLE TO THIS GROUP:</Text>

          {users.length === 0 ? (
            <Text style={styles.noUsersText}>No registered users yet.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
              {users.map((u) => {
                const isSelected = selectedMemberIds.includes(u._id);
                return (
                  <TouchableOpacity
                    key={u._id}
                    style={[styles.userOption, isSelected && styles.userOptionSelected]}
                    onPress={() => toggleSelectMember(u._id)}
                  >
                    <Text style={[styles.userOptionName, isSelected && styles.userOptionNameSelected]}>
                      {isSelected ? '✓ ' : '+ '} {u.username || u.name} ({u.email}) {u.is_manual_entry ? '📝 (Offline)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.createSubmitBtn}
            onPress={createGroup}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.createSubmitText}>
                Create Group ({selectedMemberIds.length} members selected)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No groups created yet</Text>
          </View>
        }
      />

      {/* Group Members Detail Modal */}
      <Modal
        visible={!!viewingGroup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewingGroup(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setViewingGroup(null)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>👥 {viewingGroup?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {viewingGroup?.members?.length || 0} Members in this group
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setViewingGroup(null)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340, marginVertical: 12 }} showsVerticalScrollIndicator={true}>
              {viewingGroup?.members && viewingGroup.members.length > 0 ? (
                viewingGroup.members.map((member, idx) => (
                  <View key={member._id || idx} style={styles.memberCardRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberCardName}>
                        {member.name || member.username} {member.is_manual_entry ? '📝 (Offline)' : ''}
                      </Text>
                      <Text style={styles.memberCardPhone}>
                        📱 {member.phone ? member.phone : 'No Mobile Number'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noMembersText}>No members in this group.</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setViewingGroup(null)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
  createToggle: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  createToggleText: { color: theme.colors.info, fontWeight: theme.fontWeight.semibold },
  createForm: {
    marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.bgCard, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  createInput: {
    backgroundColor: theme.colors.bgInput, borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    color: theme.colors.textPrimary, fontSize: theme.fontSize.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold, letterSpacing: 1, marginTop: 4,
  },
  noUsersText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  userOption: {
    paddingVertical: 8, paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.bgElevated,
    marginBottom: 4, borderWidth: 1, borderColor: theme.colors.border,
  },
  userOptionSelected: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
  },
  userOptionName: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  userOptionNameSelected: { color: theme.colors.primaryLight, fontWeight: theme.fontWeight.bold },
  createSubmitBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  createSubmitText: { color: '#fff', fontWeight: theme.fontWeight.bold },
  list: { padding: theme.spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: theme.colors.bgCard, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, marginBottom: theme.spacing.md,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  groupIcon: {
    width: 44, height: 44, borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.info + '20', justifyContent: 'center',
    alignItems: 'center', marginRight: theme.spacing.md,
  },
  groupEmoji: { fontSize: 22 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  groupDesc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  memberCount: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4 },
  membersPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: theme.spacing.md },
  memberChip: {
    backgroundColor: theme.colors.bgElevated, paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4, borderRadius: theme.borderRadius.full,
  },
  memberName: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  cardButtons: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  editMembersBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    backgroundColor: theme.colors.info + '15', borderRadius: theme.borderRadius.md,
  },
  editMembersBtnText: { color: theme.colors.info, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
  deleteBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    backgroundColor: theme.colors.error + '10', borderRadius: theme.borderRadius.md,
  },
  deleteBtnText: { color: theme.colors.error, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
  editMembersSection: {
    marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm,
    borderTopWidth: 1, borderTopColor: theme.colors.border, gap: theme.spacing.xs,
  },
  editActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  saveBtn: {
    flex: 1, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    paddingVertical: 10, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },
  cancelEditBtn: {
    paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    backgroundColor: theme.colors.bgElevated, borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelEditText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
  },
  memberCardName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  memberCardPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },
  noMembersText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    paddingVertical: 20,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
});

export default ManageGroupsScreen;
