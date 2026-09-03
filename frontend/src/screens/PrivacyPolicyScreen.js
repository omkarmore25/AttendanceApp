import React from 'react';
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
 * Bilingual (English + Marathi) Clean Privacy Policy Screen
 */
const PrivacyPolicyScreen = () => {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:omkarmore5178@gmail.com?subject=Sant%20Samagam%20App%20Inquiry');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ Privacy Policy</Text>
          <Text style={styles.titleMarathi}>गोपनीयता धोरण</Text>
          <Text style={styles.subtitle}>
            Your privacy is sacred to us. We keep your data simple, transparent, and secure.
          </Text>
          <Text style={styles.subtitleMarathi}>
            तुमची गोपनीयता आमच्यासाठी अत्यंत महत्त्वाची आहे. आम्ही तुमची माहिती सुरक्षित व पारदर्शक ठेवतो.
          </Text>
        </View>

        {/* 1. What Data We Collect */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌸 What Information We Collect (आम्ही कोणती माहिती गोळा करतो)</Text>
          
          <View style={styles.itemRow}>
            <Text style={styles.itemIcon}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemHeading}>Name & Mobile Number (नाव आणि मोबाईल नंबर)</Text>
              <Text style={styles.itemDesc}>
                To identify you in the community roster and enable organizers to coordinate Satsang events.
              </Text>
              <Text style={styles.itemDescMarathi}>
                सत्संग कार्यक्रमांचे नियोजन आणि भक्तांची ओळख पटवण्यासाठी तुमचे नाव व मोबाईल नंबर वापरला जातो.
              </Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemHeading}>Location - Attendance Only (स्थान - फक्त हजेरीसाठी)</Text>
              <Text style={styles.itemDesc}>
                Checked on-demand only when you tap "Mark Attendance" to verify you are at the Satsang venue. We <Text style={styles.bold}>never</Text> track your location in the background.
              </Text>
              <Text style={styles.itemDescMarathi}>
                जेव्हा तुम्ही हजेरी नोंदवता, तेव्हा तुम्ही सत्संगाच्या ठिकाणी उपस्थित आहात याची खात्री करण्यासाठी GPS स्थान तपासले जाते. बॅकग्राउंडमध्ये स्थान ट्रॅक केले जात नाही.
              </Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemIcon}>📿</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemHeading}>Japmala Records (जपमाळा नोंदी)</Text>
              <Text style={styles.itemDesc}>
                To track your personal chanting progress and display community totals.
              </Text>
              <Text style={styles.itemDescMarathi}>
                तुमच्या दैनंदिन जपाची नोंद ठेवण्यासाठी आणि समूहातील एकूण जप प्रगती पाहण्यासाठी.
              </Text>
            </View>
          </View>
        </View>

        {/* 2. What We Never Do */}
        <View style={[styles.card, styles.cardHighlight]}>
          <Text style={styles.cardTitleHighlight}>🔒 Our Commitment to You (आमचे वचन)</Text>
          
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Zero Ads (कोणत्याही जाहिराती नाहीत):</Text> We do not show any advertisements.
              </Text>
              <Text style={styles.bulletMarathi}>या ॲपमध्ये कोणत्याही व्यावसायिक जाहिराती दाखवल्या जात नाहीत.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>No Data Selling (माहिती विकली जात नाही):</Text> We <Text style={styles.bold}>never</Text> sell or share your contact details with any third parties or marketers.
              </Text>
              <Text style={styles.bulletMarathi}>आम्ही तुमची वैयक्तिक माहिती किंवा फोन नंबर कोणालाही विकत नाही किंवा शेअर करत नाही.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Encrypted Security (सुरक्षित साठवणूक):</Text> All passwords and data are safely encrypted.
              </Text>
              <Text style={styles.bulletMarathi}>तुमचा पासवर्ड आणि सर्व डेटा सुरक्षितपणे एन्क्रिप्ट केलेला असतो.</Text>
            </View>
          </View>
        </View>

        {/* 3. Your Full Control */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ Your Full Control (तुमचे पूर्ण नियंत्रण)</Text>
          
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Edit Anytime (कधीही बदल करा):</Text> You can update your name or phone number anytime in Profile.
              </Text>
              <Text style={styles.bulletMarathi}>तुम्ही प्रोफाइलमधून तुमचे नाव आणि मोबाईल नंबर कधीही बदलू शकता.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Delete Account (खाते हटवा):</Text> You can permanently delete your account and records in 1 tap.
              </Text>
              <Text style={styles.bulletMarathi}>तुम्ही प्रोफाइल सेटिंग्जमधून तुमचे खाते आणि सर्व नोंदी कधीही कायमस्वरूपी हटवू शकता.</Text>
            </View>
          </View>
        </View>

        {/* 4. Contact Us */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Questions or Support? (संपर्क व मदत)</Text>
          <Text style={styles.paragraph}>
            If you have any questions or need assistance with your account, feel free to contact us:
          </Text>
          <Text style={styles.paragraphMarathi}>
            आपल्याला ॲपबद्दल काही प्रश्न असल्यास किंवा मदतीची गरज असल्यास आपण संपर्क साधू शकता:
          </Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactText}>📧 Email: <Text style={styles.bold}>omkarmore5178@gmail.com</Text></Text>
            <Text style={styles.contactText}>📍 Community: <Text style={styles.bold}>Sant Samagam (संत समागम)</Text></Text>
          </View>

          <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
            <Text style={styles.contactBtnText}>✉️ Contact Support (ईमेल पाठवा)</Text>
          </TouchableOpacity>
        </View>

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
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  titleMarathi: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.accent,
    marginTop: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  subtitleMarathi: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
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
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  itemDescMarathi: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletPoint: {
    color: theme.colors.primary,
    fontSize: 16,
    marginRight: 8,
    marginTop: -2,
  },
  bulletText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  bulletMarathi: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  paragraph: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  paragraphMarathi: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
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
