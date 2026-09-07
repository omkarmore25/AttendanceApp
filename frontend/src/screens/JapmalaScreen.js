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
  Platform,
  StatusBar,
  Share,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import theme from '../theme';
import {
  saveOfflineJapmala,
  saveOfflineJapmalaEdit,
  saveOfflineJapmalaDelete,
} from '../utils/offlineSync';
import { useOffline } from '../context/OfflineContext';
import { useAuth } from '../context/AuthContext';
import { showAlert, showConfirm } from '../utils/dialog';
import { toMarathiDigits, toEnglishDigits, formatNumberByLang } from '../utils/marathiUtils';

// ─── Language Strings ───
const strings = {
  en: {
    title: '📿 Japmala Tracker',
    logEntry: 'Log Japmala',
    dailyTab: 'Daily',
    monthTab: 'By Month',
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
    filterYear: '🗓️ By Year',
    filterRange: '📅 Date Range',
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
    monthBadge: 'Monthly',
    selectMonthYear: 'Select Month & Year',
    multiMonthNotice: 'Multi-month range selected. Choose how you want to log:',
    singleRangeMode: 'Single total for entire range',
    splitMonthMode: 'Separate count per month',
    shareWhatsAppBtn: 'Share on WhatsApp',
    shareWhatsAppPrompt: 'Share Mala Count on WhatsApp',
  },
  mr: {
    title: '📿 जपमाळा ट्रॅकर',
    logEntry: 'जपमाळा नोंदवा',
    dailyTab: 'दैनिक',
    monthTab: 'महिना',
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
    filterMonth: '📅 महिना',
    filterYear: '🗓️ वर्ष',
    filterRange: '📅 कालावधी',
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
    monthBadge: 'मासिक नोंद',
    selectMonthYear: 'महिना आणि वर्ष निवडा',
    multiMonthNotice: 'दोन किंवा अधिक महिने निवडले आहेत. नोंद कशी करायची ते निवडा:',
    singleRangeMode: 'संपूर्ण श्रेणीसाठी एकच एकूण माळा संख्या',
    splitMonthMode: 'प्रत्येक महिन्यासाठी स्वतंत्र माळा संख्या',
    shareWhatsAppBtn: 'WhatsApp वर शेअर करा',
    shareWhatsAppPrompt: 'WhatsApp वर जपमाळ नोंद पाठवा',
  },
};

const monthNames = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  mr: ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'],
};

const monthShortNames = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  mr: ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टें', 'ऑक्टो', 'नोव्हे', 'डिसे'],
};

const dayShortNames = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  mr: ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
};

export function isPerfectMonth(dateStr, toDateStr) {
  if (!dateStr || !toDateStr) return false;
  const s = new Date(dateStr);
  const e = new Date(toDateStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
  if (s.getUTCFullYear() !== e.getUTCFullYear()) return false;
  if (s.getUTCMonth() !== e.getUTCMonth()) return false;
  if (s.getUTCDate() !== 1) return false;
  const lastDay = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 0)).getUTCDate();
  return e.getUTCDate() === lastDay;
}

function getMonthRangeISO(year, monthIndex) {
  const s = new Date(Date.UTC(year, monthIndex, 1));
  const e = new Date(Date.UTC(year, monthIndex + 1, 0));
  const sStr = `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const eStr = `${e.getUTCFullYear()}-${String(e.getUTCMonth() + 1).padStart(2, '0')}-${String(e.getUTCDate()).padStart(2, '0')}`;
  return { from: sStr, to: eStr };
}

const JapmalaScreen = () => {
  const [lang, setLang] = useState('en');
  const t = strings[lang];
  const { lastSyncResult } = useOffline();
  const { user } = useAuth();

  const now = new Date();
  const [entryMode, setEntryMode] = useState('daily'); // 'daily', 'month', or 'range'
  const [date, setDate] = useState(formatDateISO(now));
  const [fromDate, setFromDate] = useState(formatDateISO(now));
  const [toDate, setToDate] = useState(formatDateISO(now));
  const [count, setCount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Month Entry Mode State
  const [monthLogYear, setMonthLogYear] = useState(now.getFullYear());
  const [monthLogMonth, setMonthLogMonth] = useState(now.getMonth());

  // Multi-Month Breakdown in Form
  const [multiMonthMode, setMultiMonthMode] = useState('single'); // 'single' or 'split'
  const [month1Count, setMonth1Count] = useState('');
  const [month2Count, setMonth2Count] = useState('');

  // Range preview for auto-merge
  const [rangePreview, setRangePreview] = useState(null);

  // Filter mode: 'all' (default), 'month', 'year', or 'range'
  const [filterMode, setFilterMode] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterFromDate, setFilterFromDate] = useState(formatDateISO(now));
  const [filterToDate, setFilterToDate] = useState(formatDateISO(now));

  const [entries, setEntries] = useState([]);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryDays, setSummaryDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editEntryType, setEditEntryType] = useState('daily'); // 'daily', 'month', 'range'
  const [editDate, setEditDate] = useState('');
  const [editToDate, setEditToDate] = useState('');
  const [editMonthVal, setEditMonthVal] = useState(now.getMonth());
  const [editYearVal, setEditYearVal] = useState(now.getFullYear());
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
      } else if (filterMode === 'year') {
        url += `?year=${filterYear}&from=${filterYear}-01-01&to=${filterYear}-12-31`;
      } else if (filterMode === 'range' && filterFromDate && filterToDate) {
        url += `?from=${filterFromDate}&to=${filterToDate}`;
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
    if (lastSyncResult && lastSyncResult.totalSynced > 0) {
      fetchEntries();
    }
  }, [lastSyncResult]);

  useEffect(() => {
    setLoading(true);
    fetchEntries();
  }, [filterMode, selectedMonth, selectedYear, filterYear, filterFromDate, filterToDate]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [filterMode, selectedMonth, selectedYear, filterYear, filterFromDate, filterToDate])
  );

  // ─── VALIDATION CHECKS ───
  const coveredByRange = entryMode === 'daily' && entries.find((e) => {
    if (e.entryType !== 'range' && !e.toDate) return false;
    const targetTime = new Date(date).getTime();
    const sTime = new Date(e.date).getTime();
    const eTime = new Date(e.toDate).getTime();
    return targetTime >= sTime && targetTime <= eTime;
  });

  const monthRangeBounds = getMonthRangeISO(monthLogYear, monthLogMonth);

  const monthCoveredByRange = entryMode === 'month' && entries.find((e) => {
    if (e.entryType !== 'range' && !e.toDate) return false;
    const s1 = new Date(monthRangeBounds.from).getTime();
    const e1 = new Date(monthRangeBounds.to).getTime();
    const s2 = new Date(e.date).getTime();
    const e2 = new Date(e.toDate).getTime();
    return s1 <= e2 && e1 >= s2;
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
      showAlert(
        'Date Overlap',
        lang === 'mr'
          ? `⚠️ ही तारीख (${formatDateDisplay(date)}) आधीच तारीख श्रेणीमध्ये (${formatDateDisplay(coveredByRange.date)} ते ${formatDateDisplay(coveredByRange.toDate)}) आहे! कृपया खाली इतिहासातील ती श्रेणी संपादित करा.`
          : `⚠️ This date (${formatDateDisplay(date)}) falls inside an existing Date Range (${formatDateDisplay(coveredByRange.date)} to ${formatDateDisplay(coveredByRange.toDate)})! Please edit that range in History below.`
      );
      return;
    }

    // Validation: Block range if overlapping with another range
    if (entryMode === 'range' && overlappingRange) {
      showAlert(
        'Range Overlap',
        lang === 'mr'
          ? `⚠️ ही तारीख श्रेणी आधीच अस्तित्वात असलेल्या श्रेणीशी (${formatDateDisplay(overlappingRange.date)} ते ${formatDateDisplay(overlappingRange.toDate)}) ओव्हरलॅप होते!`
          : `⚠️ This date range overlaps with an existing range (${formatDateDisplay(overlappingRange.date)} to ${formatDateDisplay(overlappingRange.toDate)})!`
      );
      return;
    }

    try {
      setSaving(true);
      if (entryMode === 'daily') {
        if (!count || Number(count) <= 0) {
          showAlert('Invalid Count', lang === 'mr' ? 'कृपया वैध माळा संख्या प्रविष्ट करा.' : 'Please enter a valid count.');
          return;
        }
        await api.post('/japmala', {
          entryType: 'daily',
          date,
          count: Number(toEnglishDigits(count)),
          note,
        });
      } else if (entryMode === 'month') {
        if (!count || Number(count) <= 0) {
          showAlert('Invalid Count', lang === 'mr' ? 'कृपया वैध माळा संख्या प्रविष्ट करा.' : 'Please enter a valid count.');
          return;
        }
        const mRange = getMonthRangeISO(monthLogYear, monthLogMonth);
        await api.post('/japmala', {
          entryType: 'range',
          date: mRange.from,
          toDate: mRange.to,
          count: Number(count),
          note: note || `Monthly count for ${monthNames.en[monthLogMonth]} ${monthLogYear}`,
        });
      } else {
        // Range mode
        if (isDifferentMonths && multiMonthMode === 'split') {
          const c1 = Number(toEnglishDigits(month1Count)) || 0;
          const c2 = Number(toEnglishDigits(month2Count)) || 0;
          if (c1 <= 0 && c2 <= 0) {
            showAlert('Invalid Count', lang === 'mr' ? 'कृपया किमान एका महिन्यासाठी माळा संख्या प्रविष्ट करा.' : 'Please enter count for at least one month.');
            return;
          }

          const s = new Date(fromDate);
          const endMonth1 = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 0));
          const startMonth2 = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 1));
          const endMonth2 = new Date(toDate);

          const breakdown = [];
          if (c1 > 0) {
            breakdown.push({
              from: fromDate,
              to: formatDateISO(endMonth1),
              count: c1,
            });
          }
          if (c2 > 0) {
            breakdown.push({
              from: formatDateISO(startMonth2),
              to: formatDateISO(endMonth2),
              count: c2,
            });
          }

          await api.post('/japmala', {
            monthlyBreakdown: breakdown,
            note,
          });
        } else {
          if (!count || Number(count) <= 0) {
            showAlert('Invalid Count', lang === 'mr' ? 'कृपया वैध माळा संख्या प्रविष्ट करा.' : 'Please enter a valid count.');
            return;
          }
          await api.post('/japmala', {
            entryType: 'range',
            date: fromDate,
            toDate,
            count: Number(toEnglishDigits(count)),
            note,
          });
        }
      }

      setCount('');
      setMonth1Count('');
      setMonth2Count('');
      setNote('');
      showAlert('Success', lang === 'mr' ? '🎉 जपमाळा यशस्वीरित्या नोंदवली!' : '🎉 Japmala logged successfully!');
      fetchEntries();
    } catch (error) {
      if (!error.response || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        try {
          const offlineItem = {
            id: 'local_' + Date.now(),
            entryType: entryMode,
            date: entryMode === 'range' ? fromDate : date,
            toDate: entryMode === 'range' ? toDate : null,
            count: Number(count),
            note,
            isOffline: true,
          };

          await saveOfflineJapmala(offlineItem);

          setEntries((prev) => [offlineItem, ...prev]);
          setSummaryTotal((prev) => prev + Number(count));
          setSummaryDays((prev) => prev + 1);

          setCount('');
          setNote('');
          showAlert(
            'Saved Offline',
            lang === 'mr'
              ? '📡 ऑफलाइन मोडमध्ये सेव्ह केले! इंटरनेट कनेक्शन आल्यावर सर्व्हरवर सिंक केले जाईल.'
              : '📡 Saved locally! Will automatically sync to cloud once connected.'
          );
          return;
        } catch (offlineErr) {
          console.error('Offline save failed:', offlineErr);
        }
      }

      const msg = error.response?.data?.message || 'Failed to save entry.';
      showAlert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const isRange = item.entryType === 'range' || !!item.toDate;
    const isFullMonth = isRange && isPerfectMonth(item.date, item.toDate);

    if (isFullMonth) {
      setEditEntryType('month');
      setEditMonthVal(new Date(item.date).getUTCMonth());
      setEditYearVal(new Date(item.date).getUTCFullYear());
    } else if (isRange) {
      setEditEntryType('range');
      setEditDate(formatDateISO(new Date(item.date)));
      setEditToDate(item.toDate ? formatDateISO(new Date(item.toDate)) : '');
    } else {
      setEditEntryType('daily');
      setEditDate(formatDateISO(new Date(item.date)));
      setEditToDate('');
    }

    setEditCount(String(item.count));
    setEditNote(item.note || '');
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editCount || Number(editCount) <= 0) {
      showAlert('Invalid Count', lang === 'mr' ? 'कृपया वैध माळा संख्या प्रविष्ट करा.' : 'Please enter a valid count.');
      return;
    }

    let targetDate = editDate;
    let targetToDate = editEntryType === 'range' ? editToDate : null;
    let targetType = editEntryType;

    if (editEntryType === 'month') {
      const mRange = getMonthRangeISO(editYearVal, editMonthVal);
      targetDate = mRange.from;
      targetToDate = mRange.to;
      targetType = 'range';
    }

    try {
      await api.put(`/japmala/${editItem._id}`, {
        count: Number(toEnglishDigits(editCount)),
        note: editNote,
        date: targetDate,
        toDate: targetToDate,
        entryType: targetType,
      });

      setEditModal(false);
      showAlert('Updated', lang === 'mr' ? '✅ जपमाळा नोंद अपडेट केली!' : '✅ Japmala entry updated!');
      fetchEntries();
    } catch (error) {
      if (!error.response || error.message === 'Network Error' || error.code === 'ECONNABORTED' || editItem.isOffline) {
        try {
          await saveOfflineJapmalaEdit(editItem._id || editItem.id, {
            count: Number(editCount),
            note: editNote,
            date: targetDate,
            toDate: targetToDate,
            entryType: targetType,
          });

          setEntries((prev) =>
            prev.map((item) =>
              item._id === editItem._id || item.id === editItem.id
                ? {
                    ...item,
                    count: Number(editCount),
                    note: editNote,
                    date: targetDate,
                    toDate: targetToDate,
                    entryType: targetType,
                    isOffline: true,
                  }
                : item
            )
          );

          setEditModal(false);
          showAlert(
            'Updated Offline',
            lang === 'mr'
              ? '📡 ऑफलाइन बदल सेव्ह केले आहेत! इंटरनेट कनेक्ट झाल्यावर क्लाउडवर अपडेट होतील.'
              : '📡 Changes saved locally! Will sync to cloud when connected.'
          );
          return;
        } catch (offlineErr) {
          console.error('Offline update failed:', offlineErr);
        }
      }

      showAlert('Error', 'Failed to update entry.');
    }
  };

  const handleDelete = () => {
    const itemId = editItem._id || editItem.id;
    showConfirm(
      t.delete,
      t.confirmDelete,
      async () => {
        try {
          await api.delete(`/japmala/${itemId}`);
          setEditModal(false);
          fetchEntries();
        } catch (error) {
          if (!error.response || error.message === 'Network Error' || error.code === 'ECONNABORTED' || editItem.isOffline) {
            try {
              await saveOfflineJapmalaDelete(itemId);
              setEntries((prev) => prev.filter((item) => item._id !== itemId && item.id !== itemId));
              setSummaryTotal((prev) => Math.max(0, prev - Number(editItem.count || 0)));

              setEditModal(false);
              showAlert(
                'Deleted Offline',
                lang === 'mr'
                  ? '🗑️ नोंद हटवली (ऑफलाइन)! इंटरनेट कनेक्ट झाल्यावर सर्व्हरवरूनही हटवली जाईल.'
                  : '🗑️ Entry deleted locally! Will sync deletion to cloud when connected.'
              );
              return;
            } catch (offlineErr) {
              console.error('Offline delete failed:', offlineErr);
            }
          }

          showAlert('Error', 'Failed to delete entry.');
        }
      }
    );
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

  const prevYear = () => {
    setFilterYear((prev) => prev - 1);
  };

  const nextYear = () => {
    setFilterYear((prev) => prev + 1);
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
    else if (target === 'filterFromDate') baseDate = new Date(filterFromDate);
    else if (target === 'filterToDate') baseDate = new Date(filterToDate);

    if (!isNaN(baseDate.getTime())) {
      setCalMonth(baseDate.getMonth());
      setCalYear(baseDate.getFullYear());
    }

    if (target === 'range') {
      setRangeStart(fromDate);
      setRangeEnd(toDate);
    } else if (target === 'filterRange') {
      setRangeStart(filterFromDate);
      setRangeEnd(filterToDate);
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
    } else if (calendarTarget === 'filterRange') {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dayStr);
        setRangeEnd(null);
      } else {
        if (new Date(dayStr) < new Date(rangeStart)) {
          setRangeStart(dayStr);
          setRangeEnd(null);
        } else {
          setRangeEnd(dayStr);
          setFilterFromDate(rangeStart);
          setFilterToDate(dayStr);
          setShowCalendar(false);
        }
      }
    } else {
      if (calendarTarget === 'date') setDate(dayStr);
      else if (calendarTarget === 'fromDate') setFromDate(dayStr);
      else if (calendarTarget === 'toDate') setToDate(dayStr);
      else if (calendarTarget === 'editDate') setEditDate(dayStr);
      else if (calendarTarget === 'editToDate') setEditToDate(dayStr);
      else if (calendarTarget === 'filterFromDate') setFilterFromDate(dayStr);
      else if (calendarTarget === 'filterToDate') setFilterToDate(dayStr);
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

  // ─── SHARE JAPMALA COUNT ON WHATSAPP IN MARATHI ───
  const handleShareWhatsApp = async () => {
    const devoteeName = user?.name || (lang === 'mr' ? 'साधक' : 'Devotee');

    let periodTitleMr = '';
    if (filterMode === 'all') {
      periodTitleMr = 'संपूर्ण काळ (All Time)';
    } else if (filterMode === 'month') {
      periodTitleMr = `${monthNames.mr[selectedMonth]} ${selectedYear}`;
    } else if (filterMode === 'year') {
      periodTitleMr = `वर्ष ${filterYear}`;
    } else if (filterMode === 'range') {
      periodTitleMr = `${formatDateDisplay(filterFromDate)} ते ${formatDateDisplay(filterToDate)}`;
    }

    const malaFormatted = lang === 'mr' ? toMarathiDigits(summaryTotal) : summaryTotal;
    const daysFormatted = lang === 'mr' ? toMarathiDigits(summaryDays) : summaryDays;
    const entriesCountFormatted = lang === 'mr' ? toMarathiDigits(entries.length) : entries.length;

    let msg = `🙏 *जय सच्चिदानंद!* 🙏\n`;
    msg += `📿 *संत समागम - जपमाळ नोंद* 📿\n\n`;
    msg += `👤 *साधक:* ${devoteeName}\n`;
    msg += `📅 *कालावधी:* ${periodTitleMr}\n`;
    msg += `✨ *एकूण जपमाळ:* ${malaFormatted} माळा\n`;
    msg += `📆 *नोंदी / दिवस:* ${daysFormatted} दिवस (${entriesCountFormatted} नोंदी)\n\n`;
    msg += `📲 *Sant Samagam App वरून पाठवले*\n`;
    msg += `🔗 https://attendance-app-one-umber.vercel.app/download`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(msg);
      } catch (e) {
        // ignore
      }
    }

    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({
          message: msg,
          title: 'Sant Samagam Japmala',
        });
      }
    } catch (err) {
      try {
        await Share.share({
          message: msg,
          title: 'Sant Samagam Japmala',
        });
      } catch (e) {
        if (Platform.OS === 'web') {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }
    }
  };

  const renderEntry = ({ item }) => {
    const isRange = item.entryType === 'range' || !!item.toDate;
    const isFullMonth = isRange && isPerfectMonth(item.date, item.toDate);

    let displayDateText = formatDateDisplay(item.date);
    let badgeText = null;

    if (isFullMonth) {
      const s = new Date(item.date);
      const mName = monthNames[lang][s.getUTCMonth()];
      const year = s.getUTCFullYear();
      displayDateText = `${mName} ${year}`;
      badgeText = t.monthBadge;
    } else if (isRange) {
      displayDateText = `${formatDateDisplay(item.date)}  ${lang === 'mr' ? 'ते' : 'to'}  ${formatDateDisplay(item.toDate)}`;
      badgeText = t.rangeBadge;
    }

    return (
      <TouchableOpacity style={styles.entryRow} onPress={() => handleEdit(item)} activeOpacity={0.7}>
        <View style={styles.entryDate}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>{isFullMonth ? '📅' : isRange ? '🗓️' : '📝'}</Text>
            <View>
              <Text style={styles.entryDateText}>{displayDateText}</Text>
              {badgeText ? (
                <Text style={[styles.rangeBadgeText, isFullMonth && styles.monthBadgeText]}>
                  {badgeText}
                </Text>
              ) : null}
            </View>
          </View>
          {item.note ? <Text style={styles.entryNoteText}>💬 {item.note}</Text> : null}
        </View>
        <View style={styles.entryCount}>
          <Text style={styles.entryCountText}>{formatNumberByLang(item.count, lang)}</Text>
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
          <View>
            <Text style={styles.devotionalHeader}>🙏 जय सच्चिदानंद 🙏</Text>
            <Text style={styles.title}>{t.title}</Text>
          </View>
          <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'en' ? 'mr' : 'en')}>
            <Text style={styles.langBtnText}>{t.switchLang}</Text>
          </TouchableOpacity>
        </View>

        {/* Log Entry Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.logEntry}</Text>

          {/* 3-way Toggle: Daily / Month / Range */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, entryMode === 'daily' && styles.toggleBtnActive]}
              onPress={() => setEntryMode('daily')}
            >
              <Text style={[styles.toggleText, entryMode === 'daily' && styles.toggleTextActive]}>{t.dailyTab}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, entryMode === 'month' && styles.toggleBtnActive]}
              onPress={() => setEntryMode('month')}
            >
              <Text style={[styles.toggleText, entryMode === 'month' && styles.toggleTextActive]}>{t.monthTab}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, entryMode === 'range' && styles.toggleBtnActive]}
              onPress={() => setEntryMode('range')}
            >
              <Text style={[styles.toggleText, entryMode === 'range' && styles.toggleTextActive]}>{t.rangeTab}</Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: DAILY */}
          {entryMode === 'daily' && (
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
                      ? `⚠️ ही तारीख (${formatDateDisplay(date)}) आधीच तारीख श्रेणीमध्ये (${formatDateDisplay(coveredByRange.date)} ते ${formatDateDisplay(coveredByRange.toDate)}) आहे!`
                      : `⚠️ Date (${formatDateDisplay(date)}) is already inside Date Range (${formatDateDisplay(coveredByRange.date)} to ${formatDateDisplay(coveredByRange.toDate)})!`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: MONTH DROPDOWN & SELECTOR */}
          {entryMode === 'month' && (
            <View style={styles.monthSelectSection}>
              {/* Year Selector */}
              <View style={styles.monthYearNav}>
                <TouchableOpacity onPress={() => setMonthLogYear(monthLogYear - 1)} style={styles.yearNavBtn}>
                  <Text style={styles.yearNavText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.yearNavTitle}>Year {monthLogYear}</Text>
                <TouchableOpacity onPress={() => setMonthLogYear(monthLogYear + 1)} style={styles.yearNavBtn}>
                  <Text style={styles.yearNavText}>▶</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.monthGridHelper}>{lang === 'mr' ? 'महिना निवडा:' : 'Select Month:'}</Text>

              {/* 12 Months Pills Grid */}
              <View style={styles.monthsPillsGrid}>
                {monthNames[lang].map((mName, idx) => {
                  const isSelected = monthLogMonth === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.monthPill, isSelected && styles.monthPillActive]}
                      onPress={() => setMonthLogMonth(idx)}
                    >
                      <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                        {monthShortNames[lang][idx]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Month Preview Card */}
              <View style={styles.selectedMonthCard}>
                <Text style={styles.selectedMonthTitle}>
                  📅 {monthNames[lang][monthLogMonth]} {monthLogYear}
                </Text>
                <Text style={styles.selectedMonthSubtitle}>
                  {formatDateDisplay(monthRangeBounds.from)}  {lang === 'mr' ? 'ते' : 'to'}  {formatDateDisplay(monthRangeBounds.to)}
                </Text>
              </View>

              {monthCoveredByRange && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningBannerText}>
                    {lang === 'mr'
                      ? `⚠️ हा महिना आधीच अस्तित्वात असलेल्या तारीख श्रेणीशी ओव्हरलॅप होतो!`
                      : `⚠️ This month overlaps with an existing Date Range!`}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: DATE RANGE */}
          {entryMode === 'range' && (
            <View>
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

              {/* Notice if the selected range happens to be a perfect month */}
              {isPerfectMonth(fromDate, toDate) && (
                <View style={[styles.selectedMonthCard, { marginVertical: 8 }]}>
                  <Text style={styles.selectedMonthTitle}>
                    ✨ {monthNames[lang][new Date(fromDate).getUTCMonth()]} {new Date(fromDate).getUTCFullYear()} ({lang === 'mr' ? 'संपूर्ण १ महिना' : 'Perfect 1 Month Range'})
                  </Text>
                </View>
              )}

              {overlappingRange && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningBannerText}>
                    {lang === 'mr'
                      ? `⚠️ ही तारीख श्रेणी आधीच अस्तित्वात असलेल्या श्रेणीशी ओव्हरलॅप होते!`
                      : `⚠️ This date range overlaps with an existing range!`}
                  </Text>
                </View>
              )}

              {/* ⚡ Auto-Merge Banner */}
              {rangePreview && (
                <View style={styles.mergeBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mergeTitle}>
                      {lang === 'mr'
                        ? `⚡ या कालावधीत ${rangePreview.count} दैनिक नोंदी आढळल्या (${rangePreview.totalCount} माळा)`
                        : `⚡ Found ${rangePreview.count} daily entries (${rangePreview.totalCount} Mala total)`}
                    </Text>
                    <Text style={styles.mergeSubtitle}>
                      {lang === 'mr' ? 'एकत्रित करण्यासाठी टॅप करा' : 'Tap to auto-fill and merge'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mergeBtn}
                    onPress={() => setCount(String(rangePreview.totalCount))}
                  >
                    <Text style={styles.mergeBtnText}>⚡ Fill ${rangePreview.totalCount}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Multi-Month Split Option */}
              {isDifferentMonths && (
                <View style={styles.multiMonthCard}>
                  <Text style={styles.multiMonthNoticeText}>⚠️ {t.multiMonthNotice}</Text>
                  <View style={styles.multiMonthToggleRow}>
                    <TouchableOpacity
                      style={[styles.multiMonthToggleBtn, multiMonthMode === 'single' && styles.multiMonthToggleBtnActive]}
                      onPress={() => setMultiMonthMode('single')}
                    >
                      <Text style={[styles.multiMonthToggleText, multiMonthMode === 'single' && styles.multiMonthToggleTextActive]}>
                        {t.singleRangeMode}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.multiMonthToggleBtn, multiMonthMode === 'split' && styles.multiMonthToggleBtnActive]}
                      onPress={() => setMultiMonthMode('split')}
                    >
                      <Text style={[styles.multiMonthToggleText, multiMonthMode === 'split' && styles.multiMonthToggleTextActive]}>
                        {t.splitMonthMode}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {multiMonthMode === 'split' && (
                    <View style={styles.splitInputsContainer}>
                      <View style={styles.splitInputGroup}>
                        <Text style={styles.splitInputLabel}>📅 {fromMonthLabel}</Text>
                        <TextInput
                          style={styles.splitInput}
                          placeholder="0"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="numeric"
                          value={month1Count}
                          onChangeText={setMonth1Count}
                        />
                      </View>
                      <View style={styles.splitInputGroup}>
                        <Text style={styles.splitInputLabel}>📅 {toMonthLabel}</Text>
                        <TextInput
                          style={styles.splitInput}
                          placeholder="0"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="numeric"
                          value={month2Count}
                          onChangeText={setMonth2Count}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Mala Count Input (Common unless split multi-month is active) */}
          {!(entryMode === 'range' && isDifferentMonths && multiMonthMode === 'split') && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.count}</Text>
              <TextInput
                style={styles.countInput}
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={count}
                onChangeText={setCount}
              />
            </View>
          )}

          {/* Note Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t.note}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.note}
              placeholderTextColor={theme.colors.textMuted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? t.saving : t.save}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Card with 4 Tabs: All Time / Month / Year / Date Range */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, filterMode === 'all' && styles.toggleBtnActive]}
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.toggleText, filterMode === 'all' && styles.toggleTextActive]}>{t.filterAll}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filterMode === 'month' && styles.toggleBtnActive]}
              onPress={() => setFilterMode('month')}
            >
              <Text style={[styles.toggleText, filterMode === 'month' && styles.toggleTextActive]}>{t.filterMonth}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filterMode === 'year' && styles.toggleBtnActive]}
              onPress={() => setFilterMode('year')}
            >
              <Text style={[styles.toggleText, filterMode === 'year' && styles.toggleTextActive]}>{t.filterYear}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filterMode === 'range' && styles.toggleBtnActive]}
              onPress={() => setFilterMode('range')}
            >
              <Text style={[styles.toggleText, filterMode === 'range' && styles.toggleTextActive]}>{t.filterRange}</Text>
            </TouchableOpacity>
          </View>

          {/* Month Selector in Filter Mode */}
          {filterMode === 'month' && (
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
          )}

          {/* Year Selector in Filter Mode */}
          {filterMode === 'year' && (
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevYear} style={styles.navArrow}>
                <Text style={styles.monthNavText}>← {filterYear - 1}</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                🗓️ {lang === 'mr' ? 'वर्ष' : 'Year'} {filterYear}
              </Text>
              <TouchableOpacity onPress={nextYear} style={styles.navArrow}>
                <Text style={styles.monthNavText}>{filterYear + 1} →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Range Selector in Filter Mode */}
          {filterMode === 'range' && (
            <View style={{ marginTop: theme.spacing.xs }}>
              <View style={styles.dateRangeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>{t.from}</Text>
                  <TouchableOpacity
                    style={styles.calendarTriggerBtn}
                    onPress={() => openCalendar('filterFromDate')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(filterFromDate)}</Text>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.to}</Text>
                  <TouchableOpacity
                    style={styles.calendarTriggerBtn}
                    onPress={() => openCalendar('filterToDate')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(filterToDate)}</Text>
                    <Text style={{ fontSize: 16 }}>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.openRangeCalBtn}
                onPress={() => openCalendar('filterRange')}
              >
                <Text style={styles.openRangeCalText}>📅 {t.pickRange} (Select Start & End on Calendar)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {filterMode === 'all'
              ? `🌟 ${t.allTimeSummary}`
              : filterMode === 'year'
              ? `🗓️ ${lang === 'mr' ? 'वार्षिक सारांश' : 'Annual Summary'} — ${filterYear}`
              : filterMode === 'range'
              ? `📅 ${lang === 'mr' ? 'कालावधी सारांश' : 'Range Summary'}: ${formatDateDisplay(filterFromDate)} ${lang === 'mr' ? 'ते' : 'to'} ${formatDateDisplay(filterToDate)}`
              : `📅 ${monthNames[lang][selectedMonth]} ${selectedYear}`}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryValue}>{formatNumberByLang(summaryTotal, lang)}</Text>
              <Text style={styles.summaryLabel}>{t.totalMala}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryValue}>{formatNumberByLang(summaryDays, lang)}</Text>
              <Text style={styles.summaryLabel}>{t.days}</Text>
            </View>
          </View>
        </View>

        {/* 📱 WhatsApp Share Button for User */}
        <TouchableOpacity
          style={styles.shareWhatsAppBtn}
          onPress={handleShareWhatsApp}
          activeOpacity={0.8}
        >
          <Text style={styles.shareWhatsAppBtnIcon}>📱</Text>
          <View style={styles.shareWhatsAppBtnContent}>
            <Text style={styles.shareWhatsAppBtnText}>
              {t.shareWhatsAppBtn}
            </Text>
            <Text style={styles.shareWhatsAppBtnSubtext}>
              {filterMode === 'all'
                ? (lang === 'mr' ? `🌟 सर्व नोंदी: ${toMarathiDigits(summaryTotal)} माळा (${toMarathiDigits(summaryDays)} दिवस)` : `🌟 All Time: ${summaryTotal} Mala (${summaryDays} Days)`)
                : filterMode === 'month'
                ? `📅 ${monthNames[lang][selectedMonth]} ${selectedYear}: ${formatNumberByLang(summaryTotal, lang)} ${t.mala}`
                : filterMode === 'year'
                ? `🗓️ ${lang === 'mr' ? 'वर्ष ' + toMarathiDigits(filterYear) : 'Year ' + filterYear}: ${formatNumberByLang(summaryTotal, lang)} ${t.mala}`
                : `📅 ${formatDateDisplay(filterFromDate)} - ${formatDateDisplay(filterToDate)}: ${formatNumberByLang(summaryTotal, lang)} ${t.mala}`}
            </Text>
          </View>
          <Text style={styles.shareWhatsAppArrow}>➤</Text>
        </TouchableOpacity>

        {/* History List */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>
            {t.history} ({entries.length})
          </Text>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📿</Text>
              <Text style={styles.emptyTitle}>{t.noEntries}</Text>
              <Text style={styles.emptyHint}>{t.noEntriesHint}</Text>
            </View>
          ) : (
            entries.map((item) => (
              <View key={item._id || item.id}>
                {renderEntry({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ─── MODAL: EDIT ENTRY ─── */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.editEntry}</Text>

            {/* 3-way Toggle in Edit */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, editEntryType === 'daily' && styles.toggleBtnActive]}
                onPress={() => setEditEntryType('daily')}
              >
                <Text style={[styles.toggleText, editEntryType === 'daily' && styles.toggleTextActive]}>{t.dailyTab}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, editEntryType === 'month' && styles.toggleBtnActive]}
                onPress={() => setEditEntryType('month')}
              >
                <Text style={[styles.toggleText, editEntryType === 'month' && styles.toggleTextActive]}>{t.monthTab}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, editEntryType === 'range' && styles.toggleBtnActive]}
                onPress={() => setEditEntryType('range')}
              >
                <Text style={[styles.toggleText, editEntryType === 'range' && styles.toggleTextActive]}>{t.rangeTab}</Text>
              </TouchableOpacity>
            </View>

            {editEntryType === 'daily' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.date}</Text>
                <TouchableOpacity style={styles.calendarTriggerBtn} onPress={() => openCalendar('editDate')}>
                  <Text style={styles.calendarTriggerText}>{formatDateDisplay(editDate)}</Text>
                  <Text>📅</Text>
                </TouchableOpacity>
              </View>
            )}

            {editEntryType === 'month' && (
              <View style={{ marginBottom: theme.spacing.sm }}>
                <View style={styles.monthYearNav}>
                  <TouchableOpacity onPress={() => setEditYearVal(editYearVal - 1)} style={styles.yearNavBtn}>
                    <Text style={styles.yearNavText}>◀</Text>
                  </TouchableOpacity>
                  <Text style={styles.yearNavTitle}>Year {editYearVal}</Text>
                  <TouchableOpacity onPress={() => setEditYearVal(editYearVal + 1)} style={styles.yearNavBtn}>
                    <Text style={styles.yearNavText}>▶</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.monthsPillsGrid}>
                  {monthNames[lang].map((mName, idx) => {
                    const isSelected = editMonthVal === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.monthPill, isSelected && styles.monthPillActive]}
                        onPress={() => setEditMonthVal(idx)}
                      >
                        <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                          {monthShortNames[lang][idx]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.selectedMonthSubtitle, { textAlign: 'center', marginTop: 4 }]}>
                  {monthNames[lang][editMonthVal]} {editYearVal} ({lang === 'mr' ? 'संपूर्ण महिना' : 'Full Month'})
                </Text>
              </View>
            )}

            {editEntryType === 'range' && (
              <View style={styles.dateRangeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>{t.from}</Text>
                  <TouchableOpacity style={styles.calendarTriggerBtn} onPress={() => openCalendar('editDate')}>
                    <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(editDate)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>{t.to}</Text>
                  <TouchableOpacity style={styles.calendarTriggerBtn} onPress={() => openCalendar('editToDate')}>
                    <Text style={styles.calendarTriggerTextSmall}>{formatDateDisplay(editToDate)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.count}</Text>
              <TextInput
                style={styles.countInput}
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={editCount}
                onChangeText={setEditCount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.note}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.note}
                placeholderTextColor={theme.colors.textMuted}
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

      {/* ─── MODAL: CALENDAR PICKER ─── */}
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

            {(calendarTarget === 'range' || calendarTarget === 'filterRange') && (
              <Text style={styles.calHintText}>
                {!rangeStart ? 'Tap START date' : !rangeEnd ? 'Now tap END date' : 'Range selected! Tap any date to re-pick.'}
              </Text>
            )}

            <View style={styles.weekDaysRow}>
              {dayShortNames[lang].map((d, i) => (
                <Text key={i} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarCells.map((dayStr, index) => {
                if (!dayStr) {
                  return <View key={`empty-${index}`} style={styles.emptyCalCell} />;
                }
                const isSelected =
                  (calendarTarget === 'date' && date === dayStr) ||
                  (calendarTarget === 'fromDate' && fromDate === dayStr) ||
                  (calendarTarget === 'toDate' && toDate === dayStr) ||
                  (calendarTarget === 'editDate' && editDate === dayStr) ||
                  (calendarTarget === 'editToDate' && editToDate === dayStr) ||
                  (calendarTarget === 'filterFromDate' && filterFromDate === dayStr) ||
                  (calendarTarget === 'filterToDate' && filterToDate === dayStr) ||
                  ((calendarTarget === 'range' || calendarTarget === 'filterRange') && (rangeStart === dayStr || rangeEnd === dayStr));

                const isInRange =
                  (calendarTarget === 'range' || calendarTarget === 'filterRange') &&
                  rangeStart &&
                  rangeEnd &&
                  new Date(dayStr) > new Date(rangeStart) &&
                  new Date(dayStr) < new Date(rangeEnd);

                const isToday = formatDateISO(new Date()) === dayStr;

                return (
                  <TouchableOpacity
                    key={dayStr}
                    style={[
                      styles.calCell,
                      isInRange && styles.calCellInRange,
                      isSelected && styles.calCellSelected,
                    ]}
                    onPress={() => handleDayPress(dayStr)}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isToday && styles.calDayToday,
                        isSelected && styles.calDaySelectedText,
                      ]}
                    >
                      {parseInt(dayStr.split('-')[2], 10)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calActions}>
              <TouchableOpacity
                style={styles.calActionTodayBtn}
                onPress={() => {
                  const todayStr = formatDateISO(new Date());
                  handleDayPress(todayStr);
                }}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg || '#0b0f19',
  },
  centered: {
    flex: 1,
    backgroundColor: theme.colors.bg || '#0b0f19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
    paddingBottom: 160,
    backgroundColor: theme.colors.bg || '#0b0f19',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  devotionalHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  langBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '50',
  },
  langBtnText: {
    color: theme.colors.accent,
    fontWeight: 'bold',
    fontSize: theme.fontSize.xs,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    marginBottom: theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: theme.spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  inputGroup: {
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 4,
    fontWeight: theme.fontWeight.medium,
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    color: theme.colors.accent,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    textAlign: 'center',
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
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarTriggerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  calendarTriggerTextSmall: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  calendarIcon: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  dateRangeRow: {
    flexDirection: 'row',
  },
  openRangeCalBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  openRangeCalText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },

  // Month Entry Mode Styles
  monthSelectSection: {
    marginBottom: theme.spacing.sm,
  },
  monthYearNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  yearNavBtn: {
    padding: 6,
  },
  yearNavText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  yearNavTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
  },
  monthGridHelper: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '500',
  },
  monthsPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  monthPill: {
    width: '23%',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  monthPillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  monthPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedMonthCard: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    marginBottom: 6,
  },
  selectedMonthTitle: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  selectedMonthSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  warningBanner: {
    backgroundColor: '#78350f',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningBannerText: {
    color: '#fef08a',
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    lineHeight: 16,
  },

  mergeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  mergeTitle: { color: '#a7f3d0', fontSize: theme.fontSize.xs, fontWeight: 'bold' },
  mergeSubtitle: { color: '#6ee7b7', fontSize: 10, marginTop: 2 },
  mergeBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.sm, marginLeft: 8 },
  mergeBtnText: { color: '#000', fontSize: theme.fontSize.xs, fontWeight: 'bold' },

  multiMonthCard: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginVertical: 6,
  },
  multiMonthNoticeText: { color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: 'bold', marginBottom: 6 },
  multiMonthToggleRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  multiMonthToggleBtn: { flex: 1, paddingVertical: 6, paddingHorizontal: 6, backgroundColor: theme.colors.bgInput, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  multiMonthToggleBtnActive: { backgroundColor: theme.colors.primary },
  multiMonthToggleText: { color: theme.colors.textMuted, fontSize: 10, textAlign: 'center' },
  multiMonthToggleTextActive: { color: '#fff', fontWeight: 'bold' },
  splitInputsContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  splitInputGroup: { flex: 1 },
  splitInputLabel: { color: theme.colors.textPrimary, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  splitInput: { backgroundColor: theme.colors.bgInput, borderRadius: theme.borderRadius.sm, padding: 8, color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: 'bold', textAlign: 'center' },

  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold },

  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  navArrow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
  },
  monthNavText: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold },
  monthTitle: { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold },

  summaryCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTitle: { fontSize: theme.fontSize.sm, color: theme.colors.accent, fontWeight: theme.fontWeight.bold, marginBottom: theme.spacing.sm, textAlign: 'center' },
  summaryStats: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  summaryStatItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: theme.fontWeight.heavy, color: theme.colors.accent },
  summaryLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: theme.colors.border },

  // WhatsApp Share Button Styles
  shareWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  shareWhatsAppBtnIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  shareWhatsAppBtnContent: {
    flex: 1,
  },
  shareWhatsAppBtnText: {
    color: '#34d399',
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  shareWhatsAppBtnSubtext: {
    color: '#a7f3d0',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  shareWhatsAppArrow: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  historySection: {
    marginBottom: theme.spacing.xl,
  },
  historyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  entryDate: { flex: 1 },
  entryDateText: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: theme.fontWeight.semibold },
  rangeBadgeText: { fontSize: 9, color: theme.colors.primary, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 1 },
  monthBadgeText: { color: '#10b981' },
  entryNoteText: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  entryCount: { alignItems: 'flex-end', marginRight: theme.spacing.sm },
  entryCountText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.accent },
  entryCountLabel: { fontSize: 10, color: theme.colors.textMuted },
  entryEditIcon: { fontSize: 14, opacity: 0.7 },

  emptyState: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: theme.spacing.xs },
  emptyTitle: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary },
  emptyHint: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
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

  // Calendar Modal
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
});

export default JapmalaScreen;
