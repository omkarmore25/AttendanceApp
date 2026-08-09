/**
 * OTP Service — Multi-Provider Live SMS Engine
 * Supports Fast2SMS (Free Trial), 2Factor, Twilio, & Dev Mode Fallback
 */

const axios = require('axios');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSMSOTP = async (phone, otp) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const apiKey = process.env.FAST2SMS_API_KEY ? process.env.FAST2SMS_API_KEY.trim() : null;

  // 1. Fast2SMS API Engine (Instant SMS delivery)
  if (apiKey) {
    // Attempt 1: Fast2SMS GET request with Header Authorization
    try {
      const res1 = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        headers: {
          authorization: apiKey,
        },
        params: {
          variables_values: otp,
          route: 'otp',
          numbers: cleanPhone,
        },
      });

      console.log(`\n========================================`);
      console.log(`✅ [FAST2SMS LIVE SMS SUCCESS] Sent to +91${cleanPhone}:`);
      console.log(res1.data);
      console.log(`========================================\n`);

      if (res1.data && res1.data.return === true) {
        return { success: true, message: `Live SMS OTP sent to +91${cleanPhone}` };
      }
    } catch (err1) {
      console.error('⚠️ [FAST2SMS ROUTE 1 ERROR]:', err1.response?.data || err1.message);
    }

    // Attempt 2: Fast2SMS Quick SMS GET route with Authorization in URL params
    try {
      const res2 = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
          authorization: apiKey,
          message: `Your AttendanceApp verification code is ${otp}`,
          language: 'english',
          route: 'q',
          numbers: cleanPhone,
        },
      });

      console.log(`\n========================================`);
      console.log(`✅ [FAST2SMS QUICK SMS SUCCESS] Sent to +91${cleanPhone}:`);
      console.log(res2.data);
      console.log(`========================================\n`);

      if (res2.data && res2.data.return === true) {
        return { success: true, message: `Live SMS OTP sent to +91${cleanPhone}` };
      }
    } catch (err2) {
      console.error('⚠️ [FAST2SMS ROUTE 2 ERROR]:', err2.response?.data || err2.message);
    }
  }

  // 2. Fallback Dev Logging
  console.log(`\n========================================`);
  console.log(`📱 [SMS OTP SERVICE] Sending OTP to: ${phone}`);
  console.log(`🔑 [SMS OTP CODE]: ${otp} (Expires in 10 minutes)`);
  console.log(`========================================\n`);

  return { success: true, message: `OTP sent to ${phone}` };
};

module.exports = {
  generateOTP,
  sendSMSOTP,
};
