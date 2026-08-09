import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { showAlert } from '../utils/dialog';
import GoogleIcon from '../components/GoogleIcon';

const GOOGLE_CLIENT_ID = '630044773737-2cellkr3ttout8d0jvdln10bl0k8qfpo.apps.googleusercontent.com';

const LoginScreen = ({ navigation }) => {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Load Google Identity Services script on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!document.getElementById('google-jssdk')) {
        const script = document.createElement('script');
        script.id = 'google-jssdk';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      showAlert('Login Failed', result.message);
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
            showAlert(
              'Google Origin Setup Required',
              'To enable official Google One Tap on your live domain, add https://attendance-app-one-umber.vercel.app to Authorized Origins in Google Cloud Console.\n\nAlternatively, please sign up or log in using Email & Password.'
            );
            setGoogleLoading(false);
          }
        });
      } else {
        showAlert('Google Sign-In', 'Please log in with Email & Password or configure Google OAuth.');
        setGoogleLoading(false);
      }
    } catch (error) {
      showAlert('Error', 'Google Sign-In failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Title Above Card */}
        <Text style={styles.appHeading}>जय सच्चिदानंद 🚩</Text>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Continue with Google Button */}
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

            {/* Log In Button (Vibrant Orange) */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Switch to Sign Up */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
});

export default LoginScreen;
