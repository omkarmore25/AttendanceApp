import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import theme from '../theme';
import { showAlert, showConfirm } from '../utils/dialog';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayShortNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const JapmalaReportScreen = () => {
  // 🌟 Filter Modes: 'all' (Default), 'month', 'range'
  const [filterMode, setFilterMode] = useState('all');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [report, setReport] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Admin Entry Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [entryType, setEntryType] = useState('daily'); // 'daily' or 'range'
  const [entryDate, setEntryDate] = useState(formatDateISO(new Date()));
  const [entryFrom, setEntryFrom] = useState(formatDateISO(new Date()));
  const [entryTo, setEntryTo] = useState(formatDateISO(new Date()));
  const [entryCount, setEntryCount] = useState('');
  const [entryNote, setEntryNote] = useState('Added by Admin (Phone Call)');
  const [submitting, setSubmitting] = useState(false);

  // Member Detail / Edit Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberEntries, setMemberEntries] = useState([]);
  const [loadingMemberEntries, setLoadingMemberEntries] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Single Entry Edit Modal (within member detail)
  const [editEntryItem, setEditEntryItem] = useState(null);
  const [editEntryType, setEditEntryType] = useState('daily');
  const [editDateVal, setEditDateVal] = useState('');
  const [editToDateVal, setEditToDateVal] = useState('');
  const [editCountVal, setEditCountVal] = useState('');
  const [editNoteVal, setEditNoteVal] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState('entryDate');
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  function formatDateISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${m}-${d.getFullYear()}`;
  }

  const getQueryParams = () => {
    if (filterMode === 'all') {
      return '';
    } else if (filterMode === 'month') {
      return `?month=${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    } else if (filterMode === 'range' && fromDate && toDate) {
      return `?from=${fromDate}&to=${toDate}`;
    }
    return '';
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = getQueryParams();
      const response = await api.get(`/japmala/report${params}`);
      setReport(response.data.report || []);
      setGrandTotal(response.data.grandTotal || 0);
      setMemberCount(response.data.memberCount || 0);
      setFetched(true);
    } catch (error) {
      console.error('Report error:', error);
      showAlert('Error', 'Failed to fetch report.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReportWithRange = async (from, to) => {
    try {
      setLoading(true);
      const response = await api.get(`/japmala/report?from=${from}&to=${to}`);
      setReport(response.data.report || []);
      setGrandTotal(response.data.grandTotal || 0);
      setMemberCount(response.data.memberCount || 0);
      setFetched(true);
    } catch (error) {
      console.error('Report error:', error);
      showAlert('Error', 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/japmala/users-list');
      setAllUsers(response.data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReport();
      fetchAllUsers();
    }, [filterMode, selectedMonth, selectedYear])
  );

  const openMemberDetail = async (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
    setLoadingMemberEntries(true);
    try {
      const params = getQueryParams();
      const response = await api.get(`/japmala/user/${member._id}${params}`);
      setMemberEntries(response.data.entries || []);
    } catch (err) {
      console.error('Error fetching member entries:', err);
      showAlert('Error', 'Failed to fetch member details.');
    } finally {
      setLoadingMemberEntries(false);
    }
  };

  const handleAdminSave = async () => {
    if (!selectedUser) {
      showAlert('Required', 'Please select a member first.');
      return;
    }
    if (!entryCount || Number(entryCount) <= 0) {
      showAlert('Required', 'Please enter a valid count of माळा.');
      return;
    }

    try {
      setSubmitting(true);
      if (entryType === 'daily') {
        await api.post('/japmala', {
          userId: selectedUser._id,
          entryType: 'daily',
          date: entryDate,
          count: Number(entryCount),
          note: entryNote,
        });
      } else {
        await api.post('/japmala', {
          userId: selectedUser._id,
          entryType: 'range',
          date: entryFrom,
          toDate: entryTo,
          count: Number(entryCount),
          note: entryNote,
        });
      }

      showAlert('✅ Success', `Saved ${entryCount} माळा for ${selectedUser.name}! This is now reflected on their profile.`);
      setShowAddModal(false);
      setSelectedUser(null);
      setEntryCount('');
      fetchReport();
      if (selectedMember) {
        openMemberDetail(selectedMember);
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (entry) => {
    setEditEntryItem(entry);
    const isRange = entry.entryType === 'range' || !!entry.toDate;
    setEditEntryType(isRange ? 'range' : 'daily');
    setEditDateVal(formatDateISO(new Date(entry.date)));
    setEditToDateVal(entry.toDate ? formatDateISO(new Date(entry.toDate)) : '');
    setEditCountVal(String(entry.count));
    setEditNoteVal(entry.note || '');
    setShowMemberModal(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editCountVal || Number(editCountVal) < 0) {
      showAlert('Invalid', 'Please enter a valid count.');
      return;
    }
    try {
      await api.put(`/japmala/${editEntryItem._id}`, {
        count: Number(editCountVal),
        note: editNoteVal,
        date: editDateVal,
        toDate: editEntryType === 'range' ? editToDateVal : null,
        entryType: editEntryType,
      });
      showAlert('✅ Updated', 'Japmala count updated successfully.');
      setShowEditModal(false);
      if (selectedMember) {
        openMemberDetail(selectedMember);
      }
      fetchReport();
    } catch (err) {
      showAlert('Error', 'Failed to update entry.');
    }
  };

  const handleDeleteEntry = (entryId) => {
    showConfirm('Delete Entry', 'Are you sure you want to delete this Japmala entry? This will update the user’s total immediately.', async () => {
      try {
        await api.delete(`/japmala/${entryId}`);
        showAlert('Deleted', 'Entry deleted.');
        if (selectedMember) {
          openMemberDetail(selectedMember);
        }
        fetchReport();
      } catch (err) {
        showAlert('Error', 'Failed to delete entry.');
      }
    });
  };

  // Calendar open helper
  const openCalendar = (target) => {
    setCalendarTarget(target);
    if (target === 'filterRange') {
      setRangeStart(fromDate || null);
      setRangeEnd(toDate || null);
    }
    setShowCalendar(true);
  };

  const handleDayPress = (dayStr) => {
    if (calendarTarget === 'filterRange') {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dayStr);
        setRangeEnd(null);
      } else {
        if (new Date(dayStr) < new Date(rangeStart)) {
          setRangeStart(dayStr);
          setRangeEnd(null);
        } else {
          setRangeEnd(dayStr);
          setFromDate(rangeStart);
          setToDate(dayStr);
          setShowCalendar(false);
          setTimeout(() => {
            fetchReportWithRange(rangeStart, dayStr);
          }, 100);
        }
      }
    } else {
      if (calendarTarget === 'entryDate') setEntryDate(dayStr);
      else if (calendarTarget === 'entryFrom') setEntryFrom(dayStr);
      else if (calendarTarget === 'entryTo') setEntryTo(dayStr);
      else if (calendarTarget === 'filterFrom') {
        setFromDate(dayStr);
        if (toDate) fetchReportWithRange(dayStr, toDate);
      }
      else if (calendarTarget === 'filterTo') {
        setToDate(dayStr);
        if (fromDate) fetchReportWithRange(fromDate, dayStr);
      }
      else if (calendarTarget === 'editDateVal') setEditDateVal(dayStr);
      else if (calendarTarget === 'editToDateVal') setEditToDateVal(dayStr);
      setShowCalendar(false);
    }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    calendarCells.push(`${calYear}-${mm}-${dd}`);
  }

  // Export PDF
  const handleExport = async () => {
    const params = getQueryParams();

    if (Platform.OS === 'web') {
      const generatePdf = async () => {
        try {
          // Use authenticated axios instance so token is automatically attached!
          const response = await api.get(`/japmala/export${params}`);
          const htmlContent = response.data;

          const container = document.createElement('div');
          container.innerHTML = htmlContent;
          document.body.appendChild(container);

          let period = 'All_Time';
          if (filterMode === 'month') {
            period = `${monthNames[selectedMonth]}_${selectedYear}`;
          } else if (filterMode === 'range' && fromDate && toDate) {
            period = `${fromDate}_to_${toDate}`;
          }

          window.html2pdf().from(container).set({
            margin: 10,
            filename: `Japmala_Report_${period}.pdf`,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          }).save().then(() => {
            document.body.removeChild(container);
          });
        } catch (err) {
          console.error('PDF error:', err);
          try {
            const token = await AsyncStorage.getItem('token');
            const tokenParam = token ? (params ? `${params}&token=${token}` : `?token=${token}`) : params;
            window.open(`${api.defaults.baseURL}/japmala/export${tokenParam}`, '_blank');
          } catch {
            window.open(`${api.defaults.baseURL}/japmala/export${params}`, '_blank');
          }
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
      try {
        const token = await AsyncStorage.getItem('token');
        const tokenParam = token ? (params ? `${params}&token=${token}` : `?token=${token}`) : params;
        window.open(`${api.defaults.baseURL}/japmala/export${tokenParam}`, '_blank');
      } catch {
        window.open(`${api.defaults.baseURL}/japmala/export${params}`, '_blank');
      }
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (u.name && u.name.toLowerCase().includes(q)) || (u.phone && u.phone.includes(q));
  });

  const renderMember = ({ item, index }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => openMemberDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.memberRank}>
        <Text style={styles.memberRankText}>{index + 1}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        {item.phone ? <Text style={styles.memberPhone}>📞 {item.phone}</Text> : null}
      </View>
      <View style={styles.memberTotal}>
        <Text style={styles.memberTotalCount}>{item.total}</Text>
        <Text style={styles.memberTotalLabel}>✏️ Manage</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={report}
        keyExtractor={(item) => item._id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchReport(); fetchAllUsers(); }}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Quick Add For Member Button */}
            <TouchableOpacity
              style={styles.addMemberEntryBtn}
              onPress={() => {
                setSelectedUser(null);
                setEntryCount('');
                setShowAddModal(true);
              }}
            >
              <Text style={styles.addMemberEntryEmoji}>✍️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.addMemberEntryTitle}>Add / Update Japmala for a Member</Text>
                <Text style={styles.addMemberEntrySubtitle}>If a devotee calls or informs you directly, enter their count here</Text>
              </View>
              <Text style={styles.addMemberPlus}>＋</Text>
            </TouchableOpacity>

            {/* Filter Card with 3 Tabs */}
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, filterMode === 'all' && styles.toggleBtnActive]}
                  onPress={() => setFilterMode('all')}
                >
                  <Text style={[styles.toggleText, filterMode === 'all' && styles.toggleTextActive]}>
                    🌟 All Time
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, filterMode === 'month' && styles.toggleBtnActive]}
                  onPress={() => setFilterMode('month')}
                >
                  <Text style={[styles.toggleText, filterMode === 'month' && styles.toggleTextActive]}>
                    📅 By Month
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, filterMode === 'range' && styles.toggleBtnActive]}
                  onPress={() => setFilterMode('range')}
                >
                  <Text style={[styles.toggleText, filterMode === 'range' && styles.toggleTextActive]}>
                    📆 Date Range
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Mode 1: All Time Info Banner */}
              {filterMode === 'all' && (
                <View style={styles.allTimeBanner}>
                  <Text style={styles.allTimeBannerTitle}>🌟 All-Time Grand Total Report</Text>
                  <Text style={styles.allTimeBannerSub}>
                    Consolidated report of all Japmala logged by all devotees across the entire history.
                  </Text>
                </View>
              )}

              {/* Mode 2: Month Selector */}
              {filterMode === 'month' && (
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
                    <Text style={styles.monthNavText}>← Prev</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>{monthNames[selectedMonth]} {selectedYear}</Text>
                  <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
                    <Text style={styles.monthNavText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mode 3: Custom Date Range Selector */}
              {filterMode === 'range' && (
                <View>
                  <View style={styles.dateRangeRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>FROM</Text>
                      <TouchableOpacity
                        style={styles.dateTriggerBtn}
                        onPress={() => openCalendar('filterFrom')}
                      >
                        <Text style={styles.dateTriggerText}>{fromDate ? formatDateDisplay(fromDate) : 'Select start date'}</Text>
                        <Text>📅</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>TO</Text>
                      <TouchableOpacity
                        style={styles.dateTriggerBtn}
                        onPress={() => openCalendar('filterTo')}
                      >
                        <Text style={styles.dateTriggerText}>{toDate ? formatDateDisplay(toDate) : 'Select end date'}</Text>
                        <Text>📅</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.openRangeCalBtn}
                    onPress={() => openCalendar('filterRange')}
                  >
                    <Text style={styles.openRangeCalText}>📅 Pick Range on Calendar (Select Start & End)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Summary Stats */}
            {fetched && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{memberCount}</Text>
                  <Text style={styles.statLabel}>Devotees (गुरू बंधू/भगिनी)</Text>
                </View>
                <View style={[styles.statCard, styles.statCardHighlight]}>
                  <Text style={[styles.statNumber, { color: theme.colors.accent }]}>{grandTotal}</Text>
                  <Text style={styles.statLabel}>Total माळा (एकूण)</Text>
                </View>
              </View>
            )}

            {/* Export Official PDF Button with Dynamic Label */}
            {fetched && report.length > 0 && (
              <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                <Text style={styles.exportBtnText}>
                  {filterMode === 'all'
                    ? '📄 Download All-Time Official Report (PDF)'
                    : filterMode === 'month'
                    ? `📄 Download ${monthNames[selectedMonth]} ${selectedYear} Report (PDF)`
                    : `📄 Download Range Report (${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}) (PDF)`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Section Title */}
            {fetched && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Text style={styles.sectionTitle}>Devotee Standings ({report.length})</Text>
                <Text style={styles.sectionSubtitle}>Tap member to view/edit entries</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          fetched ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📿</Text>
              <Text style={styles.emptyTitle}>No entries found</Text>
              <Text style={styles.emptyHint}>No Japmala entries recorded for this time frame.</Text>
            </View>
          ) : loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      {/* ─── MODAL 1: ADD FOR MEMBER ─── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>✍️ Add Japmala for Member</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    if (selectedMember) {
                      setShowMemberModal(true);
                    }
                  }}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Select devotee and enter their count:</Text>

              {/* User Selection */}
              <Text style={styles.inputLabel}>1. SELECT DEVOTEE / MEMBER</Text>
              {selectedUser ? (
                <View style={styles.selectedUserBadge}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                    {selectedUser.phone ? <Text style={styles.selectedUserPhone}>📞 {selectedUser.phone}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.changeUserBtn}>
                    <Text style={styles.changeUserText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="🔍 Search member by name or phone..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                  <ScrollView
                    style={styles.userPickerBox}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredUsers.map(u => (
                      <TouchableOpacity
                        key={u._id}
                        style={styles.userPickerItem}
                        onPress={() => setSelectedUser(u)}
                      >
                        <Text style={styles.userPickerName}>{u.name}</Text>
                        {u.phone ? <Text style={styles.userPickerPhone}>📞 {u.phone}</Text> : null}
                      </TouchableOpacity>
                    ))}
                    {filteredUsers.length === 0 && (
                      <Text style={styles.noUsersText}>No member found matching "{userSearch}"</Text>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Daily / Range Toggle */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>2. ENTRY TYPE</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, entryType === 'daily' && styles.toggleBtnActive]}
                  onPress={() => setEntryType('daily')}
                >
                  <Text style={[styles.toggleText, entryType === 'daily' && styles.toggleTextActive]}>Single Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, entryType === 'range' && styles.toggleBtnActive]}
                  onPress={() => setEntryType('range')}
                >
                  <Text style={[styles.toggleText, entryType === 'range' && styles.toggleTextActive]}>Date Range (Single Total)</Text>
                </TouchableOpacity>
              </View>

              {/* Date Inputs */}
              {entryType === 'daily' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DATE</Text>
                  <TouchableOpacity
                    style={styles.dateTriggerBtn}
                    onPress={() => openCalendar('entryDate')}
                  >
                    <Text style={styles.dateTriggerText}>{formatDateDisplay(entryDate)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.dateRangeRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>FROM</Text>
                    <TouchableOpacity
                      style={styles.dateTriggerBtn}
                      onPress={() => openCalendar('entryFrom')}
                    >
                      <Text style={styles.dateTriggerText}>{formatDateDisplay(entryFrom)}</Text>
                      <Text>📅</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>TO</Text>
                    <TouchableOpacity
                      style={styles.dateTriggerBtn}
                      onPress={() => openCalendar('entryTo')}
                    >
                      <Text style={styles.dateTriggerText}>{formatDateDisplay(entryTo)}</Text>
                      <Text>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Count Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>3. MALA COUNT (माळा संख्या)</Text>
                <TextInput
                  style={[styles.input, styles.countInputBig]}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                  value={entryCount}
                  onChangeText={setEntryCount}
                  keyboardType="numeric"
                />
              </View>

              {/* Note Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NOTE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional note..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={entryNote}
                  onChangeText={setEntryNote}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveAdminBtn, submitting && { opacity: 0.6 }]}
                onPress={handleAdminSave}
                disabled={submitting}
              >
                <Text style={styles.saveAdminBtnText}>
                  {submitting ? 'Saving...' : '💾 Save & Update Devotee Profile'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: MEMBER ENTRIES DETAILS ─── */}
      <Modal visible={showMemberModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📿 {selectedMember?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Total: <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>{selectedMember?.total} माळा</Text> in this period
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMemberModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.quickAddMemberBtn}
              onPress={() => {
                setSelectedUser({ _id: selectedMember._id, name: selectedMember.name, phone: selectedMember.phone });
                setShowMemberModal(false);
                setShowAddModal(true);
              }}
            >
              <Text style={styles.quickAddMemberText}>＋ Add Another Entry for {selectedMember?.name}</Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { marginTop: 12, marginBottom: 6 }]}>
              ALL LOGGED ENTRIES:
            </Text>

            {loadingMemberEntries ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : memberEntries.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginVertical: 20 }}>
                No entries found.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {memberEntries.map(entry => {
                  const isRange = entry.entryType === 'range' || !!entry.toDate;
                  return (
                    <View key={entry._id} style={styles.memberEntryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberEntryDate}>
                          {isRange
                            ? `📅 ${formatDateDisplay(entry.date)} to ${formatDateDisplay(entry.toDate)}`
                            : `🗓️ ${formatDateDisplay(entry.date)}`}
                        </Text>
                        {isRange ? <Text style={styles.rangeTag}>Date Range</Text> : null}
                        {entry.note ? <Text style={styles.memberEntryNote}>📝 {entry.note}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                        <Text style={styles.memberEntryCount}>{entry.count}</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>माळा</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.entryActionBtn}
                        onPress={() => handleOpenEdit(entry)}
                      >
                        <Text style={{ fontSize: 16 }}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.entryActionBtn, { backgroundColor: theme.colors.error + '20' }]}
                        onPress={() => handleDeleteEntry(entry._id)}
                      >
                        <Text style={{ fontSize: 16 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalCloseDoneBtn}
              onPress={() => setShowMemberModal(false)}
            >
              <Text style={styles.modalCloseDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: EDIT SINGLE/RANGE ENTRY ─── */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 380 }]}>
            <Text style={styles.modalTitle}>✏️ Edit Mala Entry</Text>

            {editEntryType === 'range' ? (
              <View style={styles.dateRangeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>FROM</Text>
                  <TouchableOpacity
                    style={styles.dateTriggerBtn}
                    onPress={() => openCalendar('editDateVal')}
                  >
                    <Text style={styles.dateTriggerText}>{formatDateDisplay(editDateVal)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>TO</Text>
                  <TouchableOpacity
                    style={styles.dateTriggerBtn}
                    onPress={() => openCalendar('editToDateVal')}
                  >
                    <Text style={styles.dateTriggerText}>{formatDateDisplay(editToDateVal)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DATE</Text>
                <TouchableOpacity
                  style={styles.dateTriggerBtn}
                  onPress={() => openCalendar('editDateVal')}
                >
                  <Text style={styles.dateTriggerText}>{formatDateDisplay(editDateVal)}</Text>
                  <Text>📅</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MALA COUNT (माळा संख्या)</Text>
              <TextInput
                style={[styles.input, styles.countInputBig]}
                value={editCountVal}
                onChangeText={setEditCountVal}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOTE</Text>
              <TextInput
                style={styles.input}
                value={editNoteVal}
                onChangeText={setEditNoteVal}
                placeholder="Optional note..."
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { flex: 1 }]}
                onPress={() => {
                  setShowEditModal(false);
                  if (selectedMember) {
                    setShowMemberModal(true);
                  }
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveAdminBtn, { flex: 1, marginTop: 0 }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveAdminBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: CALENDAR MODAL (Placed LAST with high z-index) ─── */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.calModalOverlay}>
          <View style={styles.calModalContent}>
            <View style={styles.calHeader}>
              <TouchableOpacity
                onPress={() => calMonth === 0 ? (setCalMonth(11), setCalYear(calYear - 1)) : setCalMonth(calMonth - 1)}
                style={styles.calNavBtn}
              >
                <Text style={styles.calNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calTitle}>{monthNames[calMonth]} {calYear}</Text>
              <TouchableOpacity
                onPress={() => calMonth === 11 ? (setCalMonth(0), setCalYear(calYear + 1)) : setCalMonth(calMonth + 1)}
                style={styles.calNavBtn}
              >
                <Text style={styles.calNavText}>›</Text>
              </TouchableOpacity>
            </View>

            {calendarTarget === 'filterRange' && (
              <Text style={styles.calHintText}>
                {rangeStart && !rangeEnd
                  ? `From: ${formatDateDisplay(rangeStart)} → Tap end date`
                  : 'Tap start date, then tap end date'}
              </Text>
            )}

            <View style={styles.weekDaysRow}>
              {dayShortNames.map((d, idx) => (
                <Text key={idx} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarCells.map((cellDay, index) => {
                if (!cellDay) return <View key={index} style={styles.emptyCalCell} />;
                const dayNum = parseInt(cellDay.split('-')[2], 10);
                const isToday = cellDay === formatDateISO(new Date());

                const isInRange =
                  calendarTarget === 'filterRange' &&
                  rangeStart &&
                  rangeEnd &&
                  new Date(cellDay) > new Date(rangeStart) &&
                  new Date(cellDay) < new Date(rangeEnd);

                const isSelected =
                  (calendarTarget === 'entryDate' && entryDate === cellDay) ||
                  (calendarTarget === 'entryFrom' && entryFrom === cellDay) ||
                  (calendarTarget === 'entryTo' && entryTo === cellDay) ||
                  (calendarTarget === 'filterFrom' && fromDate === cellDay) ||
                  (calendarTarget === 'filterTo' && toDate === cellDay) ||
                  (calendarTarget === 'editDateVal' && editDateVal === cellDay) ||
                  (calendarTarget === 'editToDateVal' && editToDateVal === cellDay) ||
                  (calendarTarget === 'filterRange' && (rangeStart === cellDay || rangeEnd === cellDay));

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calCell,
                      isInRange && styles.calCellInRange,
                      isSelected && styles.calCellSelected,
                    ]}
                    onPress={() => handleDayPress(cellDay)}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isToday && !isSelected && styles.calDayToday,
                        isSelected && styles.calDaySelectedText,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calActions}>
              <TouchableOpacity
                style={styles.calActionTodayBtn}
                onPress={() => handleDayPress(formatDateISO(new Date()))}
              >
                <Text style={styles.calActionTodayText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calCloseBtn}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.calCloseText}>Cancel</Text>
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
  list: { padding: theme.spacing.lg, paddingBottom: 120 },

  addMemberEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '18',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  addMemberEntryEmoji: { fontSize: 26, marginRight: 12 },
  addMemberEntryTitle: { color: theme.colors.primary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold },
  addMemberEntrySubtitle: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, marginTop: 2 },
  addMemberPlus: { color: theme.colors.primary, fontSize: 24, fontWeight: 'bold', marginLeft: 8 },

  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.xs,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  allTimeBanner: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '35',
  },
  allTimeBannerTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  allTimeBannerSub: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
    textAlign: 'center',
  },

  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navArrow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
  },
  monthNavText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  monthTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },

  dateRangeRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateTriggerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateTriggerText: { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: '600' },
  openRangeCalBtn: {
    backgroundColor: theme.colors.primary + '18',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    marginBottom: theme.spacing.sm,
  },
  openRangeCalText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  generateBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  generateBtnText: { color: '#fff', fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },

  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statCardHighlight: {
    borderColor: theme.colors.primary + '50',
  },
  statNumber: {
    fontSize: 34,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  exportBtn: {
    backgroundColor: theme.colors.accent + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    marginBottom: theme.spacing.lg,
  },
  exportBtnText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  memberRankText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: 'bold' },
  memberPhone: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, marginTop: 2 },
  memberTotal: { alignItems: 'flex-end' },
  memberTotalCount: { color: theme.colors.accent, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold },
  memberTotalLabel: { color: theme.colors.primary, fontSize: 10, marginTop: 2 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyTitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold },
  emptyHint: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  modalTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  modalSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: theme.spacing.md },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 20, color: theme.colors.textMuted, fontWeight: 'bold' },

  searchInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
  },
  userPickerBox: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgInput,
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  userPickerItem: {
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userPickerName: { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: '600' },
  userPickerPhone: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  noUsersText: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, padding: 12, textAlign: 'center' },

  selectedUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '18',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: 10,
  },
  selectedUserName: { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: 'bold' },
  selectedUserPhone: { color: theme.colors.primary, fontSize: theme.fontSize.xs, marginTop: 2 },
  changeUserBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.colors.bgElevated, borderRadius: theme.borderRadius.sm },
  changeUserText: { color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: 'bold' },

  countInputBig: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    textAlign: 'center',
    color: theme.colors.accent,
  },

  saveAdminBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  saveAdminBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold },

  quickAddMemberBtn: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginVertical: 6,
  },
  quickAddMemberText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: theme.fontSize.sm },

  memberEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 6,
  },
  memberEntryDate: { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: '600' },
  rangeTag: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  memberEntryNote: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 },
  memberEntryCount: { color: theme.colors.accent, fontSize: theme.fontSize.lg, fontWeight: 'bold' },
  entryActionBtn: { padding: 6, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.bgInput, marginLeft: 6 },

  modalCloseDoneBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  modalCloseDoneText: { color: theme.colors.textPrimary, fontWeight: 'bold', fontSize: theme.fontSize.md },
  modalCancelBtn: { paddingVertical: 12, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.bgInput, alignItems: 'center' },
  modalCancelText: { color: theme.colors.textSecondary, fontWeight: 'bold', fontSize: theme.fontSize.md },

  // Calendar Modal Styles with high z-index
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    zIndex: 999999,
    elevation: 999999,
  },
  calModalContent: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.colors.primary + '50',
    zIndex: 1000000,
    elevation: 1000000,
  },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  calNavBtn: { padding: 8, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.bgElevated },
  calNavText: { color: theme.colors.primary, fontSize: 22, fontWeight: 'bold' },
  calTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: 'bold' },
  calHintText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 6 },
  weekDayText: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: 'bold', width: 40, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  calCell: { width: '14.28%', height: 38, justifyContent: 'center', alignItems: 'center', marginVertical: 2, borderRadius: 19 },
  emptyCalCell: { width: '14.28%', height: 38 },
  calCellInRange: { backgroundColor: theme.colors.primary + '30', borderRadius: 0 },
  calCellSelected: { backgroundColor: theme.colors.primary, borderRadius: 19 },
  calDayText: { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: '500' },
  calDayToday: { color: theme.colors.accent, fontWeight: 'bold' },
  calDaySelectedText: { color: '#fff', fontWeight: 'bold' },
  calActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  calActionTodayBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: theme.colors.bgInput, borderRadius: theme.borderRadius.md },
  calActionTodayText: { color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: 'bold' },
  calCloseBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: theme.colors.bgElevated, borderRadius: theme.borderRadius.md },
  calCloseText: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: '600' },
});

export default JapmalaReportScreen;
