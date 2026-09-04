import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import api from '../api/client';
import { showAlert, showConfirm } from '../utils/dialog';
import {
  toMarathiDigits,
  toEnglishDigits,
  formatNumberByLang,
  transliterateToMarathi,
} from '../utils/marathiUtils';

const strings = {
  en: {
    userProfile: 'User Profile',
    adminBadge: '👑 Administrator',
    userBadge: '👤 Standard User',
    japmalaTitle: '📿 JAPMALA RECORD (जपानुष्ठान)',
    japmalaLive: '● Live',
    japmalaSub: 'Includes your entries & entries verified by Secretary / Admin',
    totalMala: 'Total Malas (एकूण माळा)',
    totalDays: 'Total Days (एकूण दिवस)',
    openJapmala: '📿 Open Japmala Tracker / नोंदी पहा →',
    editProfileTitle: 'EDIT PROFILE DETAILS',
    fullNameLabel: 'FULL NAME / USERNAME',
    fullNamePlaceholder: 'Enter full name (e.g. Omkar More)',
    toMarathiBtn: '⚡ Convert to मराठी',
    mobileLabel: 'MOBILE NUMBER (FOR EVENT ORGANIZERS)',
    mobilePlaceholder: 'Enter mobile number (e.g. 9876543210)',
    ageLabel: 'AGE / वय (YEARS)',
    agePlaceholder: 'Enter your age (e.g. 45)',
    emailLabel: 'EMAIL ADDRESS (PRIMARY ID)',
    saveBtn: '💾 Save Profile Changes',
    saving: 'Saving...',
    accountActions: 'ACCOUNT ACTIONS',
    logoutBtn: '🚪 Logout Session',
    deleteBtn: '🗑️ Delete Account Permanently',
    confirmDeleteTitle: '⚠️ Delete Account',
    confirmDeleteMsg: 'Are you sure you want to permanently delete your account? All your attendance history will be erased from the database.',
    successTitle: '✅ Profile Updated',
    successMsg: 'Your profile details have been saved.',
    switchLang: 'मराठी',
  },
  mr: {
    userProfile: 'भाविक प्रोफाईल',
    adminBadge: '👑 प्रशासक (Admin)',
    userBadge: '👤 भाविक (User)',
    japmalaTitle: '📿 जपमाळा नोंदणी (जपानुष्ठान)',
    japmalaLive: '● थेट नोंद',
    japmalaSub: 'तुमच्या नोंदी व सेक्रेटरी/प्रशासकांनी पडताळलेल्या नोंदी',
    totalMala: 'एकूण माळा संख्या',
    totalDays: 'एकूण दिवस',
    openJapmala: '📿 जपमाळा ट्रॅकर उघडा / नोंदी पहा →',
    editProfileTitle: 'प्रोफाईल माहिती बदला',
    fullNameLabel: 'पूर्ण नाव (FULL NAME)',
    fullNamePlaceholder: 'पूर्ण नाव प्रविष्ट करा (उदा. आबासाहेब मोरे)',
    toMarathiBtn: '⚡ A → अ मराठीत करा',
    mobileLabel: 'मोबाईल नंबर (MOBILE NUMBER)',
    mobilePlaceholder: 'मोबाईल नंबर प्रविष्ट करा (उदा. ९८७६५४३२१०)',
    ageLabel: 'वय / AGE (वर्षे)',
    agePlaceholder: 'तुमचे वय प्रविष्ट करा (उदा. ५२)',
    emailLabel: 'ईमेल पत्ता (EMAIL ID)',
    saveBtn: '💾 प्रोफाईल माहिती जतन करा',
    saving: 'जतन करत आहे...',
    accountActions: 'खाते सेटिंग्ज',
    logoutBtn: '🚪 लॉगआउट करा (Logout)',
    deleteBtn: '🗑️ खाते कायमचे हटवा (Delete)',
    confirmDeleteTitle: '⚠️ खाते हटवा',
    confirmDeleteMsg: 'तुम्हाला तुमचे खाते कायमचे हटवायचे आहे का? तुमची सर्व उपस्थिती व माहिती कायमची नष्ट होईल.',
    successTitle: '✅ प्रोफाईल अपडेट झाली',
    successMsg: 'तुमची माहिती यशस्वीरित्या जतन करण्यात आली आहे.',
    switchLang: 'English',
  },
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUserProfile } = useAuth();
  const [lang, setLang] = useState('mr'); // Default to Marathi
  const t = strings[lang];

  const [name, setName] = useState(user?.name || user?.username || '');
  const [phone, setPhone] = useState(user?.phone ? (lang === 'mr' ? toMarathiDigits(user.phone) : user.phone) : '');
  const [age, setAge] = useState(
    user?.age !== undefined && user?.age !== null
      ? (lang === 'mr' ? toMarathiDigits(String(user.age)) : String(user.age))
      : ''
  );
  const [saving, setSaving] = useState(false);

  // Japmala summary state
  const [japmalaTotal, setJapmalaTotal] = useState(0);
  const [japmalaDays, setJapmalaDays] = useState(0);
  const [loadingJapmala, setLoadingJapmala] = useState(true);

  const fetchJapmalaStats = async () => {
    try {
      const res = await api.get('/japmala/my');
      setJapmalaTotal(res.data.total ?? 0);
      setJapmalaDays(res.data.days ?? res.data.count ?? 0);
    } catch (err) {
      console.error('Error fetching japmala stats:', err);
    } finally {
      setLoadingJapmala(false);
    }
  };

  const fetchFreshProfile = async () => {
    try {
      // 1. Check local storage fallback first
      const cachedAge = await AsyncStorage.getItem('user_saved_age');
      if (cachedAge && (!age || age === '')) {
        setAge(lang === 'mr' ? toMarathiDigits(cachedAge) : cachedAge);
      }

      // 2. Fetch fresh from backend
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        const u = res.data.user;
        if (updateUserProfile) {
          await updateUserProfile(u);
        }
        if (u.name || u.username) setName(u.name || u.username);
        if (u.phone !== undefined) {
          setPhone(u.phone ? (lang === 'mr' ? toMarathiDigits(u.phone) : u.phone) : '');
        }
        if (u.age !== undefined && u.age !== null) {
          const strAge = String(u.age);
          setAge(lang === 'mr' ? toMarathiDigits(strAge) : strAge);
          await AsyncStorage.setItem('user_saved_age', strAge);
        } else if (cachedAge) {
          // If server returned null but we had saved age, preserve it
          setAge(lang === 'mr' ? toMarathiDigits(cachedAge) : cachedAge);
        }
      }
    } catch (err) {
      console.error('Error fetching fresh profile:', err);
    }
  };

  // Sync state whenever user object in AuthContext changes
  useEffect(() => {
    if (user) {
      setName(user.name || user.username || '');
      if (user.phone !== undefined) {
        setPhone(user.phone ? (lang === 'mr' ? toMarathiDigits(user.phone) : user.phone) : '');
      }
      if (user.age !== undefined && user.age !== null) {
        const strAge = String(user.age);
        setAge(lang === 'mr' ? toMarathiDigits(strAge) : strAge);
        AsyncStorage.setItem('user_saved_age', strAge).catch(() => {});
      }
    }
  }, [user]);

  // Handle Language toggle
  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'mr' : 'en';
    setLang(nextLang);
    // Convert current input values to new language digit format
    if (phone) {
      setPhone(nextLang === 'mr' ? toMarathiDigits(phone) : toEnglishDigits(phone));
    }
    if (age) {
      setAge(nextLang === 'mr' ? toMarathiDigits(age) : toEnglishDigits(age));
    }
  };

  // Initial fetch on mount and on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchFreshProfile();
      fetchJapmalaStats();
    }, [lang])
  );

  useEffect(() => {
    fetchFreshProfile();
    fetchJapmalaStats();
  }, []);

  const handleTransliterateName = () => {
    if (!name.trim()) return;
    const converted = transliterateToMarathi(name);
    setName(converted);
  };

  const handlePhoneChange = (val) => {
    if (lang === 'mr') {
      setPhone(toMarathiDigits(val));
    } else {
      setPhone(val);
    }
  };

  const handleAgeChange = (val) => {
    if (lang === 'mr') {
      setAge(toMarathiDigits(val));
    } else {
      setAge(val);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showAlert('Missing Field', lang === 'mr' ? 'नाव रिक्त असू शकत नाही.' : 'Name cannot be empty.');
      return;
    }

    const cleanPhone = toEnglishDigits(phone.trim());
    const cleanAge = toEnglishDigits(age.trim());
    const parsedAgeNum = cleanAge ? Number(cleanAge) : null;

    try {
      setSaving(true);
      
      // Save locally first for instant persistence
      if (cleanAge) {
        await AsyncStorage.setItem('user_saved_age', cleanAge);
      } else {
        await AsyncStorage.removeItem('user_saved_age');
      }

      const response = await api.put('/auth/profile', {
        name: name.trim(),
        username: name.trim(),
        phone: cleanPhone,
        age: parsedAgeNum,
      });

      const updatedUser = response.data?.user || {
        ...user,
        name: name.trim(),
        username: name.trim(),
        phone: cleanPhone,
        age: parsedAgeNum,
      };

      if (updateUserProfile) {
        await updateUserProfile(updatedUser);
      }

      if (cleanAge) {
        setAge(lang === 'mr' ? toMarathiDigits(cleanAge) : cleanAge);
      } else {
        setAge('');
      }

      showAlert(t.successTitle, t.successMsg);
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      t.confirmDeleteTitle,
      t.confirmDeleteMsg,
      async () => {
        try {
          await api.delete('/auth/account');
          await AsyncStorage.removeItem('user_saved_age');
          showAlert('Account Deleted', 'Your account has been permanently removed.');
          logout();
        } catch (error) {
          showAlert('Error', error.response?.data?.message || 'Failed to delete account');
        }
      }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
      {/* Top Header Row with Language Toggle */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.langToggleBtn}
          onPress={toggleLanguage}
        >
          <Text style={styles.langToggleText}>🌐 {t.switchLang}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.title}>{user?.name || user?.username || t.userProfile}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'Admin' ? t.adminBadge : t.userBadge}</Text>
        </View>
      </View>

      {/* 📿 Japmala Card on Profile */}
      <View style={[styles.card, styles.japmalaCard]}>
        <View style={styles.japmalaHeaderRow}>
          <Text style={styles.japmalaCardTitle}>{t.japmalaTitle}</Text>
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>{t.japmalaLive}</Text>
          </View>
        </View>
        <Text style={styles.japmalaSubTitle}>{t.japmalaSub}</Text>

        <View style={styles.japmalaStatsRow}>
          <View style={styles.japmalaStatBox}>
            <Text style={styles.japmalaNumber}>
              {loadingJapmala ? '⏳' : formatNumberByLang(japmalaTotal, lang)}
            </Text>
            <Text style={styles.japmalaLabel}>{t.totalMala}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.japmalaStatBox}>
            <Text style={styles.japmalaNumber}>
              {loadingJapmala ? '⏳' : formatNumberByLang(japmalaDays, lang)}
            </Text>
            <Text style={styles.japmalaLabel}>{t.totalDays}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openJapmalaBtn}
          onPress={() => {
            try {
              navigation.navigate('JapmalaTab');
            } catch (e) {
              navigation.navigate('Japmala');
            }
          }}
        >
          <Text style={styles.openJapmalaBtnText}>{t.openJapmala}</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.editProfileTitle}</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputHeaderRow}>
            <Text style={styles.inputLabel}>{t.fullNameLabel}</Text>
            <TouchableOpacity onPress={handleTransliterateName} style={styles.transliterateBtn}>
              <Text style={styles.transliterateBtnText}>{t.toMarathiBtn}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.fullNamePlaceholder}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.mobileLabel}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder={t.mobilePlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.ageLabel}</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={handleAgeChange}
            placeholder={t.agePlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.inputGroupDisabled}>
          <Text style={styles.inputLabel}>{t.emailLabel}</Text>
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
            <Text style={styles.saveBtnText}>{t.saveBtn}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Account Settings & Actions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.accountActions}</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>{t.logoutBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnText}>{t.deleteBtn}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg || '#0b0f19',
    padding: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    marginTop: 4,
  },
  langToggleBtn: {
    backgroundColor: theme.colors.bgCard || '#151b2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border || '#232c3f',
    elevation: 2,
  },
  langToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary || '#ff6b00',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.bgCard || '#151b2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary || '#ff6b00',
    elevation: 3,
  },
  avatarText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary || '#FFFFFF',
  },
  email: {
    fontSize: 13,
    color: theme.colors.textMuted || '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: (theme.colors.primary || '#ff6b00') + '22',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary || '#ff6b00',
  },
  card: {
    backgroundColor: theme.colors.bgCard || '#151b2a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border || '#232c3f',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted || '#64748b',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted || '#64748b',
    letterSpacing: 0.5,
  },
  transliterateBtn: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  transliterateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e65100',
  },
  input: {
    backgroundColor: theme.colors.bgInput || '#111624',
    borderWidth: 1,
    borderColor: theme.colors.border || '#232c3f',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.textPrimary || '#FFFFFF',
  },
  inputGroupDisabled: {
    marginBottom: theme.spacing.lg,
  },
  disabledValue: {
    fontSize: 14,
    color: theme.colors.textMuted || '#64748b',
    paddingVertical: 6,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary || '#ff6b00',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: theme.colors.bgInput || '#111624',
    borderWidth: 1,
    borderColor: theme.colors.border || '#232c3f',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logoutBtnText: {
    color: theme.colors.textPrimary || '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: (theme.colors.error || '#ef4444') + '40',
    backgroundColor: (theme.colors.error || '#ef4444') + '10',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: theme.colors.error || '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  japmalaCard: {
    borderColor: '#ff9800',
    borderWidth: 1.5,
    backgroundColor: '#fffdf9',
  },
  japmalaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  japmalaCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e65100',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
  },
  japmalaSubTitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  japmalaStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    alignItems: 'center',
    marginBottom: 12,
  },
  japmalaStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#ffe0b2',
  },
  japmalaNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e65100',
    marginBottom: 2,
  },
  japmalaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  openJapmalaBtn: {
    backgroundColor: '#e65100',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  openJapmalaBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProfileScreen;
