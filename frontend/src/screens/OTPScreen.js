import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { showAlert } from '../utils/dialog';

const OTPScreen = ({ route, navigation }) => {
  const { email, username, phone, password } = route.params;
  const { verifyOTP, sendOTP } = useAuth();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      showAlert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(email, otp.trim(), username, phone, password);
    setLoading(false);

    if (!result.success) {
      showAlert('Verification Failed', result.message);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await sendOTP(username, email, phone, password);
    setResending(false);

    if (result.success) {
      setTimer(60);
      showAlert('Code Resent', `A new verification code has been sent to ${email}.`);
    } else {
      showAlert('Error', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.emoji}>✉️</Text>
            <Text style={styles.title}>Verify Email Address</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit verification code sent to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.spamHint}>
              💡 Check Spam or Promotions folder if you don't see it in Inbox.
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpGroup}>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="• • • • • •"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Verify & Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Resend Timer */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>
                  {resending ? 'Resending...' : 'Didn\'t receive code? Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1322',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#161f33',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#212d4a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  spamHint: {
    fontSize: 12,
    color: '#ff6b00',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emailHighlight: {
    color: '#ff6b00',
    fontWeight: '700',
  },
  otpGroup: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ff6b00',
    paddingVertical: 18,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#ff6b00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 24,
  },
  timerText: {
    color: '#64748b',
    fontSize: 14,
  },
  resendLink: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OTPScreen;
