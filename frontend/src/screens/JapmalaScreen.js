import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';

// ─── Language Strings ───
const strings = {
  en: {
    title: '📿 Japmala Tracker',
    logEntry: 'Log Japmala',
    dailyTab: 'Daily',
    rangeTab: 'Date Range',
    date: 'Date',
    from: 'From Date',
    to: 'To Date',
    count: 'Mala Count',
    note: 'Note (optional)',
    save: 'Save',
    saving: 'Saving...',
    allTimeSummary: 'All Time Summary',
    monthSummary: 'Monthly Summary',
    filterAll: '🌟 All Time',
    filterMonth: '📅 By Month',
    totalMala: 'Total Mala',
    days: 'Days',
    history: 'History',
    noEntries: 'No entries yet',
    noEntriesHint: 'Start logging your Japmala counts!',
    editEntry: 'Edit Entry',
    update: 'Update',
    delete: 'Delete',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this entry?',
    switchLang: 'मराठी',
    mala: 'Mala',
    prevMonth: '← Prev',
    nextMonth: 'Next →',
    pickDate: '📅 Calendar',
    pickRange: '📅 Pick Range',
    apply: 'Apply Date',
    today: 'Today',
    selectRangeHint: 'Tap start date, then tap end date',
    rangeBadge: 'Date Range',
    multiMonthNotice: 'Multi-month range selected. Choose how you want to log:',
    singleRangeMode: 'Single total for entire range',
    splitMonthMode: 'Separate count per month',
  },
  mr: {
    title: '📿 जपमाळा ट्रॅकर',
    logEntry: 'जपमाळा नोंदवा',
    dailyTab: 'दैनिक',
    rangeTab: 'तारीख श्रेणी',
    date: 'तारीख',
    from: 'पासून तारीख',
    to: 'पर्यंत तारीख',
    count: 'माळा संख्या',
    note: 'टिप्पणी (ऐच्छिक)',
    save: 'जतन करा',
    saving: 'जतन करत आहे...',
    allTimeSummary: 'एकूण सर्व सारांश',
    monthSummary: 'मासिक सारांश',
    filterAll: '🌟 सर्व नोंदी',
    filterMonth: '📅 महिना निवडा',
    totalMala: 'एकूण माळा',
    days: 'दिवस',
    history: 'इतिहास',
    noEntries: 'अद्याप नोंदी नाहीत',
    noEntriesHint: 'तुमची दैनिक जपमाळा संख्या नोंदवणे सुरू करा!',
    editEntry: 'नोंद संपादित करा',
    update: 'अपडेट करा',
    delete: 'हटवा',
    cancel: 'रद्द करा',
    confirmDelete: 'तुम्हाला ही नोंद हटवायची आहे का?',
    switchLang: 'English',
    mala: 'माळा',
    prevMonth: '← मागील',
    nextMonth: 'पुढील →',
    pickDate: '📅 कॅलेंडर',
    pickRange: '📅 श्रेणी निवडा',
    apply: 'लागू करा',
    today: 'आज',
    selectRangeHint: 'सुरुवातीची तारीख आणि नंतर शेवटची तारीख निवडा',
    rangeBadge: 'तारीख श्रेणी',
    multiMonthNotice: 'दोन किंवा अधिक महिने निवडले आहेत. नोंद कशी करायची ते निवडा:',
    singleRangeMode: 'संपूर्ण श्रेणीसाठी एकच एकूण माळा संख्या',
    splitMonthMode: 'प्रत्येक महिन्यासाठी स्वतंत्र माळा संख्या',
  },
};

const monthNames = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  mr: ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'],
};

const dayShortNames = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  mr: ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
};

const JapmalaScreen = () => {
  const [lang, setLang] = useState('en');
  const t = strings[lang];

  const [entryMode, setEntryMode] = useState('daily'); // 'daily' or 'range'
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [fromDate, setFromDate] = useState(formatDateISO(new Date()));
  const [toDate, setToDate] = useState(formatDateISO(new Date()));
  const [count, setCount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Multi-Month Breakdown in Form
  const [multiMonthMode, setMultiMonthMode] = useState('single'); // 'single' or 'split'
  const [month1Count, setMonth1Count] = useState('');
  const [month2Count, setMonth2Count] = useState('');

  // Range preview for auto-merge
  const [rangePreview, setRangePreview] = useState(null);

  // Filter mode: 'all' (default, no artificial split) or 'month'
  const [filterMode, setFilterMode] = useState('all');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [entries, setEntries] = useState([]);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryDays, setSummaryDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editEntryType, setEditEntryType] = useState('daily');
  const [editDate, setEditDate] = useState('');
  const [editToDate, setEditToDate] = useState('');
  const [editCount, setEditCount] = useState('');
  const [editNote, setEditNote] = useState('');

  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState('date');
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

  // Check if fromDate and toDate belong to different months
  const isDifferentMonths = fromDate.slice(0, 7) !== toDate.slice(0, 7);
  const fromMonthLabel = `${monthNames[lang][parseInt(fromDate.slice(5, 7), 10) - 1]} ${fromDate.slice(0, 4)}`;
  const toMonthLabel = `${monthNames[lang][parseInt(toDate.slice(5, 7), 10) - 1]} ${toDate.slice(0, 4)}`;

  const fetchEntries = async () => {
    try {
      let url = '/japmala/my';
      if (filterMode === 'month') {
        const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        url += `?month=${monthStr}`;
      }
      const response = await api.get(url);
      setEntries(response.data.entries || []);
      setSummaryTotal(response.data.total || 0);
      setSummaryDays(response.data.days || 0);
    } catch (error) {
      console.error('Fetch japmala error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkRangePreview = async (from, to) => {
    if (!from || !to) return;
    try {
      const res = await api.get(`/japmala/range-preview?from=${from}&to=${to}`);
      if (res.data.count > 0) {
        setRangePreview(res.data);
      } else {
        setRangePreview(null);
      }
    } catch {
      setRangePreview(null);
    }
  };

  useEffect(() => {
    if (entryMode === 'range') {
      checkRangePreview(fromDate, toDate);
    } else {
      setRangePreview(null);
    }
  }, [fromDate, toDate, entryMode]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEntries();
    }, [filterMode, selectedMonth, selectedYear])
  );

  // ─── VALIDATION CHECKS ───
  const coveredByRange = entryMode === 'daily' && entries.find((e) => {
    if (e.entryType !== 'range' && !e.toDate) return false;
    const targetTime = new Date(date).getTime();
    const sTime = new Date(e.date).getTime();
    const eTime = new Date(e.toDate).getTime();
    return targetTime >= sTime && targetTime <= eTime;
  });

  const overlappingRange = entryMode === 'range' && entries.find((e) => {
    if (e.entryType !== 'range' && !e.toDate) return false;
    const s1 = new Date(fromDate).getTime();
    const e1 = new Date(toDate).getTime();
    const s2 = new Date(e.date).getTime();
    const e2 = new Date(e.toDate).getTime();
    return s1 <= e2 && e1 >= s2 && !(s1 === s2 && e1 === e2);
  });

  const handleSave = async () => {
    // Validation: Block daily if date is inside existing range
    if (entryMode === 'daily' && coveredByRange) {
      alert(
        lang === 'mr'
          ? `⚠️ ही तारीख (${formatDateDisplay(date)}) आधीच तारीख श्रेणीमध्ये (${formatDateDisplay(coveredByRange.date)} ते ${formatDateDisplay(coveredByRange.toDate)}) येते! कृपया खालील इतिहासामधून त्या श्रेणीमध्ये बदल करा.`
          : `⚠️ This date (${formatDateDisplay(date)}) falls inside an existing Date Range (${formatDateDisplay(coveredByRange.date)} to ${formatDateDisplay(coveredRange.toDate)})! Please edit that range in History below.`
      );
      return;
    }

    // Validation: Block range if overlapping with another range
    if (entryMode === 'range' && overlappingRange) {
      alert(
        lang === 'mr'
          ? `⚠️ ही तारीख श्रेणी आधीच असलेल्या श्रेणीशी (${formatDateDisplay(overlappingRange.date)} ते ${formatDateDisplay(overlappingRange.toDate)}) ओव्हरलॅप होते!`
          : `⚠️ This date range overlaps with an existing range (${formatDateDisplay(overlappingRange.date)} to ${formatDateDisplay(overlappingRange.toDate)})!`
      );
      return;
    }

    try {
      setSaving(true);
      if (entryMode === 'daily') {
        if (!count || Number(count) <= 0) {
          alert(lang === 'mr' ? 'कृपया वैध माळा संख्या प्रविष्ट करा.' : 'Please enter a valid count.');
          return;
        }
        await api.post('/japmala', {
          entryType: 'daily',
          date,
          count: Number(count),
          note,
        });
      } else if (isDifferentMonths && multiMonthMode === 'split') {
        if (!month1Count || !month2Count) {
          alert(lang === 'mr' ? 'कृपया दोन्ही महिन्यांसाठी संख्या प्रविष्ट करा.' : 'Please enter counts for both months.');
          return;
        }

        const d1 = new Date(fromDate);
        const endOfMonth1 = new Date(d1.getFullYear(), d1.getMonth() + 1, 0);
        const d2 = new Date(toDate);
        const startOfMonth2 = new Date(d2.getFullYear(), d2.getMonth(), 1);

        const breakdown = [
          { from: fromDate, to: formatDateISO(endOfMonth1), count: Number(month1Count) },
          { from: formatDateISO(startOfMonth2), to: toDate, count: Number(month2Count) },
        ];

        await api.post('/japmala', {
          monthlyBreakdown: breakdown,
          note,
        });
      } else {
        if (!count || Number(count) <= 0) {
          alert(lang === 'mr' ? 'कृपया वैध माळा संख्या प्रविष्ट करा.' : 'Please enter a valid count.');
          return;
        }
        await api.post('/japmala', {
          entryType: 'range',
          date: fromDate,
          toDate: toDate,
          count: Number(count),
          note,
        });
      }

      setCount('');
      setMonth1Count('');
      setMonth2Count('');
      setNote('');
      setRangePreview(null);
      alert(lang === 'mr' ? '✅ जपमाळा नोंद जतन झाली!' : '✅ Japmala entry saved!');
      fetchEntries();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save entry.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const isRange = item.entryType === 'range' || !!item.toDate;
    setEditEntryType(isRange ? 'range' : 'daily');
    setEditDate(formatDateISO(new Date(item.date)));
    setEditToDate(item.toDate ? formatDateISO(new Date(item.toDate)) : '');
    setEditCount(String(item.count));
    setEditNote(item.note || '');
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editCount || Number(editCount) < 0) return;
    try {
      await api.put(`/japmala/${editItem._id}`, {
        count: Number(editCount),
        note: editNote,
        date: editDate,
        toDate: editEntryType === 'range' ? editToDate : null,
        entryType: editEntryType,
      });
      setEditModal(false);
      fetchEntries();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update entry.';
      alert(msg);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.delete(`/japmala/${editItem._id}`);
      setEditModal(false);
      fetchEntries();
    } catch (error) {
      alert('Failed to delete entry.');
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

  // Calendar Helpers
  const openCalendar = (target) => {
    setCalendarTarget(target);
    let baseDate = new Date();
    if (target === 'date') baseDate = new Date(date);
    else if (target === 'fromDate') baseDate = new Date(fromDate);
    else if (target === 'toDate') baseDate = new Date(toDate);
    else if (target === 'editDate') baseDate = new Date(editDate);
    else if (target === 'editToDate') baseDate = new Date(editToDate);

    if (!isNaN(baseDate.getTime())) {
      setCalMonth(baseDate.getMonth());
      setCalYear(baseDate.getFullYear());
    }

    if (target === 'range') {
      setRangeStart(fromDate);
      setRangeEnd(toDate);
    } else {
      setRangeStart(null);
      setRangeEnd(null);
    }

    setShowCalendar(true);
  };

  const handleDayPress = (dayStr) => {
    if (calendarTarget === 'range') {
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
        }
      }
    } else {
      if (calendarTarget === 'date') setDate(dayStr);
      else if (calendarTarget === 'fromDate') setFromDate(dayStr);
      else if (calendarTarget === 'toDate') setToDate(dayStr);
      else if (calendarTarget === 'editDate') setEditDate(dayStr);
      else if (calendarTarget === 'editToDate') setEditToDate(dayStr);
      setShowCalendar(false);
    }
  };

  const prevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    calendarCells.push(`${calYear}-${mm}-${dd}`);
  }

  const renderEntry = ({ item }) => {
    const isRange = item.entryType === 'range' || !!item.toDate;
    return (
      <TouchableOpacity style={styles.entryRow} onPress={() => handleEdit(item)} activeOpacity={0.7}>
        <View style={styles.entryDate}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>{isRange ? '📅' : '🗓️'}</Text>
            <View>
              <Text style={styles.entryDateText}>
                {isRange
                  ? `${formatDateDisplay(item.date)}  ${lang === 'mr' ? 'ते' : 'to'}  ${formatDateDisplay(item.toDate)}`
                  : formatDateDisplay(item.date)}
              </Text>
              {isRange ? (
                <Text style={styles.rangeBadgeText}>
                  {t.rangeBadge}
                </Text>
              ) : null}
            </View>
          </View>
          {item.note ? <Text style={styles.entryNoteText}>📝 {item.note}</Text> : null}
        </View>
        <View style={styles.entryCount}>
          <Text style={styles.entryCountText}>{item.count}</Text>
          <Text style={styles.entryCountLabel}>{t.mala}</Text>
        </View>
        <Text style={styles.entryEditIcon}>✏️</Text>
      </TouchableOpacity>
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchEntries(); }}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.title}</Text>
          <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'en' ? 'mr' : 'en')}>
            <Text style={styles.langBtnText}>{t.switchLang}</Text>
          </TouchableOpacity>
        </View>

        {/* Log Entry Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.logEntry}</Text>

          {/* Daily / Range Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, entryMode === 'daily' && styles.toggleBtnActive]}
              onPress={() => setEntryMode('daily')}
            >
              <Text style={[styles.toggleText, entryMode === 'daily' && styles.toggleTextActive]}>{t.dailyTab}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, entryMode === 'range' && styles.toggleBtnActive]}
              onPress={() => setEntryMode('range')}
            >
              <Text style={[styles.toggleText, entryMode === 'range' && styles.toggleTextActive]}>{t.rangeTab}</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Input */}
          {entryMode === 'daily' ? (
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.date}</Text>
                <TouchableOpacity
                  style={styles.calendarTriggerBtn}
                  onPress={() => openCalendar('date')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarTriggerText}>{formatDateDisplay(date)}</Text>
                  <Text style={styles.calendarIcon}>📅 {t.pickDate}</Text>
                </TouchableOpacity>
              </View>

              {coveredByRange && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningBannerText}>
                    {lang === 'mr'
                      ? `⚠️ ही तारीख (${formatDateDisplay(date)}) आधीच तारीख श्रेणीमध्ये (${formatDateDisplay(coveredByRange.date)} ते ${formatDateDisplay(coveredByRange.toDate)}) येते!`
                      : `⚠️ Date (${formatDateDisplay(date)}) is already inside Date Range (${formatDateDisplay(coveredByRange.date)} to ${formatDateDisplay(coveredByRange.toDate)})!`}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              {/* Date Range Inputs */}
              <View style={styles.dateRangeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>{t.from}</Text>
                  <TouchableOpacity
                    style={styles.calendarTriggerBtn}
                    onPress={() => openCalendar('fromDate')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(fromDate)}</Text>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.to}</Text>
                  <TouchableOpacity
                    style={styles.calendarTriggerBtn}
                    onPress={() => openCalendar('toDate')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(toDate)}</Text>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.openRangeCalBtn}
                onPress={() => openCalendar('range')}
              >
                <Text style={styles.openRangeCalText}>📅 {t.pickRange} (Select Start & End on Calendar)</Text>
              </TouchableOpacity>

              {overlappingRange && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningBannerText}>
                    {lang === 'mr'
                      ? `⚠️ ही तारीख श्रेणी आधीच असलेल्या श्रेणीशी ओव्हरलॅप होते!`
                      : `⚠️ This date range overlaps with an existing range!`}
                  </Text>
                </View>
              )}

              {/* 🔄 Auto-Merge Banner */}
              {rangePreview && (
                <View style={styles.mergeBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mergeTitle}>
                      {lang === 'mr'
                        ? `🔄 या कालावधीत ${rangePreview.count} दैनिक नोंदी आढळल्या (${rangePreview.totalCount} माळा)`
                        : `🔄 Found ${rangePreview.count} daily entries (${rangePreview.totalCount} Mala total)`}
                    </Text>
                    <Text style={styles.mergeSubtitle}>
                      {lang === 'mr' ? 'एकत्रित करण्यासाठी भरा' : 'Tap to auto-fill and merge'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mergeBtn}
                    onPress={() => setCount(String(rangePreview.totalCount))}
                  >
                    <Text style={styles.mergeBtnText}>⚡ Fill {rangePreview.totalCount}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 🌟 Multi-Month Mode Selector */}
              {isDifferentMonths && (
                <View style={styles.multiMonthCard}>
                  <Text style={styles.multiMonthNoticeTitle}>
                    📅 {t.multiMonthNotice}
                  </Text>
                  <View style={styles.multiMonthToggleRow}>
                    <TouchableOpacity
                      style={[styles.multiMonthOptionBtn, multiMonthMode === 'single' && styles.multiMonthOptionActive]}
                      onPress={() => setMultiMonthMode('single')}
                    >
                      <Text style={[styles.multiMonthOptionText, multiMonthMode === 'single' && styles.multiMonthOptionTextActive]}>
                        {t.singleRangeMode}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.multiMonthOptionBtn, multiMonthMode === 'split' && styles.multiMonthOptionActive]}
                      onPress={() => setMultiMonthMode('split')}
                    >
                      <Text style={[styles.multiMonthOptionText, multiMonthMode === 'split' && styles.multiMonthOptionTextActive]}>
                        {t.splitMonthMode}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Count Inputs */}
          {entryMode === 'range' && isDifferentMonths && multiMonthMode === 'split' ? (
            <View style={{ marginTop: 8 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{fromMonthLabel} {t.count}</Text>
                <TextInput
                  style={[styles.input, styles.countInput]}
                  value={month1Count}
                  onChangeText={setMonth1Count}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{toMonthLabel} {t.count}</Text>
                <TextInput
                  style={[styles.input, styles.countInput]}
                  value={month2Count}
                  onChangeText={setMonth2Count}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.count}</Text>
              <TextInput
                style={[styles.input, styles.countInput]}
                value={count}
                onChangeText={setCount}
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Note Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.note}</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder={lang === 'mr' ? 'टिप्पणी...' : 'Optional note...'}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (saving || !!coveredByRange || !!overlappingRange) && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={saving || !!coveredByRange || !!overlappingRange}
          >
            <Text style={styles.saveBtnText}>{saving ? t.saving : t.save}</Text>
          </TouchableOpacity>
        </View>

        {/* 🌟 Summary Period Filter Tabs */}
        <View style={styles.periodFilterRow}>
          <TouchableOpacity
            style={[styles.periodFilterBtn, filterMode === 'all' && styles.periodFilterBtnActive]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.periodFilterText, filterMode === 'all' && styles.periodFilterTextActive]}>
              {t.filterAll}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodFilterBtn, filterMode === 'month' && styles.periodFilterBtnActive]}
            onPress={() => setFilterMode('month')}
          >
            <Text style={[styles.periodFilterText, filterMode === 'month' && styles.periodFilterTextActive]}>
              {t.filterMonth}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          {filterMode === 'month' ? (
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
                <Text style={styles.monthNavText}>{t.prevMonth}</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthNames[lang][selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
                <Text style={styles.monthNavText}>{t.nextMonth}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
              <Text style={styles.allTimeTitle}>🌟 {t.allTimeSummary}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summaryTotal}</Text>
              <Text style={styles.summaryLabel}>{t.totalMala}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{summaryDays}</Text>
              <Text style={styles.summaryLabel}>{t.days}</Text>
            </View>
          </View>
        </View>

        {/* History List */}
        <Text style={styles.sectionTitle}>{t.history} ({entries.length})</Text>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📿</Text>
            <Text style={styles.emptyTitle}>{t.noEntries}</Text>
            <Text style={styles.emptyHint}>{t.noEntriesHint}</Text>
          </View>
        ) : (
          entries.map((item) => (
            <View key={item._id}>
              {renderEntry({ item })}
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ─── MODAL 1: EDIT ENTRY (Placed FIRST in DOM so Calendar can layer on top) ─── */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.editEntry}</Text>

            {editEntryType === 'range' ? (
              <View>
                <View style={styles.dateRangeRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>{t.from}</Text>
                    <TouchableOpacity
                      style={styles.calendarTriggerBtn}
                      onPress={() => openCalendar('editDate')}
                    >
                      <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(editDate)}</Text>
                      <Text style={{ fontSize: 14 }}>📅</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>{t.to}</Text>
                    <TouchableOpacity
                      style={styles.calendarTriggerBtn}
                      onPress={() => openCalendar('editToDate')}
                    >
                      <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(editToDate)}</Text>
                      <Text style={{ fontSize: 14 }}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.date}</Text>
                <TouchableOpacity
                  style={styles.calendarTriggerBtn}
                  onPress={() => openCalendar('editDate')}
                >
                  <Text style={styles.calendarTriggerText}>{formatDateDisplay(editDate)}</Text>
                  <Text style={styles.calendarIcon}>📅 {t.pickDate}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.count}</Text>
              <TextInput
                style={[styles.input, styles.countInput]}
                value={editCount}
                onChangeText={setEditCount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.note}</Text>
              <TextInput
                style={styles.input}
                value={editNote}
                onChangeText={setEditNote}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={handleDelete}>
                <Text style={styles.modalDeleteText}>{t.delete}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdate}>
                <Text style={styles.modalSaveText}>{t.update}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: CALENDAR DATE PICKER (Placed LAST in DOM with high z-index to ALWAYS appear on top!) ─── */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.calModalOverlay}>
          <View style={styles.calModalContent}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={prevCalMonth} style={styles.calNavBtn}>
                <Text style={styles.calNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calTitle}>
                {monthNames[lang][calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={nextCalMonth} style={styles.calNavBtn}>
                <Text style={styles.calNavText}>›</Text>
              </TouchableOpacity>
            </View>

            {calendarTarget === 'range' && (
              <Text style={styles.calHintText}>
                {rangeStart && !rangeEnd
                  ? `${t.from}: ${formatDateDisplay(rangeStart)} → Tap end date`
                  : t.selectRangeHint}
              </Text>
            )}

            <View style={styles.weekDaysRow}>
              {dayShortNames[lang].map((d, idx) => (
                <Text key={idx} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarCells.map((cellDay, index) => {
                if (!cellDay) {
                  return <View key={index} style={styles.emptyCalCell} />;
                }

                const dayNum = parseInt(cellDay.split('-')[2], 10);
                const isSelected =
                  (calendarTarget === 'date' && date === cellDay) ||
                  (calendarTarget === 'fromDate' && fromDate === cellDay) ||
                  (calendarTarget === 'toDate' && toDate === cellDay) ||
                  (calendarTarget === 'editDate' && editDate === cellDay) ||
                  (calendarTarget === 'editToDate' && editToDate === cellDay) ||
                  (rangeStart === cellDay) ||
                  (rangeEnd === cellDay);

                const isInRange =
                  calendarTarget === 'range' &&
                  rangeStart &&
                  rangeEnd &&
                  new Date(cellDay) > new Date(rangeStart) &&
                  new Date(cellDay) < new Date(rangeEnd);

                const isToday = cellDay === formatDateISO(new Date());

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
                <Text style={styles.calActionTodayText}>{t.today}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calCloseBtn}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.calCloseText}>{t.cancel}</Text>
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
  scrollContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  langBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langBtnText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
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
    fontSize: theme.fontSize.sm,
  },
  toggleTextActive: {
    color: '#fff',
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
  calendarTriggerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarTriggerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  calendarTriggerTextSmall: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  calendarIcon: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  openRangeCalBtn: {
    backgroundColor: theme.colors.primary + '18',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
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
  warningBanner: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.error + '60',
    marginBottom: theme.spacing.sm,
  },
  warningBannerText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  mergeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent + '15',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.accent + '40',
    marginBottom: theme.spacing.sm,
  },
  mergeTitle: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  mergeSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  mergeBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    marginLeft: 8,
  },
  mergeBtnText: {
    color: '#0b0f19',
    fontSize: 12,
    fontWeight: 'bold',
  },
  multiMonthCard: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  multiMonthNoticeTitle: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  multiMonthToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  multiMonthOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgInput,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  multiMonthOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  multiMonthOptionText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  multiMonthOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  countInput: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.accent,
  },
  dateRangeRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },

  // Period Filter Bar
  periodFilterRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  periodFilterBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  periodFilterText: {
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.xs,
  },
  periodFilterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  summaryCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  allTimeTitle: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navArrow: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 36,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.accent,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  entryDate: {
    flex: 1,
  },
  entryDateText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  rangeBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  entryNoteText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  entryCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  entryCountText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  entryCountLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  entryEditIcon: {
    fontSize: 16,
    marginLeft: theme.spacing.md,
  },
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

  // 🌟 Calendar Overlay & Content with high z-index
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
    maxWidth: 360,
    borderWidth: 1,
    borderColor: theme.colors.primary + '50',
    zIndex: 1000000,
    elevation: 1000000,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  calNavBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgElevated,
  },
  calNavText: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  calTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  calHintText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  weekDayText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  emptyCalCell: {
    width: '14.28%',
    height: 40,
  },
  calCellInRange: {
    backgroundColor: theme.colors.primary + '30',
    borderRadius: 0,
  },
  calCellSelected: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  calDayText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  calDayToday: {
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  calDaySelectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  calActionTodayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
  },
  calActionTodayText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  calCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
  },
  calCloseText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },

  modalContent: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalDeleteBtn: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginRight: 'auto',
  },
  modalDeleteText: { color: theme.colors.error, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
  modalCancelBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgInput,
  },
  modalCancelText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm },
  modalSaveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  modalSaveText: { color: '#fff', fontWeight: theme.fontWeight.bold, fontSize: theme.fontSize.sm },
});

export default JapmalaScreen;
