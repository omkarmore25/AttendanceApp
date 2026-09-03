import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import theme from '../theme';
import { showAlert } from '../utils/dialog';

/**
 * Data Rights & Grievance Portal (DPDP Act 2023 Self-Service)
 */
const DataRightsScreen = ({ navigation }) => {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState('access'); // 'access' | 'request' | 'grievance'

  // Access / Portability State
  const [exporting, setExporting] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);

  // Rights Request Form State
  const [requestType, setRequestType] = useState('Correction'); // 'Correction' | 'Erasure' | 'WithdrawConsent' | 'Nomination'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeContact, setNomineeContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Handle Download My Data (Section 11)
  const handleDownloadMyData = async () => {
    if (!isLoggedIn) {
      showAlert('Login Required', 'Please log in with your devotee account to generate and download your personal data dump.');
      return;
    }

    try {
      setExporting(true);
      const response = await api.get('/compliance/my-data');
      const data = response.data.data;
      setDataSummary(data);

      if (Platform.OS === 'web') {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute(
          'download',
          `Sant_Samagam_Personal_Data_${new Date().toISOString().slice(0, 10)}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }

      showAlert(
        'Data Export Ready',
        'Your machine-readable personal data report has been generated under Section 11 of the DPDP Act.'
      );
    } catch (error) {
      console.error('Data export error:', error);
      showAlert('Notice', error.response?.data?.message || 'Failed to generate data export.');
    } finally {
      setExporting(false);
    }
  };

  // Handle Submit Rights Request
  const handleSubmitRequest = async () => {
    if (!name.trim() || !details.trim()) {
      showAlert('Required Fields', 'Please enter your Name and Request Details.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        request_type: requestType,
        requester_name: name.trim(),
        requester_email: email.trim(),
        requester_phone: phone.trim(),
        details: details.trim(),
        nominee_details:
          requestType === 'Nomination'
            ? { name: nomineeName.trim(), contact: nomineeContact.trim() }
            : undefined,
      };

      const response = await api.post('/compliance/data-rights', payload);
      setSubmissionResult(response.data);
      setDetails('');
      setNomineeName('');
      setNomineeContact('');
      showAlert(
        'Request Recorded',
        response.data.message || 'Your request has been submitted to the Grievance Officer.'
      );
    } catch (error) {
      console.error('Submit rights error:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ Data Principal Rights Portal</Text>
          <Text style={styles.subtitle}>
            Exercise your statutory rights under the Digital Personal Data Protection Act, 2023
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'access' && styles.tabBtnActive]}
            onPress={() => setActiveTab('access')}
          >
            <Text style={[styles.tabText, activeTab === 'access' && styles.tabTextActive]}>
              📥 Access Data
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'request' && styles.tabBtnActive]}
            onPress={() => setActiveTab('request')}
          >
            <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>
              ✏️ Rights Form
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'grievance' && styles.tabBtnActive]}
            onPress={() => setActiveTab('grievance')}
          >
            <Text style={[styles.tabText, activeTab === 'grievance' && styles.tabTextActive]}>
              ⚖️ Grievance Officer
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ACCESS & DATA PORTABILITY */}
        {activeTab === 'access' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Section 11: Right to Access Information</Text>
            <Text style={styles.cardDesc}>
              You have the statutory right to obtain a full machine-readable copy of your personal data,
              attendance history, Japmala records, and consent timestamps.
            </Text>

            {!isLoggedIn ? (
              <View style={styles.loginRequiredCard}>
                <Text style={styles.loginRequiredIcon}>🔒</Text>
                <Text style={styles.loginRequiredTitle}>Devotee Login Required</Text>
                <Text style={styles.loginRequiredText}>
                  To generate and download your personal data archive (profile, attendance, and Japmala records),
                  please log in with your registered account.
                </Text>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginBtnText}>🔑 Log In to Access My Data</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.loggedInUserBadge}>
                  <Text style={styles.loggedInText}>
                    Logged in as: <Text style={styles.bold}>{user?.name || user?.username}</Text> ({user?.email || user?.phone})
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, exporting && { opacity: 0.7 }]}
                  onPress={handleDownloadMyData}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>📥 Download My Personal Data Dump (JSON)</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {dataSummary && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>📊 Personal Data Snapshot:</Text>
                <Text style={styles.summaryRow}>• Name: <Text style={styles.bold}>{dataSummary.profile?.name || dataSummary.profile?.username}</Text></Text>
                <Text style={styles.summaryRow}>• Phone: <Text style={styles.bold}>{dataSummary.profile?.phone || 'Not recorded'}</Text></Text>
                <Text style={styles.summaryRow}>• Attendance Records: <Text style={styles.bold}>{dataSummary.attendance?.total_records || 0} events</Text></Text>
                <Text style={styles.summaryRow}>• Total Japmala Count: <Text style={styles.bold}>{dataSummary.japmala?.total_count || 0} माळा</Text></Text>
                <Text style={styles.summaryRow}>• Active Consents: <Text style={styles.bold}>{dataSummary.consents?.length || 0} records</Text></Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: RIGHTS REQUEST FORM */}
        {activeTab === 'request' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit Statutory Rights Request</Text>
            <Text style={styles.cardDesc}>
              Select the right you wish to exercise under DPDP Act 2023:
            </Text>

            {/* Type Selector */}
            <View style={styles.typeSelectorRow}>
              {[
                { key: 'Correction', label: '✏️ Correction' },
                { key: 'Erasure', label: '🗑️ Erasure / Delete' },
                { key: 'WithdrawConsent', label: '🛑 Withdraw Consent' },
                { key: 'Nomination', label: '👥 Nominate' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, requestType === t.key && styles.typeBtnActive]}
                  onPress={() => setRequestType(t.key)}
                >
                  <Text style={[styles.typeBtnText, requestType === t.key && styles.typeBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR FULL NAME *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name..."
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {requestType === 'Nomination' && (
              <View style={styles.nomineeSection}>
                <Text style={styles.nomineeTitle}>Section 14: Nominee Information</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOMINEE FULL NAME *</Text>
                  <TextInput
                    style={styles.input}
                    value={nomineeName}
                    onChangeText={setNomineeName}
                    placeholder="Enter trusted nominee's name..."
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOMINEE PHONE / EMAIL *</Text>
                  <TextInput
                    style={styles.input}
                    value={nomineeContact}
                    onChangeText={setNomineeContact}
                    placeholder="Nominee contact details..."
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>REQUEST SPECIFICS & DETAILS *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={details}
                onChangeText={setDetails}
                placeholder="Explain clearly what data you wish to correct, erase, or withdraw..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>📤 Submit Statutory Request</Text>
              )}
            </TouchableOpacity>

            {submissionResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>✅ Reference ID: {submissionResult.reference_id}</Text>
                <Text style={styles.resultText}>
                  Your request has been logged in our compliance register. Our Grievance Officer will review and fulfill within 30 days.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: GRIEVANCE OFFICER DETAILS */}
        {activeTab === 'grievance' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Section 13: Grievance Redressal Mechanism</Text>
            <Text style={styles.cardDesc}>
              The Data Protection Officer has been designated to address any inquiries, complaints, or compliance concerns regarding your digital personal data.
            </Text>

            <View style={styles.officerCard}>
              <Text style={styles.officerRow}><Text style={styles.bold}>Officer:</Text> Shri Grievance Officer</Text>
              <Text style={styles.officerRow}><Text style={styles.bold}>Designation:</Text> Data Protection & Grievance Redressal Officer</Text>
              <Text style={styles.officerRow}><Text style={styles.bold}>Entity:</Text> Sant Samagam Trust</Text>
              <Text style={styles.officerRow}><Text style={styles.bold}>Email:</Text> privacy@santsamagam.org</Text>
              <Text style={styles.officerRow}><Text style={styles.bold}>Phone:</Text> +91 98765 43210</Text>
              <Text style={styles.officerRow}><Text style={styles.bold}>Postal Address:</Text> Samagam Bhavan, Spiritual Center Road, North Goa - 403506, India</Text>
              <Text style={styles.officerRow}><Text style={styles.bold}>Statutory SLA:</Text> Resolution within 30 days</Text>
            </View>

            <View style={styles.escalationBox}>
              <Text style={styles.escalationTitle}>⚖️ Statutory Escalation to DPBI</Text>
              <Text style={styles.escalationText}>
                Under Section 13(3) of the DPDP Act, if your grievance is not resolved to your satisfaction within 30 days, you have the statutory right to escalate your complaint directly to the:
              </Text>
              <Text style={[styles.bold, { color: theme.colors.accent, marginTop: 4 }]}>
                Data Protection Board of India (DPBI)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: 60 },
  header: { marginBottom: theme.spacing.lg },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  loginRequiredCard: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loginRequiredIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  loginRequiredTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  loginRequiredText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: 'bold',
  },
  loggedInUserBadge: {
    backgroundColor: theme.colors.primary + '18',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  loggedInText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  summaryBox: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    marginBottom: 8,
  },
  summaryRow: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  typeBtn: {
    backgroundColor: theme.colors.bgInput,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent + '20',
  },
  typeBtnText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  typeBtnTextActive: {
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  nomineeSection: {
    backgroundColor: theme.colors.bgElevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  nomineeTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
  },
  resultBox: {
    backgroundColor: '#10b98115',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  resultTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: '#10b981',
    marginBottom: 4,
  },
  resultText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  officerCard: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  officerRow: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  escalationBox: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  escalationTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryLight,
    marginBottom: 4,
  },
  escalationText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bold: { fontWeight: '700', color: theme.colors.textPrimary },
});

export default DataRightsScreen;
