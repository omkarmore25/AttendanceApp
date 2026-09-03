import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import theme from '../theme';

/**
 * Privacy Policy Screen with English / Marathi Toggle
 */
const PrivacyPolicyScreen = () => {
  const [lang, setLang] = useState('en'); // 'en' | 'mr'

  const handleEmailSupport = () => {
    Linking.openURL('mailto:omkarmore5178@gmail.com?subject=Sant%20Samagam%20App%20Privacy%20Inquiry');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Language Toggle */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {lang === 'en' ? '🛡️ Privacy Policy' : '🛡️ गोपनीयता धोरण'}
              </Text>
              <Text style={styles.subtitle}>
                {lang === 'en'
                  ? 'Your privacy is sacred to us. We keep your data simple, transparent, and secure.'
                  : 'तुमची गोपनीयता आमच्यासाठी अत्यंत महत्त्वाची आहे. आम्ही तुमची माहिती सुरक्षित व पारदर्शक ठेवतो.'}
              </Text>
            </View>
          </View>

          {/* Language Toggle Buttons */}
          <View style={styles.langToggleContainer}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => setLang('en')}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>
                🇬🇧 English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, lang === 'mr' && styles.langBtnActive]}
              onPress={() => setLang('mr')}
            >
              <Text style={[styles.langBtnText, lang === 'mr' && styles.langBtnTextActive]}>
                🇮🇳 मराठी
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {lang === 'en' ? (
          /* ─── ENGLISH CONTENT ─── */
          <>
            {/* 1. What Data We Collect */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌸 What Information We Collect</Text>
              
              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>👤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemHeading}>Name & Mobile Number</Text>
                  <Text style={styles.itemDesc}>
                    To identify you in the community roster and enable organizers to coordinate Satsang events.
                  </Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemHeading}>Location (Event Attendance Only)</Text>
                  <Text style={styles.itemDesc}>
                    Checked on-demand only when you tap "Mark Attendance" to verify you are at the Satsang venue. We <Text style={styles.bold}>never</Text> track your location in the background.
                  </Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>📿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemHeading}>Japmala Chanting Records</Text>
                  <Text style={styles.itemDesc}>
                    To track your personal chanting progress and display community aggregate totals.
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. What We Never Do */}
            <View style={[styles.card, styles.cardHighlight]}>
              <Text style={styles.cardTitleHighlight}>🔒 Our Commitment to You</Text>
              
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Zero Ads:</Text> We do not show any advertisements.
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>No Data Selling:</Text> We <Text style={styles.bold}>never</Text> sell, rent, or share your contact details with any third parties or marketers.
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Encrypted Security:</Text> All your passwords and data are safely encrypted with industry-standard security.
              </Text>
            </View>

            {/* 3. Your Full Control */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✨ You Are in Control</Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Edit Anytime:</Text> You can update your name or phone number whenever you want from the Profile tab.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Delete Account:</Text> You can permanently delete your account and all records with a single tap in your Profile settings.
              </Text>
            </View>

            {/* 4. Contact Us */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📞 Questions or Support?</Text>
              <Text style={styles.paragraph}>
                If you ever have questions or need assistance with your account, feel free to reach out to our team:
              </Text>

              <View style={styles.contactBox}>
                <Text style={styles.contactText}>📧 Email: <Text style={styles.bold}>omkarmore5178@gmail.com</Text></Text>
                <Text style={styles.contactText}>📍 Organization: <Text style={styles.bold}>Sant Samagam Community</Text></Text>
              </View>

              <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
                <Text style={styles.contactBtnText}>✉️ Contact Support Team</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ─── MARATHI CONTENT ─── */
          <>
            {/* 1. माहिती संकलन */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌸 आम्ही कोणती माहिती गोळा करतो</Text>
              
              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>👤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemHeading}>नाव आणि मोबाईल नंबर</Text>
                  <Text style={styles.itemDesc}>
                    सत्संग कार्यक्रमांचे नियोजन आणि भक्तांची ओळख पटवण्यासाठी तुमचे नाव व फोन नंबर वापरला जातो.
                  </Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemHeading}>स्थान (फक्त कार्यक्रमातील हजेरीसाठी)</Text>
                  <Text style={styles.itemDesc}>
                    जेव्हा तुम्ही "Mark Attendance" दाबता, तेव्हा तुम्ही प्रत्यक्ष सत्संग ठिकाणी उपस्थित आहात याची खात्री करण्यासाठी GPS स्थान तपासले जाते. बॅकग्राउंडमध्ये कधीही ट्रॅक केले जात नाही.
                  </Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.itemIcon}>📿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemHeading}>जपमाळा नोंदी</Text>
                  <Text style={styles.itemDesc}>
                    तुमच्या वैयक्तिक जपाची नोंद ठेवण्यासाठी आणि समूहातील एकूण जप प्रगती पाहण्यासाठी.
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. आमचे वचन */}
            <View style={[styles.card, styles.cardHighlight]}>
              <Text style={styles.cardTitleHighlight}>🔒 भक्तांच्या सुरक्षेसाठी आमचे वचन</Text>
              
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>कोणत्याही जाहिराती नाहीत:</Text> या ॲपमध्ये कोणत्याही प्रकारच्या जाहिराती दाखवल्या जात नाहीत.
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>माहितीची विक्री नाही:</Text> आम्ही तुमची वैयक्तिक माहिती किंवा फोन नंबर कोणालाही विकत नाही किंवा शेअर करत नाही.
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>सुरक्षित साठवणूक:</Text> तुमचे पासवर्ड आणि डेटा आधुनिक एन्क्रिप्शनद्वारे सुरक्षित ठेवले जातात.
              </Text>
            </View>

            {/* 3. तुमचे पूर्ण नियंत्रण */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✨ तुमचे पूर्ण नियंत्रण</Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>कधीही बदल करा:</Text> तुम्ही प्रोफाइलमधून तुमचे नाव आणि मोबाईल नंबर कधीही बदलू शकता.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>खाते कायमचे हटवा:</Text> तुम्ही प्रोफाइल सेटिंग्जमधून तुमचे खाते आणि सर्व नोंदी कधीही एका क्लिकवर हटवू शकता.
              </Text>
            </View>

            {/* 4. संपर्क */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📞 मदत किंवा संपर्क</Text>
              <Text style={styles.paragraph}>
                आपल्याला ॲपबद्दल काही अडचण किंवा प्रश्न असल्यास, आपण थेट आमच्याशी संपर्क साधू शकता:
              </Text>

              <View style={styles.contactBox}>
                <Text style={styles.contactText}>📧 ईमेल: <Text style={styles.bold}>omkarmore5178@gmail.com</Text></Text>
                <Text style={styles.contactText}>📍 समुदाय: <Text style={styles.bold}>संत समागम परिवार</Text></Text>
              </View>

              <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
                <Text style={styles.contactBtnText}>✉️ मदत मिळवण्यासाठी ईमेल करा</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sant Samagam · जय सच्चिदानंद 🙏</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  header: {
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  headerTop: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  langToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'flex-start',
    gap: 6,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
  },
  langBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  langBtnText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    backgroundColor: theme.colors.primary + '10',
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  cardTitleHighlight: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  itemIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  itemHeading: {
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  contactBox: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  contactText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  contactBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});

export default PrivacyPolicyScreen;
