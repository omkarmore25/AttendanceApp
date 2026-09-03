import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import theme from '../theme';

/**
 * Terms of Service Screen (With DPDP Data Protection Clause)
 * [LEGAL NOTICE: DRAFT FOR LEGAL COUNSEL REVIEW]
 */
const TermsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>📜 TERMS OF SERVICE & DATA USAGE AGREEMENT</Text>
          <Text style={styles.bannerSubtitle}>Last Updated: September 3, 2026 · Sant Samagam Devotee Portal</Text>
        </View>

        <Text style={styles.mainTitle}>Terms of Service</Text>
        <Text style={styles.introText}>
          Welcome to the Sant Samagam Devotee Application. By accessing or using our application, you agree to be bound
          by these Terms of Service and our statutory commitments under the Digital Personal Data Protection Act, 2023.
        </Text>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>1. Purpose & Community Code of Conduct</Text>
          <Text style={styles.paragraph}>
            This application is provided exclusively for organizing spiritual Satsang/Samagam events, verifying
            attendance, and maintaining personal/group Japmala spiritual records. Users agree to provide truthful information
            and refrain from unauthorized access or misuse of fellow devotees' contact details.
          </Text>
        </View>

        {/* Section 2: DEDICATED DPDP DATA PROTECTION CLAUSE */}
        <View style={[styles.section, styles.dpdpHighlight]}>
          <Text style={styles.dpdpHeading}>2. Data Protection Clause (DPDP Act, 2023 Compliance)</Text>
          <Text style={styles.paragraph}>
            In compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act):
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Fiduciary Duty:</Text> The Organization operates as a Data Fiduciary and undertakes to process your personal data fairly, transparently, and strictly for the spiritual coordination purposes you consented to.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Security Safeguards (Section 8(5)):</Text> We implement industry-standard administrative, physical, and technical controls (including cryptographic password hashing, HTTPS encryption, and role-based access) to protect against unauthorized access, loss, or data breaches.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Location Usage Restriction:</Text> Precise GPS location is accessed strictly upon explicit user interaction ("Mark Attendance") to verify radius proximity and is never logged continuously or shared with commercial entities.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Unconditional Right of Erasure & Withdrawal:</Text> You retain the unconditional right under Section 12 and Section 6(4) to withdraw consent or request complete erasure of your profile and historical records.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Breach Notification Guarantee (Section 8(6)):</Text> In the improbable event of a personal data breach, we are legally committed to notifying both the Data Protection Board of India and affected users within statutory timelines.
            </Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>3. Account Security & User Responsibilities</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your login credentials. If you suspect any
            unauthorized access to your account, please notify the Grievance Officer immediately.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>4. Modifications to Terms & Notice</Text>
          <Text style={styles.paragraph}>
            We may update these terms to reflect changes in regulatory directives or service features. Material updates
            will be communicated through an updated in-app notice requiring renewed consent.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.privacyBtn}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={styles.privacyBtnText}>📖 Read Full Statutory Privacy Notice</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  banner: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  bannerTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.accent,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  mainTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  introText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  section: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dpdpHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    backgroundColor: theme.colors.primary + '10',
  },
  sectionHeading: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  dpdpHeading: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: { marginTop: 4, marginBottom: 8 },
  bulletItem: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: { fontWeight: '700', color: theme.colors.textPrimary },
  privacyBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  privacyBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
});

export default TermsScreen;
