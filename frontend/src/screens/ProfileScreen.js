import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
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
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age !== undefined && user?.age !== null ? String(user.age) : '');
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

  useFocusEffect(
    useCallback(() => {
      fetchJapmalaStats();
      if (user) {
        setName(user.name || user.username || '');
        setPhone(user.phone || '');
        setAge(user.age !== undefined && user.age !== null ? String(user.age) : '');
      }
    }, [user])
  );

  const handleTransliterateName = () => {
    if (!name.trim()) return;
    const converted = transliterateToMarathi(name);
    setName(converted);
  };

  const handlePhoneChange = (val) => {
    if (lang === 'mr') {
      // Allow Marathi typing or convert English to Marathi digits
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

    try {
      setSaving(true);
      const response = await api.put('/auth/profile', {
        name: name.trim(),
        username: name.trim(),
        phone: cleanPhone,
        age: cleanAge ? Number(cleanAge) : null,
      });

      if (response.data.user && updateUserProfile) {
        updateUserProfile(response.data.user);
      }

      showAlert(t.successTitle, t.successMsg);
    } catch (error) {
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
          onPress={() => setLang(lang === 'en' ? 'mr' : 'en')}
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
          <Text style={styles.japmalaLiveBadge}>{t.japmalaLive}</Text>
        </View>
        <Text style={styles.japmalaSubtitle}>{t.japmalaSub}</Text>

        <View style={styles.japmalaStatsRow}>
          <View style={styles.japmalaStatBox}>
            <Text style={styles.japmalaNumber}>
              {loadingJapmala ? '⏳' : formatNumberByLang(japmalaTotal, lang)}
            </Text>
            <Text style={styles.japmalaLabel}>{t.totalMala}</Text>
          </View>

          <View style={styles.japmalaDivider} />

          <View style={styles.japmalaStatBox}>
            <Text style={styles.japmalaNumber}>
              {loadingJapmala ? '⏳' : formatNumberByLang(japmalaDays, lang)}
            </Text>
            <Text style={styles.japmalaLabel}>{t.totalDays}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openJapmalaBtn}
          onPress={() => navigation.navigate('Japmala')}
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
            value={lang === 'mr' ? toMarathiDigits(phone) : phone}
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
            value={lang === 'mr' ? toMarathiDigits(age) : age}
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

      {/* Account Settings / Actions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.accountActions}</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>{t.logoutBtn}</Text>
        </TouchableOpacity>

        {user?.role !== 'Admin' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>{t.deleteBtn}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subtle Legal Footer */}
      <View style={styles.subtleLegalFooter}>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.subtleLegalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.subtleDot}>•</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
          <Text style={styles.subtleLegalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  langToggleBtn: {
    backgroundColor: theme.colors.primary + '25',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '60',
  },
  langToggleText: {
    color: theme.colors.primaryLight,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '25',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: 40,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  email: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.bgCard,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleText: {
    color: theme.colors.primaryLight,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Japmala Card Styles
  japmalaCard: {
    borderColor: theme.colors.primary + '60',
    backgroundColor: theme.colors.bgCard,
  },
  japmalaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  japmalaCardTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 1.2,
  },
  japmalaLiveBadge: {
    color: theme.colors.success,
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
  japmalaSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  japmalaStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
  },
  japmalaStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  japmalaNumber: {
    fontSize: 28,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.accent,
  },
  japmalaLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  japmalaDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
  },
  openJapmalaBtn: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  openJapmalaBtnText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
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
  transliterateBtn: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '60',
  },
  transliterateBtnText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputGroupDisabled: {
    marginBottom: theme.spacing.lg,
    opacity: 0.7,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
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
  disabledValue: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  logoutBtn: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logoutText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  deleteBtn: {
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  deleteText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  subtleLegalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: theme.spacing.xl,
    paddingBottom: 40,
  },
  subtleLegalLink: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
  },
  subtleDot: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
});

export default ProfileScreen;
