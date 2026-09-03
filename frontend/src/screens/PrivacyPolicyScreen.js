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
 * Clean & Friendly Privacy Policy Screen for Sant Samagam
 */
const PrivacyPolicyScreen = () => {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@santsamagam.org?subject=Sant%20Samagam%20App%20Inquiry');
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
        </View>

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
                When you tap "Mark Attendance" at an event, the app checks your GPS location once to confirm you are at the Satsang venue. We <Text style={styles.bold}>never</Text> track your location in the background.
              </Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemIcon}>📿</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemHeading}>Japmala Chanting Records</Text>
              <Text style={styles.itemDesc}>
                To help you track your personal chanting progress and display community aggregate totals.
              </Text>
            </View>
          </View>
        </View>

        {/* 2. What We Never Do */}
        <View style={[styles.card, styles.cardHighlight]}>
          <Text style={styles.cardTitleHighlight}>🔒 Our Commitment to You</Text>
          
          <Text style={styles.bulletText}>
            • <Text style={styles.bold}>Zero Ads:</Text> We do not show advertisements.
          </Text>
          <Text style={styles.bulletText}>
            • <Text style={styles.bold}>No Data Selling:</Text> We <Text style={styles.bold}>never</Text> sell, rent, or share your contact details with any third parties or marketers.
          </Text>
          <Text style={styles.bulletText}>
            • <Text style={styles.bold}>Secure Storage:</Text> All your passwords and communications are encrypted with industry-standard security.
          </Text>
        </View>

        {/* 3. Your Full Control */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ You Are Always in Control</Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Edit Anytime:</Text> You can update your name or phone number whenever you want from the Profile tab.
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Delete Account:</Text> You can permanently delete your account and all associated attendance/Jap records with a single tap in your Profile settings.
          </Text>
        </View>

        {/* 4. Contact Us */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Questions or Support?</Text>
          <Text style={styles.paragraph}>
            If you ever have questions, need assistance with your account, or want your details updated, feel free to reach out to our organizers:
          </Text>

          <View style={styles.contactBox}>
            <Text style={styles.contactText}>📧 Email: <Text style={styles.bold}>support@santsamagam.org</Text></Text>
            <Text style={styles.contactText}>📍 Organization: <Text style={styles.bold}>Sant Samagam Community</Text></Text>
          </View>

          <TouchableOpacity style={styles.contactBtn} onPress={handleEmailSupport}>
            <Text style={styles.contactBtnText}>✉️ Contact Support Team</Text>
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
