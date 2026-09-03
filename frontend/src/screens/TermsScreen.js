import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import theme from '../theme';

/**
 * Clean & Friendly Terms of Service for Sant Samagam
 */
const TermsScreen = () => {
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
        </View>

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
    marginBottom: theme.spacing.sm,
  },
  cardTitleHighlight: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 6,
  },
  bulletText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
