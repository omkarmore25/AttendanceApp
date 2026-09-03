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
 * Privacy Policy Screen (DPDP Act 2023 Compliant Notice)
 * [LEGAL NOTICE: DRAFT FOR LEGAL COUNSEL REVIEW]
 */
const PrivacyPolicyScreen = ({ navigation }) => {
  const handleContactPress = () => {
    Linking.openURL('mailto:privacy@santsamagam.org?subject=DPDP%20Privacy%20Inquiry');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        {/* Legal Disclaimer Badge */}
        <View style={styles.legalBanner}>
          <Text style={styles.legalBannerTitle}>⚖️ STATUTORY NOTICE UNDER DPDP ACT, 2023</Text>
          <Text style={styles.legalBannerText}>
            This notice is issued under Section 5 of the Digital Personal Data Protection Act, 2023 (DPDP Act).
            Last Updated: September 3, 2026 · Notice Version: v1.0.0
          </Text>
        </View>

        <Text style={styles.mainTitle}>Privacy Notice & Data Protection Policy</Text>
        <Text style={styles.introText}>
          Sant Samagam Trust ("Organization", "we", "us", or "our") acts as a Data Fiduciary under the
          Digital Personal Data Protection Act, 2023. We are committed to safeguarding the digital personal data
          of all devotees, members, and visitors ("Data Principals" or "you").
        </Text>

        {/* Section 1 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>1. What Personal Data We Collect & Process</Text>
          <Text style={styles.paragraph}>
            We collect only the minimum necessary data required to facilitate spiritual community coordination:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Identity & Contact Data:</Text> Full name, phone number, email address, and username.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Precise GPS Location Data:</Text> Requested <Text style={styles.italic}>on-demand only</Text> when you tap "Mark Attendance" at an active event to verify physical presence within the event radius. Location is <Text style={styles.bold}>never</Text> tracked continuously or in the background.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Spiritual & Activity Records:</Text> Japmala chanting counts, dates of practice, and event attendance timestamps.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Technical Logs:</Text> IP addresses and device user-agents strictly for session security and consent audit trails.
            </Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>2. Specified Grounds & Purposes for Processing</Text>
          <Text style={styles.paragraph}>
            In compliance with Section 4 and Section 6 of the DPDP Act, your data is processed solely for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Creating and managing your devotee account and authenticating logins.</Text>
            <Text style={styles.bulletItem}>• Proximity verification for physical Satsang/Samagam event attendance.</Text>
            <Text style={styles.bulletItem}>• Logging individual and aggregate Japmala chanting totals.</Text>
            <Text style={styles.bulletItem}>• Communicating critical spiritual event schedules and administrative announcements.</Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>3. Data Retention & Erasure Policy</Text>
          <Text style={styles.paragraph}>
            In accordance with Section 8(7) of the DPDP Act:
          </Text>
          <Text style={styles.paragraph}>
            • We retain personal data only for as long as your account remains active or as required for historical community attendance archives.
          </Text>
          <Text style={styles.paragraph}>
            • When you request account deletion or withdraw consent, all personal identifiers and associated logs are permanently erased from active databases within 30 days.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>4. Third-Party Processors & Cross-Border Transfers</Text>
          <Text style={styles.paragraph}>
            We do not sell, rent, or monetize your personal data. We utilize authorized Data Processors under strict confidentiality terms:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• <Text style={styles.bold}>Database Infrastructure:</Text> MongoDB Atlas (Encrypted at rest & in transit).</Text>
            <Text style={styles.bulletItem}>• <Text style={styles.bold}>Cloud Hosting:</Text> Render / Vercel (HTTPS TLS 1.3 enforced).</Text>
            <Text style={styles.bulletItem}>• <Text style={styles.bold}>Geocoding API:</Text> OpenStreetMap Nominatim (Coordinates sent anonymously without user profile data).</Text>
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>5. Your Statutory Rights as a Data Principal</Text>
          <Text style={styles.paragraph}>
            Under Chapter III of the DPDP Act 2023, you have the following enforceable rights:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Right to Access Information (Section 11):</Text> Request a complete summary of your personal data and processing activities.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Right to Correction & Erasure (Section 12):</Text> Correct inaccurate details, update phone/name, or request complete erasure.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Right to Withdraw Consent (Section 6(4)):</Text> Withdraw your opt-in consent at any time without punitive consequences.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Right of Grievance Redressal (Section 13):</Text> Submit grievances to our designated Grievance Officer.
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Right to Nominate (Section 14):</Text> Nominate another individual to exercise your rights in the event of death or incapacity.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('DataRights')}
          >
            <Text style={styles.actionBtnText}>🛡️ Exercise Your Data Rights Online</Text>
          </TouchableOpacity>
        </View>

        {/* Section 6 */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>6. Protection of Children’s Personal Data</Text>
          <Text style={styles.paragraph}>
            Under Section 9 of the DPDP Act, processing personal data of individuals under 18 years requires verifiable parental consent. We do not engage in behavioral tracking or targeted advertising of minors.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={[styles.section, styles.grievanceCard]}>
          <Text style={styles.grievanceHeading}>7. Grievance Redressal Mechanism</Text>
          <Text style={styles.paragraph}>
            If you have any questions, concerns, or wish to file a privacy grievance, contact our designated Grievance Officer:
          </Text>

          <View style={styles.contactDetails}>
            <Text style={styles.contactRow}><Text style={styles.bold}>Designation:</Text> Data Protection & Grievance Officer</Text>
            <Text style={styles.contactRow}><Text style={styles.bold}>Organization:</Text> Sant Samagam Trust</Text>
            <Text style={styles.contactRow}><Text style={styles.bold}>Email:</Text> privacy@santsamagam.org</Text>
            <Text style={styles.contactRow}><Text style={styles.bold}>Phone:</Text> +91 98765 43210</Text>
            <Text style={styles.contactRow}><Text style={styles.bold}>Address:</Text> Samagam Bhavan, North Goa - 403506, India</Text>
            <Text style={styles.contactRow}><Text style={styles.bold}>Statutory SLA:</Text> Resolution within 30 days of receipt</Text>
          </View>

          <TouchableOpacity style={styles.emailBtn} onPress={handleContactPress}>
            <Text style={styles.emailBtnText}>✉️ Contact Grievance Officer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            If your grievance is not resolved within 30 days, you have the right to file a complaint before the
            <Text style={styles.bold}> Data Protection Board of India (DPBI)</Text>.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  legalBanner: {
    backgroundColor: theme.colors.primary + '18',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  legalBannerTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  legalBannerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
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
  sectionHeading: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
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
    marginBottom: 6,
  },
  bold: { fontWeight: '700', color: theme.colors.textPrimary },
  italic: { fontStyle: 'italic' },
  actionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  grievanceCard: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
  },
  grievanceHeading: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    marginBottom: theme.spacing.sm,
  },
  contactDetails: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  contactRow: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  emailBtn: {
    backgroundColor: theme.colors.bgElevated,
    borderColor: theme.colors.accent,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  emailBtnText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  footerNote: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PrivacyPolicyScreen;
