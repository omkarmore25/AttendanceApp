import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';
import { showConfirm, showAlert } from '../utils/dialog';

const EventAttendanceScreen = ({ route }) => {
  const { eventId, eventName } = route.params;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const response = await api.get(`/attendance/event/${eventId}`);
      setRecords(response.data.attendance || []);
    } catch (error) {
      console.error('Attendance fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAttendance();
    }, [])
  );

  const deleteRecord = (attendanceId, userName) => {
    showConfirm(
      'Remove Attendance',
      `Are you sure you want to remove ${userName} from the present list?`,
      async () => {
        try {
          await api.delete(`/admin/attendance/${attendanceId}`);
          fetchAttendance();
          showAlert('✅ Attendance Removed', `${userName} marked absent.`);
        } catch (error) {
          showAlert('Error', 'Failed to remove attendance record.');
        }
      }
    );
  };

  const downloadAttendanceDoc = () => {
    if (records.length === 0) {
      showAlert('No Records', 'There are no attendance records to download.');
      return;
    }

    const reportTitle = `Sant_Samagam_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance`;

    // Create formatted HTML for Word Document (.doc)
    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${eventName} — Attendance Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #ffffff; }
          .header { text-align: center; border-bottom: 3px solid #ff6b00; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #ff6b00; margin: 0; }
          .subtitle { font-size: 16px; color: #64748b; margin-top: 4px; }
          .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
          .info-row { font-size: 14px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #ff6b00; color: #ffffff; font-size: 13px; font-weight: bold; padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
          td { font-size: 13px; padding: 9px 10px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge-self { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .badge-admin { background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🚩 जय सच्चिदानंद — Sant Samagam</div>
          <div class="subtitle">Official Attendance Roster Report</div>
        </div>

        <div class="info-card">
          <div class="info-row"><b>Event Name / Venue:</b> ${eventName}</div>
          <div class="info-row"><b>Total Present Attendees:</b> ${records.length} Users</div>
          <div class="info-row"><b>Report Generated Date:</b> ${new Date().toLocaleString('en-IN')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Attendee Name</th>
              <th>Mobile Number</th>
              <th>Email Address</th>
              <th>Verification Mode</th>
              <th>Attendance Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((item, index) => `
              <tr>
                <td><b>${index + 1}</b></td>
                <td><b>${item.user_id?.name || item.user_id?.username || 'Unknown'}</b></td>
                <td>${item.user_id?.phone || '—'}</td>
                <td>${item.user_id?.email || '—'}</td>
                <td>
                  <span class="${item.marked_by === 'Self' ? 'badge-self' : 'badge-admin'}">
                    ${item.marked_by === 'Self' ? '📍 GPS Verified' : '👤 Admin Marked'}
                  </span>
                </td>
                <td>${new Date(item.timestamp).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by Sant Samagam Attendance System
        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportTitle}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert('✅ Document Downloaded!', `Attendance document for "${eventName}" (${records.length} attendees) saved as .doc file.`);
    } else {
      // Mobile native app: trigger download data URI link
      const encodedUri = 'data:application/msword;charset=utf-8,' + encodeURIComponent(docHtml);
      const link = document.createElement('a');
      link.href = encodedUri;
      link.setAttribute('download', `${reportTitle}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert('✅ Document Generated!', `Attendance document for "${eventName}" saved successfully.`);
    }
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderRecord = ({ item, index }) => (
    <View style={styles.record}>
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <View style={styles.recordInfo}>
        <Text style={styles.recordName}>{item.user_id?.name || 'Unknown'}</Text>
        <Text style={styles.recordPhone}>📱 {item.user_id?.phone || '—'}</Text>
      </View>

      <View style={styles.recordMeta}>
        <View style={[
          styles.markedByBadge,
          { backgroundColor: item.marked_by === 'Self' ? theme.colors.accent + '20' : theme.colors.warning + '20' }
        ]}>
          <Text style={[
            styles.markedByText,
            { color: item.marked_by === 'Self' ? theme.colors.accent : theme.colors.warning }
          ]}>
            {item.marked_by === 'Self' ? '📍 Self' : '👤 Admin'}
          </Text>
        </View>
        <Text style={styles.recordTime}>{formatTime(item.timestamp)}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteRecord(item._id, item.user_id?.name || 'User')}
      >
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
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
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title} numberOfLines={1}>{eventName}</Text>
          <Text style={styles.subtitle}>{records.length} Attendees Total</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={downloadAttendanceDoc}>
          <Text style={styles.exportBtnText}>📄 Download Doc</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No attendance records yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm,
  },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.primary, fontWeight: theme.fontWeight.bold, marginTop: 2 },
  exportBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exportBtnText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  list: { padding: theme.spacing.lg, paddingBottom: 100 },
  record: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border,
  },
  indexBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md,
  },
  indexText: { color: theme.colors.primary, fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },
  recordInfo: { flex: 1 },
  recordName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
  recordPhone: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 2 },
  recordMeta: { alignItems: 'flex-end', marginRight: theme.spacing.sm },
  markedByBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: 3, borderRadius: theme.borderRadius.sm, marginBottom: 4 },
  markedByText: { fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold },
  recordTime: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
  deleteBtn: {
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.sm, marginLeft: 4,
  },
  deleteBtnText: { color: theme.colors.error, fontSize: 16 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, fontSize: theme.fontSize.md },
});

export default EventAttendanceScreen;
