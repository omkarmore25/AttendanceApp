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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { showAlert } from '../utils/dialog';
import * as WebBrowser from 'expo-web-browser';
import GoogleIcon from '../components/GoogleIcon';
import { transliterateToMarathi, toEnglishDigits, toMarathiDigits } from '../utils/marathiUtils';

const GOOGLE_CLIENT_ID = '630044773737-2cellkr3ttout8d0jvdln10bl0k8qfpo.apps.googleusercontent.com';

const RegisterScreen = ({ navigation }) => {
  const { sendOTP, googleLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleTransliterateName = () => {
    if (!username.trim()) return;
    const converted = transliterateToMarathi(username);
    setUsername(converted);
  };

  const handleSignUp = async () => {
    const cleanUser = username.trim();
    const cleanMail = email.trim().toLowerCase();
    const cleanPhone = toEnglishDigits(phone.trim());

    if (!cleanUser || !cleanMail || !cleanPhone || !password.trim()) {
      showAlert('Missing Fields / माहिती भरा', 'Please fill in Full Name, Email Address, Mobile Number, and Password.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanMail)) {
      showAlert('Invalid Email / अवैध ईमेल', 'Please enter a valid email address.');
      return;
    }

    if (!/^\d{10,15}$/.test(cleanPhone)) {
      showAlert('Invalid Mobile / अवैध मोबाईल', 'Please enter a valid 10-15 digit mobile number.');
      return;
    }

    if (password.length < 6) {
      showAlert('Weak Password / पासवर्ड कमी आहे', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await sendOTP(cleanUser, cleanMail, cleanPhone, password);
    setLoading(false);

    if (result.success) {
      showAlert('Verification Code Sent', `A 6-digit verification code has been sent to ${cleanMail}.`);
      navigation.navigate('OTP', {
        email: cleanMail,
        username: cleanUser,
        phone: cleanPhone,
        password,
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
            }
          }
        }
        setGoogleLoading(false);
      }
    } catch (err) {
      console.log('Google Sign-In error:', err);
      setGoogleLoading(false);
      showAlert('Error', 'Google Sign-In was cancelled or failed.');
    }
  };

  const hasEnglishLetters = /[a-zA-Z]/.test(username);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.appHeading}>संत समागम | Sant Samagam</Text>

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
            <Text style={styles.dividerText}>OR / किंवा</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name in Marathi / English */}
            <View>
              <View style={[styles.inputGroup, focusedField === 'username' && styles.inputGroupFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="पूर्ण नाव (Full Name in Marathi or English)"
                  placeholderTextColor="#64748b"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {hasEnglishLetters ? (
                <TouchableOpacity
                  style={styles.translitBtn}
                  onPress={handleTransliterateName}
                  activeOpacity={0.7}
                >
                  <Text style={styles.translitBtnText}>⚡ A → अ मराठीत रुपांतर करा (Convert to Marathi)</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Email */}
            <View style={[styles.inputGroup, focusedField === 'email' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="ईमेल (Email Address)"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Mobile Number */}
            <View style={[styles.inputGroup, focusedField === 'phone' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="मोबाईल नंबर (Mobile Number: 9822... / ९८२२...)"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputGroup, focusedField === 'password' && styles.inputGroupFocused]}>
              <TextInput
                style={styles.input}
                placeholder="पासवर्ड (Password - min 6 chars)"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Subtle Terms Notice */}
            <View style={styles.termsNoticeBox}>
              <Text style={styles.termsNoticeText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsNoticeLink} onPress={() => navigation.navigate('PrivacyPolicy')}>
                  Privacy Policy
                </Text>
                {' '}and{' '}
                <Text style={styles.termsNoticeLink} onPress={() => navigation.navigate('Terms')}>
                  Terms of Service
                </Text>
                .
              </Text>
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
                <Text style={styles.buttonText}>साइन अप करा (Sign Up)</Text>
              )}
            </TouchableOpacity>

            {/* Switch to Log In */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>खाते आधीच आहे का? (Already have an account?) </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>लॉग इन करा (Log In)</Text>
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
    fontSize: 28,
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
    borderColor: '#ff6b00',
  },
  input: {
    fontSize: 15,
    color: '#ffffff',
    paddingVertical: 12,
  },
  translitBtn: {
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderColor: '#ff6b00',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  translitBtnText: {
    color: '#ffaa00',
    fontSize: 12,
    fontWeight: '700',
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
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  footerLink: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: '700',
  },
  termsNoticeBox: {
    marginVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  termsNoticeText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsNoticeLink: {
    color: '#ff6b00',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
