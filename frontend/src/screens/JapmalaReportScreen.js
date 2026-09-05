import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Linking,
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
  Share,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import theme from '../theme';
import { showAlert, showConfirm } from '../utils/dialog';
import { toMarathiDigits, toEnglishDigits, formatNumberByLang, transliterateToMarathi } from '../utils/marathiUtils';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const marathiMonthNames = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

const monthShortNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const marathiMonthShortNames = [
  'जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टें', 'ऑक्टो', 'नोव्हे', 'डिसे'
];

const dayShortNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MARATHI_MONTHS_MAP = [
  { index: 0, marathi: 'जानेवारी', english: 'Jan', keywords: ['जानेवारी', 'जाने', 'january', 'jan'] },
  { index: 1, marathi: 'फेब्रुवारी', english: 'Feb', keywords: ['फेब्रुवारी', 'फेब्रु', 'february', 'feb'] },
  { index: 2, marathi: 'मार्च', english: 'Mar', keywords: ['मार्च', 'march', 'mar'] },
  { index: 3, marathi: 'एप्रिल', english: 'Apr', keywords: ['एप्रिल', 'april', 'apr'] },
  { index: 4, marathi: 'मे', english: 'May', keywords: ['मे', 'may'] },
  { index: 5, marathi: 'जून', english: 'Jun', keywords: ['जून', 'june', 'jun'] },
  { index: 6, marathi: 'जुलै', english: 'Jul', keywords: ['जुलै', 'july', 'jul'] },
  { index: 7, marathi: 'ऑगस्ट', english: 'Aug', keywords: ['ऑगस्ट', 'आगस्ट', 'ऑगष्ट', 'august', 'aug'] },
  { index: 8, marathi: 'सप्टेंबर', english: 'Sep', keywords: ['सप्टेंबर', 'सप्टें', 'सप्टे', 'september', 'sep', 'sept'] },
  { index: 9, marathi: 'ऑक्टोबर', english: 'Oct', keywords: ['ऑक्टोबर', 'ऑक्टो', 'october', 'oct'] },
  { index: 10, marathi: 'नोव्हेंबर', english: 'Nov', keywords: ['नोव्हेंबर', 'नोव्हे', 'november', 'nov'] },
  { index: 11, marathi: 'डिसेंबर', english: 'Dec', keywords: ['डिसेंबर', 'डिसे', 'december', 'dec'] },
];

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

function convertDevanagariDigits(str) {
  if (!str) return '';
  const devDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[०-९]/g, (d) => {
    const idx = devDigits.indexOf(d);
    return idx >= 0 ? idx.toString() : d;
  });
}

function getMonthRangeISO(year, monthIndex) {
  const s = new Date(Date.UTC(year, monthIndex, 1));
  const e = new Date(Date.UTC(year, monthIndex + 1, 0));
  const sStr = `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const eStr = `${e.getUTCFullYear()}-${String(e.getUTCMonth() + 1).padStart(2, '0')}-${String(e.getUTCDate()).padStart(2, '0')}`;
  return { from: sStr, to: eStr };
}

const NAME_TRANSLIT_MAP = {
  'गणेश': 'ganesh',
  'गावकर': 'gavkar',
  'गांवकर': 'gavkar',
  'संगीता': 'sangeeta',
  'संगिता': 'sangita',
  'मोरे': 'more',
  'आबासाहेब': 'abasaheb',
  'ओमकार': 'omkar',
  'साक्षी': 'sakshi',
  'नितीन': 'nitin',
  'प्रशांत': 'prashant',
  'सचिन': 'sachin',
  'विकास': 'vikas',
  'सुनील': 'sunil',
  'अमित': 'amit',
  'राहुल': 'rahul',
};

function matchUserByName(rawName, users) {
  if (!rawName || !users || users.length === 0) return null;
  const clean = rawName.toLowerCase().replace(/[^\u0900-\u097Fa-z0-9\s]/g, '').trim();
  if (!clean) return null;

  // 1. Direct match
  const exact = users.find(u => u.name && u.name.toLowerCase().trim() === clean);
  if (exact) return exact;

  // 2. Substring match
  const sub = users.find(u => u.name && (u.name.toLowerCase().includes(clean) || clean.includes(u.name.toLowerCase())));
  if (sub) return sub;

  // 3. Phonetic / Transliteration match
  const rawTokens = clean.split(/\s+/).filter(Boolean);
  let bestScore = 0;
  let bestUser = null;

  users.forEach(u => {
    if (!u.name) return;
    const uLower = u.name.toLowerCase();
    const uTokens = uLower.split(/\s+/).filter(Boolean);
    let score = 0;

    rawTokens.forEach(rt => {
      const trans = NAME_TRANSLIT_MAP[rt] || rt;
      if (uLower.includes(trans)) score += 2;
      uTokens.forEach(ut => {
        if (ut.includes(trans) || trans.includes(ut)) score += 1;
      });
    });

    if (score > bestScore) {
      bestScore = score;
      bestUser = u;
    }
  });

  if (bestScore >= 2) return bestUser;
  return null;
}

const JapmalaReportScreen = () => {
  // 🌟 Filter Modes: 'all' (Default), 'month', 'year', 'range'
  const [lang, setLang] = useState('mr');
  const [filterMode, setFilterMode] = useState('all');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [report, setReport] = useState([]);
  const [reportSearch, setReportSearch] = useState('');
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
  const [entryType, setEntryType] = useState('daily'); // 'daily', 'month', 'range', 'monthly_grid'
  const [entryDate, setEntryDate] = useState(formatDateISO(new Date()));
  const [entryFrom, setEntryFrom] = useState(formatDateISO(new Date()));
  const [entryTo, setEntryTo] = useState(formatDateISO(new Date()));
  const [singleMonthVal, setSingleMonthVal] = useState(now.getMonth());
  const [singleYearVal, setSingleYearVal] = useState(now.getFullYear());
  const [entryCount, setEntryCount] = useState('');
  const [entryNote, setEntryNote] = useState('Added by Admin (Phone Call)');
  const [submitting, setSubmitting] = useState(false);

  // 12-Month Grid Entry State
  const [gridYear, setGridYear] = useState(now.getFullYear());
  const [monthlyGridCounts, setMonthlyGridCounts] = useState({
    0: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: ''
  });

  // WhatsApp Smart Parser State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState('');
  const [parsedDevotees, setParsedDevotees] = useState([]);
  const [whatsAppYear, setWhatsAppYear] = useState(now.getFullYear());
  const [activePickerDevoteeId, setActivePickerDevoteeId] = useState(null);
  const [devoteePickerSearch, setDevoteePickerSearch] = useState('');
  const [isSubmittingWhatsApp, setIsSubmittingWhatsApp] = useState(false);

  // Member Detail / Edit Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberEntries, setMemberEntries] = useState([]);
  const [loadingMemberEntries, setLoadingMemberEntries] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Single Entry Edit Modal (within member detail)
  const [editEntryItem, setEditEntryItem] = useState(null);
  const [editEntryType, setEditEntryType] = useState('daily'); // 'daily', 'month', 'range'
  const [editDateVal, setEditDateVal] = useState('');
  const [editToDateVal, setEditToDateVal] = useState('');
  const [editMonthVal, setEditMonthVal] = useState(now.getMonth());
  const [editYearVal, setEditYearVal] = useState(now.getFullYear());
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
    } else if (filterMode === 'year') {
      return `?year=${filterYear}&from=${filterYear}-01-01&to=${filterYear}-12-31`;
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

  useEffect(() => {
    fetchReport();
  }, [filterMode, selectedMonth, selectedYear, filterYear]);

  useFocusEffect(
    useCallback(() => {
      fetchReport();
      fetchAllUsers();
    }, [filterMode, selectedMonth, selectedYear, filterYear])
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

    try {
      setSubmitting(true);

      if (entryType === 'monthly_grid') {
        const breakdown = [];
        Object.keys(monthlyGridCounts).forEach(mIdx => {
          const val = monthlyGridCounts[mIdx];
          if (val && Number(val) > 0) {
            const range = getMonthRangeISO(gridYear, Number(mIdx));
            breakdown.push({
              from: range.from,
              to: range.to,
              count: Number(toEnglishDigits(val)),
            });
          }
        });

        if (breakdown.length === 0) {
          showAlert('Required', 'Please enter counts for at least one month.');
          setSubmitting(false);
          return;
        }

        await api.post('/japmala', {
          userId: selectedUser._id,
          monthlyBreakdown: breakdown,
          note: `Monthly breakdown for ${gridYear}`,
        });

        showAlert('✅ Success', `Saved ${breakdown.length} months of Japmala for ${selectedUser.name}!`);
      } else if (entryType === 'month') {
        if (!entryCount || Number(entryCount) <= 0) {
          showAlert('Required', 'Please enter a valid count of माळा.');
          setSubmitting(false);
          return;
        }
        const mRange = getMonthRangeISO(singleYearVal, singleMonthVal);
        await api.post('/japmala', {
          userId: selectedUser._id,
          entryType: 'range',
          date: mRange.from,
          toDate: mRange.to,
          count: Number(toEnglishDigits(entryCount)),
          note: entryNote || `Monthly count for ${monthNames[singleMonthVal]} ${singleYearVal}`,
        });
        showAlert('✅ Success', `Saved ${entryCount} माळा for ${monthNames[singleMonthVal]} ${singleYearVal} for ${selectedUser.name}!`);
      } else if (entryType === 'daily') {
        if (!entryCount || Number(entryCount) <= 0) {
          showAlert('Required', 'Please enter a valid count of माळा.');
          setSubmitting(false);
          return;
        }
        await api.post('/japmala', {
          userId: selectedUser._id,
          entryType: 'daily',
          date: entryDate,
          count: Number(toEnglishDigits(entryCount)),
          note: entryNote,
        });
        showAlert('✅ Success', `Saved ${entryCount} माळा for ${selectedUser.name}!`);
      } else {
        if (!entryCount || Number(entryCount) <= 0) {
          showAlert('Required', 'Please enter a valid count of माळा.');
          setSubmitting(false);
          return;
        }
        await api.post('/japmala', {
          userId: selectedUser._id,
          entryType: 'range',
          date: entryFrom,
          toDate: entryTo,
          count: Number(toEnglishDigits(entryCount)),
          note: entryNote,
        });
        showAlert('✅ Success', `Saved ${entryCount} माळा for ${selectedUser.name}!`);
      }

      setShowAddModal(false);
      setSelectedUser(null);
      setEntryCount('');
      setMonthlyGridCounts({
        0: '', 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: ''
      });
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

  // ─── WHATSAPP SMART PARSER LOGIC ───
  const parseWhatsAppMessage = (text, targetYearNum) => {
    if (!text || !text.trim()) {
      setParsedDevotees([]);
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];
    let currentDevotee = null;

    const isNoiseLine = (line) => {
      const lower = line.toLowerCase();
      return (
        lower.includes('जय सच्चिदानंद') ||
        lower.includes('जय सच्चिदानन्द') ||
        lower.includes('जय गुरुदेव') ||
        lower.includes('हरि: ॐ') ||
        lower.includes('हरि ॐ') ||
        lower.includes('read more') ||
        lower.includes('forwarded') ||
        lower.startsWith('~') ||
        lower.includes('am') || lower.includes('pm') ||
        /^\+?\d[\d\s\-()]{7,}\d$/.test(line)
      );
    };

    lines.forEach((line) => {
      if (isNoiseLine(line)) return;

      const normalizedLine = convertDevanagariDigits(line);
      const lowerLine = normalizedLine.toLowerCase();

      // Check if line matches a month
      let matchedMonth = null;
      for (const m of MARATHI_MONTHS_MAP) {
        for (const kw of m.keywords) {
          if (lowerLine.includes(kw)) {
            matchedMonth = m;
            break;
          }
        }
        if (matchedMonth) break;
      }

      if (matchedMonth) {
        const numMatches = normalizedLine.match(/\b\d+\b/g);
        let count = 0;
        if (numMatches && numMatches.length > 0) {
          count = parseInt(numMatches[numMatches.length - 1], 10);
        }

        if (!currentDevotee) {
          currentDevotee = {
            id: 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            rawName: 'Devotee ' + (results.length + 1),
            selectedUser: null,
            months: [],
          };
          results.push(currentDevotee);
        }

        const range = getMonthRangeISO(targetYearNum, matchedMonth.index);
        const existingIdx = currentDevotee.months.findIndex(m => m.monthIndex === matchedMonth.index);
        if (existingIdx >= 0) {
          currentDevotee.months[existingIdx].count = count;
        } else {
          currentDevotee.months.push({
            monthIndex: matchedMonth.index,
            monthName: `${matchedMonth.marathi} (${matchedMonth.english})`,
            count: count,
            from: range.from,
            to: range.to,
          });
        }
      } else {
        // Starts a new Devotee block
        const matchedUser = matchUserByName(line, allUsers);
        currentDevotee = {
          id: 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          rawName: line,
          selectedUser: matchedUser,
          months: [],
        };
        results.push(currentDevotee);
      }
    });

    // Sort months chronologically
    results.forEach(d => {
      d.months.sort((a, b) => a.monthIndex - b.monthIndex);
    });

    setParsedDevotees(results);
  };

  const handleSaveWhatsAppBatch = async () => {
    if (parsedDevotees.length === 0) {
      showAlert('Empty', 'No devotee data parsed. Please paste text first.');
      return;
    }

    // Validation: make sure all devotees have a selected user
    const unassigned = parsedDevotees.filter(d => !d.selectedUser);
    if (unassigned.length > 0) {
      showAlert(
        'Select Devotees',
        `Please select a registered member for "${unassigned[0].rawName}" before saving.`
      );
      return;
    }

    const devoteesWithCounts = parsedDevotees.filter(d => d.months.length > 0);
    if (devoteesWithCounts.length === 0) {
      showAlert('No Counts', 'No month counts were found to save.');
      return;
    }

    try {
      setIsSubmittingWhatsApp(true);
      let totalMonthsSaved = 0;
      let totalDevoteesSaved = 0;

      for (const dev of devoteesWithCounts) {
        const breakdown = dev.months
          .filter(m => Number(m.count) >= 0)
          .map(m => ({
            from: m.from,
            to: m.to,
            count: Number(m.count),
          }));

        if (breakdown.length > 0) {
          await api.post('/japmala', {
            userId: dev.selectedUser._id,
            monthlyBreakdown: breakdown,
            note: 'Imported from WhatsApp message',
          });
          totalMonthsSaved += breakdown.length;
          totalDevoteesSaved += 1;
        }
      }

      showAlert(
        '🎉 Success!',
        `Successfully saved Japmala for ${totalDevoteesSaved} devotee(s) across ${totalMonthsSaved} monthly entries!`
      );
      setShowWhatsAppModal(false);
      setWhatsAppText('');
      setParsedDevotees([]);
      fetchReport();
    } catch (err) {
      console.error('Batch error:', err);
      showAlert('Error', err.response?.data?.message || 'Failed to save batch entries.');
    } finally {
      setIsSubmittingWhatsApp(false);
    }
  };

  // ─── SHARE WHATSAPP REPORT ───
  const handleShareWhatsApp = async () => {
    if (report.length === 0) {
      showAlert('Info', 'No standings to share.');
      return;
    }

    const periodTitle =
      filterMode === 'all'
        ? 'सर्व काळ (All Time)'
        : filterMode === 'month'
        ? `${monthNames[selectedMonth]} ${selectedYear}`
        : filterMode === 'year'
        ? `वर्ष (Year) ${filterYear}`
        : `${formatDateDisplay(fromDate)} ते ${formatDateDisplay(toDate)}`;

    let msg = `📿 *श्री गुरुदेव दत्त - जपमाळा अहवाल* 📿\n`;
    msg += `📅 कालावधी: ${periodTitle}\n`;
    msg += `👥 एकूण भाविक: ${report.length}\n`;
    msg += `🌟 एकूण जपमाळा: ${grandTotal}\n\n`;
    msg += `🏆 *भाविक माळा क्रमवारी:*\n`;

    report.forEach((item, index) => {
      msg += `${index + 1}. ${item.name} - ${item.total} माळा\n`;
    });

    msg += `\n🙏 *जय सच्चिदानंद* 🙏`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(msg);
        showAlert('Copied!', 'WhatsApp report copied to clipboard. You can paste it in your WhatsApp group!');
      } catch (e) {
        // Ignore clipboard error
      }
    }

    try {
      await Share.share({
        message: msg,
        title: 'Japmala Report',
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleOpenEdit = (entry) => {
    setEditEntryItem(entry);
    const isRange = entry.entryType === 'range' || !!entry.toDate;
    const isFullMonth = isRange && isPerfectMonth(entry.date, entry.toDate);

    if (isFullMonth) {
      setEditEntryType('month');
      setEditMonthVal(new Date(entry.date).getUTCMonth());
      setEditYearVal(new Date(entry.date).getUTCFullYear());
    } else if (isRange) {
      setEditEntryType('range');
      setEditDateVal(formatDateISO(new Date(entry.date)));
      setEditToDateVal(entry.toDate ? formatDateISO(new Date(entry.toDate)) : '');
    } else {
      setEditEntryType('daily');
      setEditDateVal(formatDateISO(new Date(entry.date)));
      setEditToDateVal('');
    }

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

    let targetDate = editDateVal;
    let targetToDate = editEntryType === 'range' ? editToDateVal : null;
    let targetType = editEntryType;

    if (editEntryType === 'month') {
      const mRange = getMonthRangeISO(editYearVal, editMonthVal);
      targetDate = mRange.from;
      targetToDate = mRange.to;
      targetType = 'range';
    }

    try {
      await api.put(`/japmala/${editEntryItem._id}`, {
        count: Number(toEnglishDigits(editCountVal)),
        note: editNoteVal,
        date: targetDate,
        toDate: targetToDate,
        entryType: targetType,
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

      // Export Excel (.xlsx) dynamically tailored to the active filter mode
  const handleExportExcel = async () => {
    try {
      // 1. Fetch user directory for accurate Age mapping
      const userAgeMap = {};
      try {
        const usersRes = await api.get('/admin/users');
        const allUsersList = usersRes.data?.users || [];
        allUsersList.forEach((usr) => {
          const valAge = (usr.age !== undefined && usr.age !== null && usr.age !== '') ? usr.age : null;
          if (valAge != null) {
            if (usr._id) userAgeMap[usr._id.toString()] = valAge;
            if (usr.name) userAgeMap[usr.name.trim().toLowerCase()] = valAge;
            if (usr.username) userAgeMap[usr.username.trim().toLowerCase()] = valAge;
            if (usr.phone) userAgeMap[usr.phone.trim()] = valAge;
          }
        });
      } catch (e) {
        console.warn('Could not fetch admin users for age mapping:', e);
      }

      const getDevoteeAge = (u) => {
        const rawAge = (u.age !== undefined && u.age !== null && u.age !== '')
          ? u.age
          : (u._id ? userAgeMap[u._id.toString()] : null) ??
            (u.name ? userAgeMap[u.name.trim().toLowerCase()] : null) ??
            (u.username ? userAgeMap[u.username.trim().toLowerCase()] : null) ??
            (u.phone ? userAgeMap[u.phone.trim()] : null);

        return (rawAge !== undefined && rawAge !== null && rawAge !== '')
          ? (Number(rawAge) || rawAge)
          : '—';
      };

      // ─── CASE 1: BY YEAR (Official 12-Month Register) ───
      if (filterMode === 'year') {
        const yearToExport = filterYear;
        const res = await api.get(`/japmala/report?year=${yearToExport}`);
        const reportData = res.data?.report || report || [];
        const grandTotalVal = res.data?.grandTotal ?? grandTotal;

        const userMonthPromises = reportData.map(async (u) => {
          try {
            const uRes = await api.get(`/japmala/user/${u._id}?year=${yearToExport}`);
            const entries = uRes.data?.entries || [];
            const months = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            entries.forEach((e) => {
              const d = new Date(e.date);
              const m = d.getUTCMonth();
              if (m >= 0 && m <= 11) {
                months[m] += Number(e.count) || 0;
              }
            });
            const total = months.reduce((acc, c) => acc + c, 0) || u.total || 0;

            return {
              name: u.name || 'अनामिक भाविक',
              age: getDevoteeAge(u),
              months,
              total,
            };
          } catch (e) {
            return {
              name: u.name || 'अनामिक भाविक',
              age: getDevoteeAge(u),
              months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              total: u.total || 0,
            };
          }
        });

        const userRows = await Promise.all(userMonthPromises);
        userRows.sort((a, b) => a.name.localeCompare(b.name, 'mr'));

        const headers = [
          ['॥ हरिः ॐ तत्सत् ॥'],
          ['गुरुमंत्र जपानुष्ठान नोंदणी तक्ता'],
          [`वर्ष : ${yearToExport} (Year: ${yearToExport})`],
          ['संत समाज :-'],
          [
            'अ.क्र.',
            'शिष्य (नाव)',
            'वय',
            'जानेवारी',
            'फेब्रुवारी',
            'मार्च',
            'एप्रिल',
            'मे',
            'जून',
            'जुलै',
            'ऑगस्ट',
            'सप्टेंबर',
            'ऑक्टोबर',
            'नोव्हेंबर',
            'डिसेंबर',
            'एकूण माळा'
          ]
        ];

        const dataRows = [];
        const monthTotals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let calcGrandTotal = 0;

        userRows.forEach((r, idx) => {
          dataRows.push([
            idx + 1,
            r.name,
            r.age,
            ...r.months,
            r.total
          ]);
          r.months.forEach((cnt, mIdx) => {
            monthTotals[mIdx] += cnt;
          });
          calcGrandTotal += r.total;
        });

        const totalRowIndex = headers.length + dataRows.length;
        const totalRow = [
          'एकूण (Overall Total)',
          '',
          '',
          ...monthTotals,
          calcGrandTotal || grandTotalVal
        ];

        const footerRows = [
          [''],
          ['॥ जय सच्चिदानंद ॥']
        ];

        const allRows = [...headers, ...dataRows, totalRow, ...footerRows];

        const buildAndSave = (XLSX) => {
          const ws = XLSX.utils.aoa_to_sheet(allRows);
          ws['!cols'] = [
            { wch: 8 },  // अ.क्र.
            { wch: 28 }, // नाव
            { wch: 8 },  // वय
            { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 },
            { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 11 },
            { wch: 14 }  // एकूण माळा
          ];

          const footerRowIndex = allRows.length - 1;
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
            { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } },
            { s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 15 } }
          ];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, `जपानुष्ठान_${yearToExport}`);
          XLSX.writeFile(wb, `Japmala_Nondani_Takta_${yearToExport}.xlsx`);
        };

                const token = await AsyncStorage.getItem('token');
        const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const downloadUrl = `${api.defaults.baseURL}/japmala/export-excel?mode=${filterMode}&year=${selectedYear}&filterYear=${filterYear}&month=${monthStr}&from=${fromDate || ''}&to=${toDate || ''}${token ? `&token=${token}` : ''}`;
        if (typeof window !== 'undefined' && window.XLSX) {
          buildAndSave(window.XLSX);
        } else if (typeof document !== 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = () => buildAndSave(window.XLSX);
          document.body.appendChild(script);
        } else if (Linking && Linking.openURL) {
          await Linking.openURL(downloadUrl);
        }
        return;
      }

      // ─── CASE 2: BY MONTH (Single Month Total Column) ───
      if (filterMode === 'month') {
        const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const monthLabelMr = `${marathiMonthNames[selectedMonth]} ${selectedYear}`;
        const monthLabelEn = `${monthNames[selectedMonth]} ${selectedYear}`;

        const res = await api.get(`/japmala/report?month=${monthStr}`);
        const reportData = res.data?.report || report || [];
        const grandTotalVal = res.data?.grandTotal ?? grandTotal;

        const userRows = reportData.map((u) => ({
          name: u.name || 'अनामिक भाविक',
          age: getDevoteeAge(u),
          total: u.total || 0,
        }));
        userRows.sort((a, b) => a.name.localeCompare(b.name, 'mr'));

        const headers = [
          ['॥ हरिः ॐ तत्सत् ॥'],
          ['गुरुमंत्र जपानुष्ठान नोंदणी तक्ता'],
          [`महिना : ${monthLabelMr} (${monthLabelEn})`],
          ['संत समाज :-'],
          [
            'अ.क्र.',
            'शिष्य (नाव)',
            'वय',
            `एकूण माळा (${monthLabelMr})`
          ]
        ];

        const dataRows = userRows.map((r, idx) => [
          idx + 1,
          r.name,
          r.age,
          r.total
        ]);

        const totalRowIndex = headers.length + dataRows.length;
        const totalRow = [
          'एकूण (Overall Total)',
          '',
          '',
          grandTotalVal
        ];

        const footerRows = [
          [''],
          ['॥ जय सच्चिदानंद ॥']
        ];

        const allRows = [...headers, ...dataRows, totalRow, ...footerRows];

        const buildAndSave = (XLSX) => {
          const ws = XLSX.utils.aoa_to_sheet(allRows);
          ws['!cols'] = [
            { wch: 8 },  // अ.क्र.
            { wch: 30 }, // नाव
            { wch: 10 }, // वय
            { wch: 25 }  // एकूण माळा
          ];

          const footerRowIndex = allRows.length - 1;
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
            { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } },
            { s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 3 } }
          ];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, `जपानुष्ठान_${monthNames[selectedMonth]}_${selectedYear}`);
          XLSX.writeFile(wb, `Japmala_Nondani_Takta_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
        };

                const token = await AsyncStorage.getItem('token');
        const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const downloadUrl = `${api.defaults.baseURL}/japmala/export-excel?mode=${filterMode}&year=${selectedYear}&filterYear=${filterYear}&month=${monthStr}&from=${fromDate || ''}&to=${toDate || ''}${token ? `&token=${token}` : ''}`;
        if (typeof window !== 'undefined' && window.XLSX) {
          buildAndSave(window.XLSX);
        } else if (typeof document !== 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = () => buildAndSave(window.XLSX);
          document.body.appendChild(script);
        } else if (Linking && Linking.openURL) {
          await Linking.openURL(downloadUrl);
        }
        return;
      }

      // ─── CASE 3: ALL TIME (Single Overall Total Column) ───
      if (filterMode === 'all') {
        const res = await api.get('/japmala/report');
        const reportData = res.data?.report || report || [];
        const grandTotalVal = res.data?.grandTotal ?? grandTotal;

        const userRows = reportData.map((u) => ({
          name: u.name || 'अनामिक भाविक',
          age: getDevoteeAge(u),
          total: u.total || 0,
        }));
        userRows.sort((a, b) => a.name.localeCompare(b.name, 'mr'));

        const headers = [
          ['॥ हरिः ॐ तत्सत् ॥'],
          ['गुरुमंत्र जपानुष्ठान नोंदणी तक्ता'],
          ['कालावधी : सर्वकाळ (All-Time Grand Total)'],
          ['संत समाज :-'],
          [
            'अ.क्र.',
            'शिष्य (नाव)',
            'वय',
            'एकूण माळा (Grand Total)'
          ]
        ];

        const dataRows = userRows.map((r, idx) => [
          idx + 1,
          r.name,
          r.age,
          r.total
        ]);

        const totalRowIndex = headers.length + dataRows.length;
        const totalRow = [
          'एकूण (Overall Total)',
          '',
          '',
          grandTotalVal
        ];

        const footerRows = [
          [''],
          ['॥ जय सच्चिदानंद ॥']
        ];

        const allRows = [...headers, ...dataRows, totalRow, ...footerRows];

        const buildAndSave = (XLSX) => {
          const ws = XLSX.utils.aoa_to_sheet(allRows);
          ws['!cols'] = [
            { wch: 8 },  // अ.क्र.
            { wch: 30 }, // नाव
            { wch: 10 }, // वय
            { wch: 25 }  // एकूण माळा
          ];

          const footerRowIndex = allRows.length - 1;
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
            { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } },
            { s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 3 } }
          ];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'जपानुष्ठान_सर्वकाळ');
          XLSX.writeFile(wb, 'Japmala_Nondani_Takta_All_Time.xlsx');
        };

                const token = await AsyncStorage.getItem('token');
        const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const downloadUrl = `${api.defaults.baseURL}/japmala/export-excel?mode=${filterMode}&year=${selectedYear}&filterYear=${filterYear}&month=${monthStr}&from=${fromDate || ''}&to=${toDate || ''}${token ? `&token=${token}` : ''}`;
        if (typeof window !== 'undefined' && window.XLSX) {
          buildAndSave(window.XLSX);
        } else if (typeof document !== 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = () => buildAndSave(window.XLSX);
          document.body.appendChild(script);
        } else if (Linking && Linking.openURL) {
          await Linking.openURL(downloadUrl);
        }
        return;
      }

      // ─── CASE 4: DATE RANGE (Custom Range Total Column) ───
      if (filterMode === 'range') {
        const res = await api.get(`/japmala/report?from=${fromDate}&to=${toDate}`);
        const reportData = res.data?.report || report || [];
        const grandTotalVal = res.data?.grandTotal ?? grandTotal;

        const userRows = reportData.map((u) => ({
          name: u.name || 'अनामिक भाविक',
          age: getDevoteeAge(u),
          total: u.total || 0,
        }));
        userRows.sort((a, b) => a.name.localeCompare(b.name, 'mr'));

        const rangeLabel = `${formatDateDisplay(fromDate)} ते ${formatDateDisplay(toDate)}`;

        const headers = [
          ['॥ हरिः ॐ तत्सत् ॥'],
          ['गुरुमंत्र जपानुष्ठान नोंदणी तक्ता'],
          [`कालावधी : ${rangeLabel}`],
          ['संत समाज :-'],
          [
            'अ.क्र.',
            'शिष्य (नाव)',
            'वय',
            `एकूण माळा (${rangeLabel})`
          ]
        ];

        const dataRows = userRows.map((r, idx) => [
          idx + 1,
          r.name,
          r.age,
          r.total
        ]);

        const totalRowIndex = headers.length + dataRows.length;
        const totalRow = [
          'एकूण (Overall Total)',
          '',
          '',
          grandTotalVal
        ];

        const footerRows = [
          [''],
          ['॥ जय सच्चिदानंद ॥']
        ];

        const allRows = [...headers, ...dataRows, totalRow, ...footerRows];

        const buildAndSave = (XLSX) => {
          const ws = XLSX.utils.aoa_to_sheet(allRows);
          ws['!cols'] = [
            { wch: 8 },  // अ.क्र.
            { wch: 30 }, // नाव
            { wch: 10 }, // वय
            { wch: 28 }  // एकूण माळा
          ];

          const footerRowIndex = allRows.length - 1;
          ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
            { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 2 } },
            { s: { r: footerRowIndex, c: 0 }, e: { r: footerRowIndex, c: 3 } }
          ];

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'जपानुष्ठान_दिनांक_कालावधी');
          XLSX.writeFile(wb, `Japmala_Nondani_Takta_${fromDate}_to_${toDate}.xlsx`);
        };

                const token = await AsyncStorage.getItem('token');
        const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const downloadUrl = `${api.defaults.baseURL}/japmala/export-excel?mode=${filterMode}&year=${selectedYear}&filterYear=${filterYear}&month=${monthStr}&from=${fromDate || ''}&to=${toDate || ''}${token ? `&token=${token}` : ''}`;
        if (typeof window !== 'undefined' && window.XLSX) {
          buildAndSave(window.XLSX);
        } else if (typeof document !== 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = () => buildAndSave(window.XLSX);
          document.body.appendChild(script);
        } else if (Linking && Linking.openURL) {
          await Linking.openURL(downloadUrl);
        }
        return;
      }
    } catch (err) {
      console.error('Excel Generation Error:', err);
      showAlert('Error', 'Failed to generate Excel sheet. Please try again.');
    }
  };

  const handleExport = handleExportExcel;

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

  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase();
    return (u.name && u.name.toLowerCase().includes(q)) || (u.phone && u.phone.includes(q));
  });

  const filteredReport = report.filter((item) => {
    const q = reportSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.phone && item.phone.includes(q)) ||
      (item.username && item.username.toLowerCase().includes(q))
    );
  });

  const renderMember = ({ item, index }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => openMemberDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.memberRank}>
        <Text style={styles.memberRankText}>{formatNumberByLang(index + 1, lang)}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <View style={styles.memberSubRow}>
          {item.age != null && item.age !== '' ? (
            <View style={styles.memberAgeBadge}>
              <Text style={styles.memberAgeText}>
                {lang === 'mr' ? `वय: ${toMarathiDigits(item.age)}` : `Age: ${item.age}`}
              </Text>
            </View>
          ) : null}
          {item.phone ? (
            <Text style={styles.memberPhone}>
              📞 {lang === 'mr' ? toMarathiDigits(item.phone) : item.phone}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.memberTotal}>
        <Text style={styles.memberTotalCount}>{formatNumberByLang(item.total, lang)}</Text>
        <Text style={styles.memberTotalLabel}>
          {lang === 'mr' ? '✏️ व्यवस्थापित' : '✏️ Manage'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredReport}
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
            {/* Devotional Header */}
            <View style={styles.devotionalHeaderContainer}>
              <Text style={styles.devotionalHeader}>जय सच्चिदानंद 🚩</Text>
              <Text style={styles.reportMainTitle}>
                {lang === 'mr' ? '📿 जपमाळा अहवाल व नोंदी' : '📿 Japmala Consolidated Report'}
              </Text>
            </View>

            {/* Language Switcher Bar */}
            <View style={styles.langHeaderContainer}>
              <Text style={styles.langHeaderTitle}>
                {lang === 'mr' ? '🌐 भाषा निवडा / Language:' : '🌐 Language / भाषा:'}
              </Text>
              <View style={styles.langToggleWrap}>
                <TouchableOpacity
                  style={[styles.langChoiceBtn, lang === 'mr' && styles.langChoiceBtnActive]}
                  onPress={() => setLang('mr')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langChoiceText, lang === 'mr' && styles.langChoiceTextActive]}>
                    🚩 मराठी (Marathi)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langChoiceBtn, lang === 'en' && styles.langChoiceBtnActive]}
                  onPress={() => setLang('en')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langChoiceText, lang === 'en' && styles.langChoiceTextActive]}>
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Action Buttons Row */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={[styles.addMemberEntryBtn, { flex: 1, marginRight: 6 }]}
                onPress={() => {
                  setSelectedUser(null);
                  setEntryCount('');
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.addMemberEntryEmoji}>✍️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addMemberEntryTitle}>Member Entry</Text>
                  <Text style={styles.addMemberEntrySubtitle}>Day, Month, Range or Grid</Text>
                </View>
                <Text style={styles.addMemberPlus}>＋</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pasteWhatsAppBtn, { flex: 1, marginLeft: 6 }]}
                onPress={() => {
                  setWhatsAppText('');
                  setParsedDevotees([]);
                  setShowWhatsAppModal(true);
                }}
              >
                <Text style={styles.pasteWhatsAppEmoji}>💬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pasteWhatsAppTitle}>Paste WhatsApp</Text>
                  <Text style={styles.pasteWhatsAppSubtitle}>Auto-Parse Multi-Devotee</Text>
                </View>
                <Text style={styles.pasteWhatsAppPlus}>⚡</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Card with 4 Tabs */}
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
                  style={[styles.toggleBtn, filterMode === 'year' && styles.toggleBtnActive]}
                  onPress={() => setFilterMode('year')}
                >
                  <Text style={[styles.toggleText, filterMode === 'year' && styles.toggleTextActive]}>
                    🗓️ By Year
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

              {/* Mode 3: Year Selector */}
              {filterMode === 'year' && (
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={prevYear} style={styles.navArrow}>
                    <Text style={styles.monthNavText}>← {filterYear - 1}</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>🗓️ Year {filterYear}</Text>
                  <TouchableOpacity onPress={nextYear} style={styles.navArrow}>
                    <Text style={styles.monthNavText}>{filterYear + 1} →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mode 4: Custom Date Range Selector */}
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

            {/* Export Official PDF & Share WhatsApp Action Row */}
            {fetched && report.length > 0 && (
              <View style={styles.reportActionsRow}>
                <TouchableOpacity style={[styles.exportBtn, { flex: 1.2, marginRight: 8 }]} onPress={handleExportExcel}>
                  <Text style={styles.exportBtnText} numberOfLines={1}>
                    {filterMode === 'all'
                      ? '📊 Excel नोंदणी तक्ता (सर्वकाळ)'
                      : filterMode === 'month'
                      ? `📊 Excel नोंदणी तक्ता (${lang === 'mr' ? marathiMonthNames[selectedMonth] : monthNames[selectedMonth]} ${selectedYear})`
                      : filterMode === 'year'
                      ? `📊 Excel नोंदणी तक्ता (${filterYear})`
                      : `📊 Excel नोंदणी तक्ता (${fromDate && toDate ? `${formatDateDisplay(fromDate)} - ${formatDateDisplay(toDate)}` : 'Date Range'})`
                    }
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.shareWhatsAppBtn, { flex: 1 }]} onPress={handleShareWhatsApp}>
                  <Text style={styles.shareWhatsAppBtnText}>💬 Share WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search Bar for Devotees in Standings */}
            {fetched && report.length > 0 && (
              <View style={styles.reportSearchBox}>
                <Text style={styles.reportSearchIcon}>🔍</Text>
                <TextInput
                  style={styles.reportSearchInput}
                  placeholder="Search devotees by name or phone..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={reportSearch}
                  onChangeText={setReportSearch}
                  autoCapitalize="none"
                />
                {reportSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setReportSearch('')} style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Section Title */}
            {fetched && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Text style={styles.sectionTitle}>Devotee Standings ({filteredReport.length})</Text>
                <Text style={styles.sectionSubtitle}>Tap member to view/edit entries</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          fetched ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{reportSearch ? '🔍' : '📿'}</Text>
              <Text style={styles.emptyTitle}>{reportSearch ? 'No matching devotees' : 'No entries found'}</Text>
              <Text style={styles.emptyHint}>
                {reportSearch
                  ? `No devotees match "${reportSearch}". Try searching with a different name or phone number.`
                  : 'No Japmala entries recorded for this time frame.'}
              </Text>
            </View>
          ) : loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />

      {/* ─── MODAL 1: ADD FOR MEMBER (Single Day, Month, Range, or 12-Month Grid) ─── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
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

              {/* Entry Type 4-way Toggle */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>2. ENTRY TYPE</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, entryType === 'daily' && styles.toggleBtnActive]}
                  onPress={() => setEntryType('daily')}
                >
                  <Text style={[styles.toggleText, entryType === 'daily' && styles.toggleTextActive]}>Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, entryType === 'month' && styles.toggleBtnActive]}
                  onPress={() => setEntryType('month')}
                >
                  <Text style={[styles.toggleText, entryType === 'month' && styles.toggleTextActive]}>Month</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, entryType === 'range' && styles.toggleBtnActive]}
                  onPress={() => setEntryType('range')}
                >
                  <Text style={[styles.toggleText, entryType === 'range' && styles.toggleTextActive]}>Range</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, entryType === 'monthly_grid' && styles.toggleBtnActive]}
                  onPress={() => setEntryType('monthly_grid')}
                >
                  <Text style={[styles.toggleText, entryType === 'monthly_grid' && styles.toggleTextActive]}>12-Mo</Text>
                </TouchableOpacity>
              </View>

              {/* TYPE 1: DAILY */}
              {entryType === 'daily' && (
                <View>
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

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>3. TOTAL माळा COUNT</Text>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.countInputBig}
                      placeholder="0"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={entryCount}
                      onChangeText={setEntryCount}
                    />
                  </View>
                </View>
              )}

              {/* TYPE 2: SINGLE MONTH */}
              {entryType === 'month' && (
                <View>
                  {/* Year selector */}
                  <View style={styles.gridYearNav}>
                    <TouchableOpacity onPress={() => setSingleYearVal(singleYearVal - 1)} style={styles.gridYearArrow}>
                      <Text style={styles.gridYearArrowText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.gridYearTitle}>Year {singleYearVal}</Text>
                    <TouchableOpacity onPress={() => setSingleYearVal(singleYearVal + 1)} style={styles.gridYearArrow}>
                      <Text style={styles.gridYearArrowText}>▶</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 12 Months Pills */}
                  <View style={styles.monthsPillsGrid}>
                    {monthNames.map((mName, idx) => {
                      const isSelected = singleMonthVal === idx;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.monthPill, isSelected && styles.monthPillActive]}
                          onPress={() => setSingleMonthVal(idx)}
                        >
                          <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                            {monthShortNames[idx]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Selected Month Banner */}
                  <View style={styles.selectedMonthCard}>
                    <Text style={styles.selectedMonthTitle}>
                      📅 {monthNames[singleMonthVal]} {singleYearVal}
                    </Text>
                    <Text style={styles.selectedMonthSubtitle}>
                      Full Month ({formatDateDisplay(getMonthRangeISO(singleYearVal, singleMonthVal).from)} to {formatDateDisplay(getMonthRangeISO(singleYearVal, singleMonthVal).to)})
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>3. TOTAL माळा COUNT FOR THIS MONTH</Text>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.countInputBig}
                      placeholder="0"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={entryCount}
                      onChangeText={setEntryCount}
                    />
                  </View>
                </View>
              )}

              {/* TYPE 3: DATE RANGE */}
              {entryType === 'range' && (
                <View>
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

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>3. TOTAL माळा COUNT FOR THIS PERIOD</Text>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.countInputBig}
                      placeholder="0"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="numeric"
                      value={entryCount}
                      onChangeText={setEntryCount}
                    />
                  </View>
                </View>
              )}

              {/* TYPE 4: 12-MONTH GRID */}
              {entryType === 'monthly_grid' && (
                <View style={{ marginTop: 6 }}>
                  {/* Year selector */}
                  <View style={styles.gridYearNav}>
                    <TouchableOpacity onPress={() => setGridYear(gridYear - 1)} style={styles.gridYearArrow}>
                      <Text style={styles.gridYearArrowText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.gridYearTitle}>Year {gridYear}</Text>
                    <TouchableOpacity onPress={() => setGridYear(gridYear + 1)} style={styles.gridYearArrow}>
                      <Text style={styles.gridYearArrowText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.gridHelperText}>Enter counts for each month (leave empty if none):</Text>

                  {/* 12-Month Grid Tiles */}
                  <View style={styles.monthGridContainer}>
                    {marathiMonthNames.map((mName, idx) => (
                      <View key={idx} style={styles.monthGridTile}>
                        <Text style={styles.monthGridLabel} numberOfLines={1}>
                          {mName} <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>({monthNames[idx].substring(0, 3)})</Text>
                        </Text>
                        <TextInput
                          style={styles.monthGridInput}
                          placeholder="0"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="numeric"
                          value={monthlyGridCounts[idx] || ''}
                          onChangeText={(val) => setMonthlyGridCounts({ ...monthlyGridCounts, [idx]: val })}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Grid Total */}
                  <View style={styles.gridTotalCard}>
                    <Text style={styles.gridTotalLabel}>Total for {gridYear}:</Text>
                    <Text style={styles.gridTotalValue}>
                      {Object.values(monthlyGridCounts).reduce((acc, curr) => acc + (Number(curr) || 0), 0)} माळा
                    </Text>
                  </View>
                </View>
              )}

              {/* Note */}
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Added by Admin / WhatsApp"
                placeholderTextColor={theme.colors.textMuted}
                value={entryNote}
                onChangeText={setEntryNote}
              />

              <TouchableOpacity
                style={[styles.saveAdminBtn, submitting && { opacity: 0.6 }]}
                onPress={handleAdminSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveAdminBtnText}>
                    {entryType === 'monthly_grid'
                      ? '💾 Save All Monthly Entries'
                      : entryType === 'month'
                      ? `💾 Save ${monthNames[singleMonthVal]} ${singleYearVal}`
                      : '💾 Save Japmala for Member'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: WHATSAPP SMART MESSAGE PARSER ─── */}
      <Modal visible={showWhatsAppModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%', width: '96%', maxWidth: 540 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, marginRight: 8 }}>💬</Text>
                  <Text style={styles.modalTitle}>Paste WhatsApp Message</Text>
                </View>
                <TouchableOpacity onPress={() => setShowWhatsAppModal(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Paste messages with devotee names & Marathi/English monthly counts. The app parses and matches members automatically!
              </Text>

              {/* Year Selector */}
              <View style={styles.whatsAppYearRow}>
                <Text style={styles.inputLabel}>TARGET YEAR:</Text>
                <View style={styles.whatsAppYearNav}>
                  <TouchableOpacity onPress={() => { setWhatsAppYear(whatsAppYear - 1); parseWhatsAppMessage(whatsAppText, whatsAppYear - 1); }} style={styles.calNavBtnSmall}>
                    <Text style={styles.calNavTextSmall}>◀</Text>
                  </TouchableOpacity>
                  <Text style={styles.whatsAppYearText}>{whatsAppYear}</Text>
                  <TouchableOpacity onPress={() => { setWhatsAppYear(whatsAppYear + 1); parseWhatsAppMessage(whatsAppText, whatsAppYear + 1); }} style={styles.calNavBtnSmall}>
                    <Text style={styles.calNavTextSmall}>▶</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Text Input */}
              <TextInput
                style={styles.whatsAppTextInput}
                placeholder="Paste WhatsApp text here...&#10;Example:&#10;गणेश गावकर&#10;मे - ३१ माळा&#10;जून - ८७ माळा&#10;&#10;संगीता गांवकर&#10;मे - २१ माळा"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={6}
                value={whatsAppText}
                onChangeText={(t) => {
                  setWhatsAppText(t);
                  parseWhatsAppMessage(t, whatsAppYear);
                }}
              />

              {/* Parse Button */}
              <TouchableOpacity
                style={styles.parseBtn}
                onPress={() => parseWhatsAppMessage(whatsAppText, whatsAppYear)}
              >
                <Text style={styles.parseBtnText}>⚡ Parse & Preview Entries</Text>
              </TouchableOpacity>

              {/* Parsed Devotees List */}
              {parsedDevotees.length > 0 && (
                <View style={{ marginTop: theme.spacing.md }}>
                  <View style={styles.parsedHeaderRow}>
                    <Text style={styles.parsedSectionTitle}>
                      Parsed Devotees ({parsedDevotees.length})
                    </Text>
                    <Text style={styles.parsedSectionSub}>
                      Total Months: {parsedDevotees.reduce((acc, d) => acc + d.months.length, 0)}
                    </Text>
                  </View>

                  {parsedDevotees.map((dev, devIndex) => (
                    <View key={dev.id} style={styles.parsedDevCard}>
                      {/* Devotee Header */}
                      <View style={styles.parsedDevHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.parsedRawName} numberOfLines={1}>
                            📝 Text Name: <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{dev.rawName}</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const updated = parsedDevotees.filter(d => d.id !== dev.id);
                            setParsedDevotees(updated);
                          }}
                          style={styles.removeDevBtn}
                        >
                          <Text style={styles.removeDevText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Matched / Selected User Badge */}
                      <Text style={[styles.inputLabel, { fontSize: 10, marginTop: 4 }]}>MATCHED APP DEVOTEE:</Text>
                      {activePickerDevoteeId === dev.id ? (
                        <View style={styles.devoteeInlinePicker}>
                          <TextInput
                            style={styles.searchInputSmall}
                            placeholder="🔍 Type to search registered member..."
                            placeholderTextColor={theme.colors.textMuted}
                            value={devoteePickerSearch}
                            onChangeText={setDevoteePickerSearch}
                            autoFocus
                          />
                          <ScrollView style={styles.devoteePickerScroll} nestedScrollEnabled={true}>
                            {allUsers
                              .filter(u => {
                                const q = devoteePickerSearch.toLowerCase();
                                return (u.name && u.name.toLowerCase().includes(q)) || (u.phone && u.phone.includes(q));
                              })
                              .map(u => (
                                <TouchableOpacity
                                  key={u._id}
                                  style={styles.devoteePickerItem}
                                  onPress={() => {
                                    const updated = [...parsedDevotees];
                                    updated[devIndex].selectedUser = u;
                                    setParsedDevotees(updated);
                                    setActivePickerDevoteeId(null);
                                    setDevoteePickerSearch('');
                                  }}
                                >
                                  <Text style={styles.userPickerName}>{u.name}</Text>
                                  {u.phone ? <Text style={styles.userPickerPhone}>📞 {u.phone}</Text> : null}
                                </TouchableOpacity>
                              ))}
                          </ScrollView>
                          <TouchableOpacity
                            onPress={() => setActivePickerDevoteeId(null)}
                            style={styles.cancelPickerBtn}
                          >
                            <Text style={styles.cancelPickerText}>Done / Close</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.userMatchBadge,
                            dev.selectedUser ? styles.userMatchBadgeFound : styles.userMatchBadgeMissing,
                          ]}
                          onPress={() => {
                            setActivePickerDevoteeId(dev.id);
                            setDevoteePickerSearch('');
                          }}
                        >
                          <Text style={styles.userMatchBadgeText}>
                            {dev.selectedUser
                              ? `👤 ${dev.selectedUser.name} ${dev.selectedUser.phone ? `(${dev.selectedUser.phone})` : ''}`
                              : '⚠️ No match! Tap to select member'}
                          </Text>
                          <Text style={styles.userMatchChangeText}>
                            {dev.selectedUser ? 'Change ▾' : 'Select ▾'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Months Table */}
                      <View style={styles.parsedMonthsTable}>
                        <View style={styles.parsedMonthsHeader}>
                          <Text style={[styles.parsedMonthColHead, { flex: 1.5 }]}>Month</Text>
                          <Text style={[styles.parsedMonthColHead, { flex: 1.5 }]}>Count (माळा)</Text>
                          <Text style={[styles.parsedMonthColHead, { width: 30, textAlign: 'center' }]}>✕</Text>
                        </View>

                        {dev.months.map((m, mIdx) => (
                          <View key={mIdx} style={styles.parsedMonthRow}>
                            <Text style={[styles.parsedMonthName, { flex: 1.5 }]}>
                              {m.monthName}
                            </Text>
                            <TextInput
                              style={[styles.parsedMonthCountInput, { flex: 1.5 }]}
                              value={String(m.count)}
                              keyboardType="numeric"
                              onChangeText={(val) => {
                                const updated = [...parsedDevotees];
                                updated[devIndex].months[mIdx].count = Number(val) || 0;
                                setParsedDevotees(updated);
                              }}
                            />
                            <TouchableOpacity
                              onPress={() => {
                                const updated = [...parsedDevotees];
                                updated[devIndex].months = updated[devIndex].months.filter((_, idx) => idx !== mIdx);
                                setParsedDevotees(updated);
                              }}
                              style={styles.deleteMonthBtn}
                            >
                              <Text style={styles.deleteMonthText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}

                        {/* Add Month Row Button */}
                        <TouchableOpacity
                          style={styles.addMonthRowBtn}
                          onPress={() => {
                            const updated = [...parsedDevotees];
                            const unusedMonth = MARATHI_MONTHS_MAP.find(
                              m => !updated[devIndex].months.some(em => em.monthIndex === m.index)
                            ) || MARATHI_MONTHS_MAP[0];
                            const range = getMonthRangeISO(whatsAppYear, unusedMonth.index);
                            updated[devIndex].months.push({
                              monthIndex: unusedMonth.index,
                              monthName: `${unusedMonth.marathi} (${unusedMonth.english})`,
                              count: 0,
                              from: range.from,
                              to: range.to,
                            });
                            setParsedDevotees(updated);
                          }}
                        >
                          <Text style={styles.addMonthRowText}>＋ Add Month for {dev.selectedUser?.name || dev.rawName}</Text>
                        </TouchableOpacity>

                        {/* Subtotal */}
                        <View style={styles.parsedDevSubtotal}>
                          <Text style={styles.parsedDevSubtotalLabel}>Subtotal for Devotee:</Text>
                          <Text style={styles.parsedDevSubtotalVal}>
                            {dev.months.reduce((acc, m) => acc + (Number(m.count) || 0), 0)} माळा
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* Batch Save Button */}
                  <TouchableOpacity
                    style={[styles.saveBatchBtn, isSubmittingWhatsApp && { opacity: 0.6 }]}
                    onPress={handleSaveWhatsAppBatch}
                    disabled={isSubmittingWhatsApp}
                  >
                    {isSubmittingWhatsApp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveBatchBtnText}>
                        💾 Save All Entries ({parsedDevotees.length} Devotees, {parsedDevotees.reduce((acc, d) => acc + d.months.length, 0)} Months)
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: MEMBER DETAIL / ENTRIES ─── */}
      <Modal visible={showMemberModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedMember?.name}</Text>
                {selectedMember?.phone ? <Text style={styles.modalPhone}>📞 {selectedMember.phone}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => setShowMemberModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.memberModalStats}>
              <Text style={styles.memberModalTotal}>{selectedMember?.total}</Text>
              <Text style={styles.memberModalTotalLabel}>Total माळा Logged</Text>
            </View>

            <TouchableOpacity
              style={styles.quickAddMemberBtn}
              onPress={() => {
                setShowMemberModal(false);
                setSelectedUser(allUsers.find(u => u._id === selectedMember?._id) || selectedMember);
                setEntryCount('');
                setShowAddModal(true);
              }}
            >
              <Text style={styles.quickAddMemberText}>＋ Add / Update More for this Devotee</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { fontSize: theme.fontSize.sm, marginTop: 10, marginBottom: 8 }]}>
              Entry Breakdown ({memberEntries.length})
            </Text>

            {loadingMemberEntries ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {memberEntries.map(entry => {
                  const isRange = entry.entryType === 'range' || !!entry.toDate;
                  const isFullMonth = isRange && isPerfectMonth(entry.date, entry.toDate);
                  let displayDateText = formatDateDisplay(entry.date);
                  let tagText = null;

                  if (isFullMonth) {
                    const s = new Date(entry.date);
                    const mName = monthNames[s.getUTCMonth()];
                    displayDateText = `📅 ${mName} ${s.getUTCFullYear()}`;
                    tagText = 'Monthly Entry';
                  } else if (isRange) {
                    displayDateText = `📆 ${formatDateDisplay(entry.date)} to ${formatDateDisplay(entry.toDate)}`;
                    tagText = 'Date Range Entry';
                  } else {
                    displayDateText = `📅 ${formatDateDisplay(entry.date)}`;
                  }

                  return (
                    <View key={entry._id} style={styles.memberEntryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberEntryDate}>{displayDateText}</Text>
                        {tagText && (
                          <Text style={[styles.rangeTag, isFullMonth && { color: '#10b981' }]}>
                            {tagText}
                          </Text>
                        )}
                        {entry.note ? <Text style={styles.memberEntryNote}>{entry.note}</Text> : null}
                      </View>
                      <Text style={styles.memberEntryCount}>{entry.count}</Text>
                      <TouchableOpacity onPress={() => handleOpenEdit(entry)} style={styles.entryActionBtn}>
                        <Text style={{ fontSize: 14 }}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteEntry(entry._id)} style={styles.entryActionBtn}>
                        <Text style={{ fontSize: 14 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {memberEntries.length === 0 && (
                  <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginVertical: 14 }}>
                    No entries recorded in this timeframe.
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity onPress={() => setShowMemberModal(false)} style={styles.modalCloseDoneBtn}>
              <Text style={styles.modalCloseDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: EDIT SINGLE ENTRY ─── */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Edit Japmala Entry</Text>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>ENTRY TYPE</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, editEntryType === 'daily' && styles.toggleBtnActive]}
                onPress={() => setEditEntryType('daily')}
              >
                <Text style={[styles.toggleText, editEntryType === 'daily' && styles.toggleTextActive]}>Single Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, editEntryType === 'month' && styles.toggleBtnActive]}
                onPress={() => setEditEntryType('month')}
              >
                <Text style={[styles.toggleText, editEntryType === 'month' && styles.toggleTextActive]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, editEntryType === 'range' && styles.toggleBtnActive]}
                onPress={() => setEditEntryType('range')}
              >
                <Text style={[styles.toggleText, editEntryType === 'range' && styles.toggleTextActive]}>Date Range</Text>
              </TouchableOpacity>
            </View>

            {editEntryType === 'daily' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DATE</Text>
                <TouchableOpacity style={styles.dateTriggerBtn} onPress={() => openCalendar('editDateVal')}>
                  <Text style={styles.dateTriggerText}>{formatDateDisplay(editDateVal)}</Text>
                  <Text>📅</Text>
                </TouchableOpacity>
              </View>
            )}

            {editEntryType === 'month' && (
              <View style={{ marginBottom: theme.spacing.sm }}>
                <View style={styles.gridYearNav}>
                  <TouchableOpacity onPress={() => setEditYearVal(editYearVal - 1)} style={styles.gridYearArrow}>
                    <Text style={styles.gridYearArrowText}>◀</Text>
                  </TouchableOpacity>
                  <Text style={styles.gridYearTitle}>Year {editYearVal}</Text>
                  <TouchableOpacity onPress={() => setEditYearVal(editYearVal + 1)} style={styles.gridYearArrow}>
                    <Text style={styles.gridYearArrowText}>▶</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.monthsPillsGrid}>
                  {monthNames.map((mName, idx) => {
                    const isSelected = editMonthVal === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.monthPill, isSelected && styles.monthPillActive]}
                        onPress={() => setEditMonthVal(idx)}
                      >
                        <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                          {monthShortNames[idx]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.selectedMonthSubtitle, { textAlign: 'center', marginTop: 4 }]}>
                  {monthNames[editMonthVal]} {editYearVal} (Full Month)
                </Text>
              </View>
            )}

            {editEntryType === 'range' && (
              <View style={styles.dateRangeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>FROM</Text>
                  <TouchableOpacity style={styles.dateTriggerBtn} onPress={() => openCalendar('editDateVal')}>
                    <Text style={styles.dateTriggerText}>{formatDateDisplay(editDateVal)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>TO</Text>
                  <TouchableOpacity style={styles.dateTriggerBtn} onPress={() => openCalendar('editToDateVal')}>
                    <Text style={styles.dateTriggerText}>{formatDateDisplay(editToDateVal)}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>COUNT (माळा)</Text>
            <TextInput
              style={styles.countInputBig}
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={editCountVal}
              onChangeText={setEditCountVal}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Note"
              placeholderTextColor={theme.colors.textMuted}
              value={editNoteVal}
              onChangeText={setEditNoteVal}
            />

            <TouchableOpacity style={styles.saveAdminBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveAdminBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 8 }]}
              onPress={() => {
                setShowEditModal(false);
                if (selectedMember) setShowMemberModal(true);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: CALENDAR PICKER ─── */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.calModalOverlay}>
          <View style={styles.calModalContent}>
            <View style={styles.calHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                  else { setCalMonth(calMonth - 1); }
                }}
                style={styles.calNavBtn}
              >
                <Text style={styles.calNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calTitle}>{monthNames[calMonth]} {calYear}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                  else { setCalMonth(calMonth + 1); }
                }}
                style={styles.calNavBtn}
              >
                <Text style={styles.calNavText}>›</Text>
              </TouchableOpacity>
            </View>

            {calendarTarget === 'filterRange' && (
              <Text style={styles.calHintText}>
                {!rangeStart ? 'Tap START date' : !rangeEnd ? 'Now tap END date' : 'Range selected! Tap any date to re-pick.'}
              </Text>
            )}

            <View style={styles.weekDaysRow}>
              {dayShortNames.map((d, i) => (
                <Text key={i} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.calGrid}>
              {calendarCells.map((dayStr, index) => {
                if (!dayStr) {
                  return <View key={`empty-${index}`} style={styles.emptyCalCell} />;
                }
                const isSelected =
                  (calendarTarget === 'entryDate' && entryDate === dayStr) ||
                  (calendarTarget === 'entryFrom' && entryFrom === dayStr) ||
                  (calendarTarget === 'entryTo' && entryTo === dayStr) ||
                  (calendarTarget === 'filterFrom' && fromDate === dayStr) ||
                  (calendarTarget === 'filterTo' && toDate === dayStr) ||
                  (calendarTarget === 'editDateVal' && editDateVal === dayStr) ||
                  (calendarTarget === 'editToDateVal' && editToDateVal === dayStr) ||
                  (calendarTarget === 'filterRange' && (rangeStart === dayStr || rangeEnd === dayStr));

                const isInRange =
                  calendarTarget === 'filterRange' &&
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
                <Text style={styles.calActionTodayText}>Select Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calCloseBtn}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.calCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  devotionalHeaderContainer: {
    marginBottom: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  devotionalHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  reportMainTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg || '#0b0f19',
  },
  list: {
    padding: theme.spacing.md,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
    paddingBottom: 160,
    backgroundColor: theme.colors.bg || '#0b0f19',
    minHeight: '100%',
  },

  // Quick Action Buttons Row
  quickActionRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  addMemberEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  addMemberEntryEmoji: { fontSize: 20, marginRight: 8 },
  addMemberEntryTitle: { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: 'bold' },
  addMemberEntrySubtitle: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
  addMemberPlus: { fontSize: 18, color: theme.colors.primary, fontWeight: 'bold' },

  pasteWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  pasteWhatsAppEmoji: { fontSize: 20, marginRight: 8 },
  pasteWhatsAppTitle: { color: '#34d399', fontSize: theme.fontSize.sm, fontWeight: 'bold' },
  pasteWhatsAppSubtitle: { color: '#a7f3d0', fontSize: 10, marginTop: 2 },
  pasteWhatsAppPlus: { fontSize: 16, color: '#34d399', fontWeight: 'bold' },

  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: theme.spacing.sm,
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

  allTimeBanner: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  allTimeBannerTitle: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  allTimeBannerSub: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },

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
  monthNavText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  monthTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },

  dateRangeRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  inputGroup: {
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
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
  dateTriggerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  openRangeCalBtn: {
    backgroundColor: theme.colors.bgElevated,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  openRangeCalText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },

  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statCardHighlight: {
    borderColor: theme.colors.accent + '40',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },

  // Report Actions Row (PDF + WhatsApp Share)
  reportActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  exportBtn: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  exportBtnText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shareWhatsAppBtn: {
    backgroundColor: '#064e3b',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  shareWhatsAppBtnText: {
    color: '#34d399',
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Report Search Box
  reportSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  reportSearchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reportSearchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
    marginLeft: 6,
  },
  clearSearchText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
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
    padding: theme.spacing.sm + 4,
    marginBottom: theme.spacing.xs,
  },
  memberRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  memberRankText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  memberPhone: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  memberTotal: {
    alignItems: 'flex-end',
  },
  memberTotalCount: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  memberTotalLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },

  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // Modal Common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginBottom: theme.spacing.md,
  },
  closeBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgElevated,
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 12-Month Grid Styles
  gridYearNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 6,
    marginBottom: 8,
  },
  gridYearArrow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  gridYearArrowText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridYearTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  gridHelperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
  monthGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthGridTile: {
    width: '48%',
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthGridLabel: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthGridInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridTotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  gridTotalLabel: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: theme.fontSize.sm,
  },
  gridTotalValue: {
    color: theme.colors.accent,
    fontWeight: 'heavy',
    fontSize: theme.fontSize.md,
  },

  // Month Pills Grid
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

  // WhatsApp Smart Parser Modal Styles
  whatsAppYearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  whatsAppYearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  whatsAppYearText: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
    marginHorizontal: 8,
  },
  calNavBtnSmall: {
    padding: 4,
  },
  calNavTextSmall: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  whatsAppTextInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    minHeight: 110,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  parseBtn: {
    backgroundColor: '#059669',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  parseBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  parsedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parsedSectionTitle: {
    color: theme.colors.accent,
    fontWeight: 'bold',
    fontSize: theme.fontSize.sm,
  },
  parsedSectionSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  parsedDevCard: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.lg,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  parsedDevHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 6,
  },
  parsedRawName: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  removeDevBtn: {
    padding: 4,
  },
  removeDevText: {
    fontSize: 14,
  },
  userMatchBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: theme.borderRadius.md,
    marginVertical: 4,
  },
  userMatchBadgeFound: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  userMatchBadgeMissing: {
    backgroundColor: '#78350f',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  userMatchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  userMatchChangeText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  devoteeInlinePicker: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  searchInputSmall: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.sm,
    padding: 6,
    color: theme.colors.textPrimary,
    fontSize: 12,
    marginBottom: 4,
  },
  devoteePickerScroll: {
    maxHeight: 120,
  },
  devoteePickerItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelPickerBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.sm,
  },
  cancelPickerText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },

  parsedMonthsTable: {
    marginTop: 6,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 6,
  },
  parsedMonthsHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  parsedMonthColHead: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  parsedMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  parsedMonthName: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  parsedMonthCountInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    textAlign: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  deleteMonthBtn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteMonthText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  addMonthRowBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 4,
  },
  addMonthRowText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  parsedDevSubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  parsedDevSubtotalLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  parsedDevSubtotalVal: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveBatchBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  saveBatchBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },

  // Member Modal Stats
  memberModalStats: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  memberModalTotal: {
    fontSize: 32,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.accent,
  },
  memberModalTotalLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  modalPhone: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
  },

  searchInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
  },
  userPickerBox: {
    maxHeight: 140,
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  userPickerItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userPickerName: { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: '600' },
  userPickerPhone: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 },
  noUsersText: { color: theme.colors.textMuted, padding: 12, textAlign: 'center', fontSize: theme.fontSize.xs },

  selectedUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
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
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  input: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
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

  // Calendar Modal Styles
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
  langHeaderContainer: {
    backgroundColor: '#151b2a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242f48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langHeaderTitle: {
    color: '#a0aec0',
    fontSize: 13,
    fontWeight: '700',
  },
  langToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#0b0f19',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#242f48',
  },
  langChoiceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  langChoiceBtnActive: {
    backgroundColor: '#ff6b00',
  },
  langChoiceText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  langChoiceTextActive: {
    color: '#ffffff',
  },
  memberSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  memberAgeBadge: {
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#ffaa00',
  },
  memberAgeText: {
    color: '#ffaa00',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default JapmalaReportScreen;
