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
 * Bilingual (English + Marathi) Clean Terms of Service for Sant Samagam
 */
const TermsScreen = () => {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:omkarmore5178@gmail.com?subject=Sant%20Samagam%20App%20Terms%20Inquiry');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📜 Terms of Service</Text>
          <Text style={styles.titleMarathi}>नियम व अटी</Text>
          <Text style={styles.subtitle}>
            Simple guidelines to ensure a respectful, harmonious community experience.
          </Text>
          <Text style={styles.subtitleMarathi}>
            संत समागम समुदायामध्ये आदरयुक्त आणि सुलभ अनुभव मिळण्यासाठी साधे नियम.
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌸 1. Purpose of the Application (ॲपचा उद्देश)</Text>
          <Text style={styles.paragraph}>
            This application is created solely for the Sant Samagam spiritual community to:
          </Text>
          <Text style={styles.paragraphMarathi}>
            हे ॲप केवळ संत समागम आध्यात्मिक समुदायासाठी खालील उद्देशांसाठी बनवले आहे:
          </Text>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>Organize & attend Satsang/Samagam events.</Text>
              <Text style={styles.bulletMarathi}>सत्संग व समागम कार्यक्रमांचे सुलभ नियोजन व हजेरी.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>Record daily and monthly Japmala counts.</Text>
              <Text style={styles.bulletMarathi}>दैनंदिन व मासिक जपमाळा मोजणे व जपाची नोंद ठेवणे.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>Facilitate smooth event coordination among devotees.</Text>
              <Text style={styles.bulletMarathi}>भक्त आणि आयोजक यांच्यात योग्य समन्वय साधणे.</Text>
            </View>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤝 2. Community Guidelines (समूह नियमावली)</Text>
          
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Accurate Information (योग्य माहिती):</Text> Please provide your genuine name and contact number for Satsang coordination.
              </Text>
              <Text style={styles.bulletMarathi}>आयोजकांना संपर्क साधता यावा म्हणून कृपया आपले खरे नाव व फोन नंबर द्यावा.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Respectful Use (आदरयुक्त वापर):</Text> Contact details of fellow devotees must never be used for commercial or advertising purposes.
              </Text>
              <Text style={styles.bulletMarathi}>भक्तांच्या संपर्क क्रमांकाचा वापर कोणत्याही जाहिराती किंवा गैरवापरासाठी करू नये.</Text>
            </View>
          </View>
        </View>

        {/* Section 3 */}
        <View style={[styles.card, styles.cardHighlight]}>
          <Text style={styles.cardTitleHighlight}>🔒 3. Data Protection & Peace of Mind (सुरक्षितता व खात्री)</Text>
          
          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>We operate strictly for non-profit spiritual coordination.</Text>
              <Text style={styles.bulletMarathi}>हे ॲप पूर्णपणे विनामूल्य व आध्यात्मिक सेवेसाठी आहे.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>We do not sell data or track you in the background.</Text>
              <Text style={styles.bulletMarathi}>आम्ही कोणतीही माहिती विकत नाही किंवा बॅकग्राउंड ट्रॅकिंग करत नाही.</Text>
            </View>
          </View>

          <View style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletText}>You have the complete freedom to delete your account anytime.</Text>
              <Text style={styles.bulletMarathi}>तुम्हाला तुमचे खाते व नोंदी कधीही कायमस्वरूपी हटवण्याचे पूर्ण स्वातंत्र्य आहे.</Text>
            </View>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Contact (संपर्क)</Text>
          <Text style={styles.paragraph}>
            For any queries regarding these terms, contact us at:
          </Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactText}>📧 Email: <Text style={styles.bold}>omkarmore5178@gmail.com</Text></Text>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
            <Text style={styles.contactBtnText}>✉️ Send Email (ईमेल पाठवा)</Text>
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
    marginBottom: theme.spacing.sm,
  },
  cardTitleHighlight: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
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
    marginBottom: 2,
  },
  paragraphMarathi: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
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
