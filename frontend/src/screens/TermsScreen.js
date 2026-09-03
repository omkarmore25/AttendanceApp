import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import theme from '../theme';

/**
 * Terms of Service Screen with English / Marathi Toggle & Universal Email Handler
 */
const TermsScreen = () => {
  const [lang, setLang] = useState('en'); // 'en' | 'mr'

  const handleEmailSupport = async () => {
    const emailUrl = 'mailto:omkarmore5178@gmail.com?subject=Sant%20Samagam%20App%20Terms%20Inquiry';
    if (Platform.OS === 'web') {
      window.location.href = emailUrl;
    } else {
      Linking.openURL(emailUrl).catch((err) => {
        console.warn('Could not open email client', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Language Toggle */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {lang === 'en' ? '📜 Terms of Service' : '📜 नियम व अटी'}
              </Text>
              <Text style={styles.subtitle}>
                {lang === 'en'
                  ? 'Simple guidelines to ensure a respectful, harmonious community experience.'
                  : 'संत समागम समुदायामध्ये आदरयुक्त आणि सुलभ अनुभव मिळण्यासाठी साधे नियम.'}
              </Text>
            </View>
          </View>

          {/* Clean Language Toggle Buttons */}
          <View style={styles.langToggleContainer}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => setLang('en')}
              activeOpacity={0.7}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langBtn, lang === 'mr' && styles.langBtnActive]}
              onPress={() => setLang('mr')}
              activeOpacity={0.7}
            >
              <Text style={[styles.langBtnText, lang === 'mr' && styles.langBtnTextActive]}>
                मराठी
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {lang === 'en' ? (
          /* ─── ENGLISH CONTENT ─── */
          <>
            {/* Section 1 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌸 1. Purpose of the Application</Text>
              <Text style={styles.paragraph}>
                This application is created solely for the Sant Samagam spiritual community to:
              </Text>
              <Text style={styles.bulletText}>• Schedule, organize, and attend Satsang/Samagam events.</Text>
              <Text style={styles.bulletText}>• Enable devotees to record daily and monthly Japmala counts.</Text>
              <Text style={styles.bulletText}>• Facilitate smooth event coordination among organizers and attendees.</Text>
            </View>

            {/* Section 2 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🤝 2. Community Guidelines</Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Accurate Information:</Text> Please provide your genuine name and contact number so organizers can coordinate with you.
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>Respectful Use:</Text> Contact information of fellow devotees must never be used for commercial, advertising, or inappropriate purposes.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={[styles.card, styles.cardHighlight]}>
              <Text style={styles.cardTitleHighlight}>🔒 3. Data Protection & Peace of Mind</Text>
              <Text style={styles.paragraph}>
                • We operate strictly for non-profit spiritual coordination.
              </Text>
              <Text style={styles.paragraph}>
                • We do not sell data, track you in the background, or share your details with advertisers.
              </Text>
              <Text style={styles.paragraph}>
                • You have the complete freedom to update your information or delete your profile permanently at any time.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📞 Contact</Text>
              <Text style={styles.paragraph}>
                For any queries regarding these terms, feel free to contact us:
              </Text>
              <View style={styles.contactBox}>
                <Text style={styles.contactText}>📧 Email: <Text style={styles.bold}>omkarmore5178@gmail.com</Text></Text>
              </View>
              <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport} activeOpacity={0.85}>
                <Text style={styles.contactBtnText}>✉️ Send Email</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ─── MARATHI CONTENT ─── */
          <>
            {/* Section 1 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌸 १. ॲपचा मुख्य उद्देश</Text>
              <Text style={styles.paragraph}>
                हे ॲप केवळ संत समागम आध्यात्मिक समुदायासाठी खालील उद्देशांसाठी बनवले आहे:
              </Text>
              <Text style={styles.bulletText}>• सत्संग व समागम कार्यक्रमांचे सुलभ आयोजन व हजेरी.</Text>
              <Text style={styles.bulletText}>• दैनंदिन व मासिक जपमाळा मोजणे व जपाची नोंद ठेवणे.</Text>
              <Text style={styles.bulletText}>• भक्त आणि आयोजक यांच्यात योग्य समन्वय साधणे.</Text>
            </View>

            {/* Section 2 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🤝 २. समूह नियमावली</Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>योग्य माहिती:</Text> आयोजकांना संपर्क साधता यावा म्हणून कृपया आपले खरे नाव व फोन नंबर द्यावा.
              </Text>
              <Text style={styles.bulletText}>
                • <Text style={styles.bold}>आदरयुक्त वापर:</Text> भक्तांच्या संपर्क क्रमांकाचा वापर कोणत्याही जाहिराती किंवा गैरवापरासाठी करू नये.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={[styles.card, styles.cardHighlight]}>
              <Text style={styles.cardTitleHighlight}>🔒 ३. सुरक्षितता व खात्री</Text>
              <Text style={styles.paragraph}>
                • हे ॲप पूर्णपणे विनामूल्य व आध्यात्मिक सेवेसाठी आहे.
              </Text>
              <Text style={styles.paragraph}>
                • आम्ही कोणतीही माहिती विकत नाही किंवा बॅकग्राउंड ट्रॅकिंग करत नाही.
              </Text>
              <Text style={styles.paragraph}>
                • तुम्हाला तुमचे खाते व नोंदी कधीही कायमस्वरूपी हटवण्याचे पूर्ण स्वातंत्र्य आहे.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📞 संपर्क</Text>
              <Text style={styles.paragraph}>
                या नियमांबद्दल काही प्रश्न असल्यास, आपण आमच्याशी संपर्क साधू शकता:
              </Text>
              <View style={styles.contactBox}>
                <Text style={styles.contactText}>📧 ईमेल: <Text style={styles.bold}>omkarmore5178@gmail.com</Text></Text>
              </View>
              <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport} activeOpacity={0.85}>
                <Text style={styles.contactBtnText}>✉️ ईमेल पाठवा</Text>
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
    paddingHorizontal: 18,
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
    marginBottom: theme.spacing.sm,
  },
  cardTitleHighlight: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
  },
  bulletText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  contactBox: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  contactBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
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

export default TermsScreen;
