import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { showAlert } from '../utils/dialog';
import * as WebBrowser from 'expo-web-browser';

import GoogleIcon from '../components/GoogleIcon';

const GOOGLE_CLIENT_ID = '630044773737-2cellkr3ttout8d0jvdln10bl0k8qfpo.apps.googleusercontent.com';

const RegisterScreen = ({ navigation }) => {
  const { sendOTP, googleLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // DPDP Act 2023 Opt-In Consent States (Unticked by default per Section 6)
  const [consentEssential, setConsentEssential] = useState(false);
  const [consentLocation, setConsentLocation] = useState(false);
  const [consentJapmala, setConsentJapmala] = useState(false);
  const [consentAge, setConsentAge] = useState(false);

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please fill in Username, Email Address, Mobile Number, and Password.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!/^\d{10,15}$/.test(phone.trim())) {
      showAlert('Invalid Mobile', 'Please enter a valid 10-15 digit mobile number.');
      return;
    }

    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (!consentEssential) {
      showAlert(
        'Statutory Consent Required',
        'Please consent to the essential processing of your account data under the DPDP Act 2023 to proceed with registration.'
      );
      return;
    }

    if (!consentAge) {
      showAlert(
        'Age Declaration Required',
        'Please confirm you are 18 years or older (or have parental consent) as required under Section 9 of the DPDP Act.'
      );
      return;
    }

    setLoading(true);
    const result = await sendOTP(username.trim(), email.trim(), phone.trim(), password);
    setLoading(false);

    if (result.success) {
      showAlert('Verification Code Sent', `A 6-digit verification code has been sent to ${email.trim()}.`);
      navigation.navigate('OTP', {
        email: email.trim(),
        username: username.trim(),
        phone: phone.trim(),
        password,
        consent: {
          essential_account: consentEssential,
          location_attendance: consentLocation,
          japmala_community: consentJapmala,
          age_confirmed: consentAge,
        },
      });
    } else {
      showAlert('Registration Failed', result.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      if (Platform.OS === 'web' && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              const result = await googleLogin({ idToken: response.credential });
              if (!result.success) {
                showAlert('Google Sign-In Failed', result.message);
              }
            }
            setGoogleLoading(false);
          },
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            showAlert('Google Sign-In', 'Please log in or sign up with Email & Password or tap Continue with Google.');
            setGoogleLoading(false);
          }
        });
      } else {
        // Native Mobile Android APK Google Sign In
        const redirectUri = 'https://attendance-app-one-umber.vercel.app';
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;

        const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUri);

        if (result.type === 'success' && result.url) {
          const hashString = result.url.split('#')[1] || result.url.split('?')[1] || '';
          const params = new URLSearchParams(hashString);
          const accessToken = params.get('access_token');

          if (accessToken) {
            WebBrowser.dismissBrowser();
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const userInfo = await userRes.json();

            if (userInfo.email) {
              const loginRes = await googleLogin({
                googleId: userInfo.sub,
                email: userInfo.email,
                username: userInfo.name || userInfo.email.split('@')[0],
              });
              if (!loginRes.success) {
                showAlert('Google Sign-In Failed', loginRes.message);
              }
            } else {
              showAlert('Google Sign-In', 'Could not fetch Google profile.');
            }
          }
        }
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google Sign In error:', error);
      showAlert('Error', 'Google Sign-In failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Above Card */}
        <Text style={styles.appHeading}>जय सच्चिदानंद 🚩</Text>

        <View style={styles.card}>
          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.googleRow}>
                <GoogleIcon size={20} />
                <Text style={styles.googleText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={[styles.inputGroup, focusedField === 'username' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#64748b"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, focusedField === 'email' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, focusedField === 'phone' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={[styles.inputGroup, focusedField === 'password' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* ─── DPDP Act 2023 Opt-In Consent Section (Unbundled & Unticked) ─── */}
            <View style={styles.consentSection}>
              <Text style={styles.consentSectionTitle}>⚖️ STATUTORY CONSENT (DPDP ACT 2023)</Text>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentEssential(!consentEssential)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, consentEssential && styles.checkboxChecked]}>
                  {consentEssential && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  <Text style={styles.consentRequiredText}>* Essential Processing: </Text>
                  I consent to processing my name, email, and phone for devotee account management & security.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentLocation(!consentLocation)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, consentLocation && styles.checkboxChecked]}>
                  {consentLocation && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  <Text style={styles.consentBoldText}>Location Verification: </Text>
                  I consent to on-demand GPS location access solely during event check-ins to verify physical proximity.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentJapmala(!consentJapmala)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, consentJapmala && styles.checkboxChecked]}>
                  {consentJapmala && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  <Text style={styles.consentBoldText}>Japmala Records: </Text>
                  I consent to logging my Jap counts and displaying totals in community standings.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentAge(!consentAge)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, consentAge && styles.checkboxChecked]}>
                  {consentAge && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  <Text style={styles.consentRequiredText}>* Age Declaration (Sec 9): </Text>
                  I confirm I am 18 years or older (or have verifiable parental consent).
                </Text>
              </TouchableOpacity>

              <View style={styles.legalLinksRow}>
                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                  <Text style={styles.legalLink}>Read Privacy Notice</Text>
                </TouchableOpacity>
                <Text style={styles.legalDivider}>•</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                  <Text style={styles.legalLink}>Terms of Service</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => showAlert('Reset Password', 'Contact administrator or check your email.')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Switch to Log In */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1322',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  appHeading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ff6b00',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
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
  googleBtn: {
    backgroundColor: '#1a243b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b395b',
  },
  googleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  googleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#273554',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#273554',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputGroupFocused: {
    borderColor: '#6366f1',
  },
  input: {
    fontSize: 15,
    color: '#ffffff',
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#ff6b00',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
    fontSize: 17,
    fontWeight: '800',
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 4,
  },
  forgotText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  footerLink: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: '700',
  },
  consentSection: {
    backgroundColor: '#161e31',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  consentSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748b',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#ff6b00',
    borderColor: '#ff6b00',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },
  consentRequiredText: {
    fontWeight: '700',
    color: '#f1f5f9',
  },
  consentBoldText: {
    fontWeight: '700',
    color: '#cbd5e1',
  },
  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  legalLink: {
    color: '#ff6b00',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: '#64748b',
    fontSize: 12,
  },
});

export default RegisterScreen;
