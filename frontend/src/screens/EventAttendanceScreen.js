import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';
import { showConfirm, showAlert } from '../utils/dialog';
import * as WebBrowser from 'expo-web-browser';

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

  const downloadAttendanceDoc = async () => {
    if (records.length === 0) {
      showAlert('No Records', 'There are no attendance records to download.');
      return;
    }

    const reportTitle = `Sant_Samagam_${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance`;

    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${eventName} — Attendance PDF Report</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 24px;
            color: #0f172a;
            background-color: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #ff6b00;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #ff6b00;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-top: 4px;
          }
          .info-card {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
          }
          .info-row {
            font-size: 13px;
            margin-bottom: 4px;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #ff6b00 !important;
            color: #ffffff !important;
            font-size: 12px;
            font-weight: bold;
            padding: 10px 8px;
            border: 1px solid #ff6b00;
            text-align: left;
          }
          td {
            font-size: 12px;
            padding: 9px 8px;
            border: 1px solid #cbd5e1;
            color: #0f172a;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge-self {
            background-color: #dcfce7;
            color: #166534;
            padding: 3px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
          }
          .badge-admin {
            background-color: #fef3c7;
            color: #92400e;
            padding: 3px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Sant Samagam (Satsang Attendance)</div>
          <div class="subtitle">Official Attendance Report</div>
        </div>

        <div class="info-card">
          <div class="info-row"><b>Event Name / Venue:</b> ${eventName}</div>
          <div class="info-row"><b>Total Attendees Present:</b> ${records.length} Users</div>
          <div class="info-row"><b>Report Generated Date:</b> ${new Date().toLocaleString('en-IN')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">#</th>
              <th style="width: 30%;">Attendee Name</th>
              <th style="width: 22%;">Mobile Number</th>
              <th style="width: 18%;">Verification</th>
              <th style="width: 22%;">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((item, index) => `
              <tr>
                <td style="text-align: center;"><b>${index + 1}</b></td>
                <td><b>${item.user_id?.name || item.user_id?.username || 'Unknown'}</b></td>
                <td>${item.user_id?.phone || '—'}</td>
                <td>
                  <span class="${item.marked_by === 'Self' ? 'badge-self' : 'badge-admin'}">
                    ${item.marked_by === 'Self' ? 'GPS Verified' : 'Admin Marked'}
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
      const element = document.createElement('div');
      element.innerHTML = pdfHtml;
      element.style.width = '700px';
      element.style.padding = '20px';
      element.style.backgroundColor = '#ffffff';

      const opt = {
        margin: 10,
        filename: `${reportTitle}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const generatePdf = () => {
        if (window.html2pdf) {
          window.html2pdf().set(opt).from(element).save().then(() => {
            showAlert('✅ PDF Downloaded!', `Attendance report saved as "${reportTitle}.pdf" in Downloads.`);
          }).catch((err) => {
            console.error('PDF generation error:', err);
          });
        }
      };

      if (window.html2pdf) {
        generatePdf();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = generatePdf;
        document.body.appendChild(script);
      }
    } else {
      const downloadUrl = `${api.defaults.baseURL}/attendance/export-doc/${eventId}`;
      try {
        await Linking.openURL(downloadUrl);
        showAlert('📥 Downloading...', 'Downloading attendance report to your phone Downloads folder.');
      } catch (err) {
        console.error('Download error:', err);
        try {
          await WebBrowser.openBrowserAsync(downloadUrl);
        } catch (wbErr) {
          showAlert('Download Error', 'Could not open download link.');
        }
      }
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
          <Text style={styles.exportBtnText}>📄 Download PDF</Text>
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
  list: { padding: theme.spacing.lg, paddingBottom: 150 },
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
