const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const { generateOTP } = require('../services/otpService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Helper to convert Devanagari numerals (०-९) to standard English numbers/strings
function cleanDigits(val) {
  if (val == null) return val;
  const str = String(val);
  const devanagariDigits = ['\u0966', '\u0967', '\u0968', '\u0969', '\u096A', '\u096B', '\u096C', '\u096D', '\u096E', '\u096F'];
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const idx = devanagariDigits.indexOf(char);
    if (idx !== -1) {
      result += String(idx);
    } else {
      result += char;
    }
  }
  return result;
}

// In-memory store for pending email registrations (email -> { username, email, phone, password, otp, expiresAt })
const pendingRegistrations = new Map();

// ═══════════════════════════════════════════════════════
// POST /api/auth/seed-admin — Seed Default Admin Account
// ═══════════════════════════════════════════════════════
router.post('/seed-admin', async (req, res) => {
  try {
    const cleanEmail = 'admin@attendance.com';
    let admin = await User.findOne({ email: cleanEmail });
    if (!admin) {
      admin = new User({
        username: 'System Admin',
        name: 'System Admin',
        email: cleanEmail,
        phone: '9999999999',
        password_hash: 'admin123',
        role: 'Admin',
        is_email_verified: true,
        is_manual_entry: false,
      });
      await admin.save();
    } else {
      admin.password_hash = 'admin123';
      admin.role = 'Admin';
      admin.is_email_verified = true;
      await admin.save();
    }
    res.json({ success: true, message: '👑 Admin account seeded/reset (admin@attendance.com / admin123)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/send-otp — Request Email Verification OTP
// ═══════════════════════════════════════════════════════
router.post('/send-otp', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const cleanPhone = cleanDigits(phone || '').trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.is_email_verified) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingRegistrations.set(cleanEmail, {
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      otp,
      expiresAt,
    });

    const mailRes = await sendVerificationEmail(cleanEmail, cleanUsername, otp);
    if (!mailRes || !mailRes.success) {
      return res.status(500).json({
        success: false,
        message: `Email delivery error: ${mailRes?.error || 'Failed to send email via SMTP'}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/verify-otp — Verify Code & Complete Registration
// ═══════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, username: bodyUsername, phone: bodyPhone, password: bodyPassword } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and verification code are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingRegistrations.get(cleanEmail);

    const isValidStored = pending && pending.otp === otp && Date.now() < pending.expiresAt;

    if (!isValidStored) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    const username = pending ? pending.username : (bodyUsername || cleanEmail.split('@')[0]);
    const phone = cleanDigits(pending ? pending.phone : (bodyPhone || '')).trim();
    const password = pending ? pending.password : bodyPassword;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required to complete verification.',
      });
    }

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = new User({
        username,
        name: username,
        email: cleanEmail,
        phone,
        password_hash: password,
        role: 'User',
        is_email_verified: true,
        is_manual_entry: false,
      });
      await user.save();
    } else {
      user.is_email_verified = true;
      user.password_hash = password;
      if (phone) user.phone = phone;
      await user.save();
    }

    pendingRegistrations.delete(cleanEmail);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully!',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying code.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/register — Direct Registration
// ═══════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Username, email address, mobile number, and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const cleanPhone = cleanDigits(phone).trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = new User({
      username: cleanUsername,
      name: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      password_hash: password,
      role: 'User',
      is_email_verified: true,
      is_manual_entry: false,
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/login — Login with Email + Password
// ═══════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail }).select('+password_hash');

    // Auto-create default admin account if it does not exist yet in MongoDB
    if (!user && cleanEmail === 'admin@attendance.com') {
      const admin = new User({
        username: 'System Admin',
        name: 'System Admin',
        email: 'admin@attendance.com',
        phone: '9999999999',
        password_hash: 'admin123',
        role: 'Admin',
        is_email_verified: true,
        is_manual_entry: false,
      });
      await admin.save();
      user = await User.findOne({ email: cleanEmail }).select('+password_hash');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (user.is_manual_entry) {
      return res.status(403).json({
        success: false,
        message: 'This account is managed by an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/forgot-password — Request Password Reset Email
// ═══════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If that email exists in our records, a reset code has been sent.',
      });
    }

    const resetCode = generateOTP();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(cleanEmail, '', resetCode, user.username || user.name);

    res.status(200).json({
      success: true,
      message: 'If that email exists in our records, a reset code has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error requesting password reset.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/reset-password — Reset Password with Code
// ═══════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: code.trim(),
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset code.',
      });
    }

    user.password_hash = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/google — Direct Google Sign-In
// ═══════════════════════════════════════════════════════
router.post('/google', async (req, res) => {
  try {
    let { googleId, email, username, name, phone, idToken } = req.body;

    if (idToken) {
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const { OAuth2Client } = require('google-auth-library');
          const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          googleId = payload.sub;
          email = payload.email;
          name = payload.name;
          username = payload.name || payload.email.split('@')[0];
        }
      } catch (err) {
        console.error('Google token verification error:', err.message);
      }

      // Fallback: decode JWT payload directly if verifyIdToken fails or audience differs
      if (!email) {
        try {
          const base64Payload = idToken.split('.')[1];
          if (base64Payload) {
            const payloadBuffer = Buffer.from(base64Payload, 'base64');
            const payload = JSON.parse(payloadBuffer.toString('utf-8'));
            if (payload && payload.email) {
              googleId = payload.sub || `google_${Date.now()}`;
              email = payload.email;
              name = payload.name || payload.email.split('@')[0];
              username = name;
            }
          }
        } catch (jwtErr) {
          console.error('JWT fallback decode error:', jwtErr.message);
        }
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google email is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username || name || cleanEmail.split('@')[0];
    const gid = googleId || `google_${Date.now()}`;

    const query = [{ email: cleanEmail }];
    if (googleId) query.push({ google_id: googleId });

    let user = await User.findOne({ $or: query });

    if (!user) {
      user = new User({
        username: cleanUsername,
        name: cleanUsername,
        email: cleanEmail,
        phone: cleanDigits(phone || '').trim(),
        google_id: gid,
        role: 'User',
        is_email_verified: true,
        is_manual_entry: false,
      });
      await user.save();
    } else {
      if (!user.google_id && googleId) {
        user.google_id = googleId;
        user.is_email_verified = true;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Google Sign-In successful!',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Google Sign-In error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google Sign-In.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// PUT /api/auth/profile — Update Profile (Name, Phone, Age)
// ═══════════════════════════════════════════════════════
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, name, phone, age } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (username) user.username = username.trim();
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = cleanDigits(phone).trim();
    if (age !== undefined) {
      const cleanAge = cleanDigits(age);
      if (cleanAge === '' || cleanAge === null || cleanAge === undefined) {
        user.age = null;
      } else {
        const parsedNum = Number(cleanAge);
        user.age = isNaN(parsedNum) ? null : parsedNum;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/auth/account — Delete User Account
// ═══════════════════════════════════════════════════════
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);
    await Attendance.deleteMany({ user_id: userId });
    await Group.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Account permanently deleted from database.',
    });
  } catch (error) {
    console.error('Account delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/auth/me — Current Profile
// ═══════════════════════════════════════════════════════
router.get('/me', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toSafeJSON(),
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile.',
    });
  }
});

module.exports = router;
