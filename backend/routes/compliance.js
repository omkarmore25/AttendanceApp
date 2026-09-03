const express = require('express');
const ConsentRecord = require('../models/ConsentRecord');
const DataRightsRequest = require('../models/DataRightsRequest');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Japmala = require('../models/Japmala');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// ═══════════════════════════════════════════════════════
// PUBLIC GRIEVANCE & NOTICE CONFIG
// ═══════════════════════════════════════════════════════
const GRIEVANCE_DETAILS = {
  officer_name: 'Shri Grievance Officer',
  designation: 'Data Protection & Grievance Redressal Officer',
  organization: 'Sant Samagam Trust / AttendanceApp Administration',
  email: 'privacy@santsamagam.org',
  phone: '+91 98765 43210',
  address: 'Samagam Bhavan, Spiritual Center Road, North Goa - 403506, India',
  sla_days: 30,
  notice_version: 'v1.0.0-2026-09',
  effective_date: '03 September 2026',
};

// ═══════════════════════════════════════════════════════
// GET /api/compliance/grievance-info — Public Grievance Info
// ═══════════════════════════════════════════════════════
router.get('/grievance-info', (req, res) => {
  res.status(200).json({
    success: true,
    grievance: GRIEVANCE_DETAILS,
  });
});

// ═══════════════════════════════════════════════════════
// POST /api/compliance/consent — Record/Update Consent
// ═══════════════════════════════════════════════════════
router.post('/consent', async (req, res) => {
  try {
    const {
      user_id,
      user_identifier,
      purposes,
      age_confirmed,
      notice_version,
      source,
    } = req.body;

    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const user_agent = req.headers['user-agent'] || '';

    // If an existing active consent exists for this user, mark it as Updated
    if (user_id) {
      await ConsentRecord.updateMany(
        { user_id, status: 'Active' },
        { status: 'Updated' }
      );
    } else if (user_identifier) {
      await ConsentRecord.updateMany(
        { user_identifier, status: 'Active' },
        { status: 'Updated' }
      );
    }

    const consent = new ConsentRecord({
      user_id: user_id || null,
      user_identifier: user_identifier || '',
      purposes: {
        essential_account: purposes?.essential_account ?? true,
        location_attendance: purposes?.location_attendance ?? false,
        japmala_community: purposes?.japmala_community ?? false,
        communications: purposes?.communications ?? false,
        analytics_performance: purposes?.analytics_performance ?? false,
      },
      age_confirmed: !!age_confirmed,
      notice_version: notice_version || GRIEVANCE_DETAILS.notice_version,
      ip_address,
      user_agent,
      source: source || 'WebBanner',
      status: 'Active',
    });

    await consent.save();

    res.status(201).json({
      success: true,
      message: 'Consent preferences recorded successfully.',
      consent,
    });
  } catch (error) {
    console.error('Consent recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record consent.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/compliance/consent — Get User Consent Trail (Auth required)
// ═══════════════════════════════════════════════════════
router.get('/consent', auth, async (req, res) => {
  try {
    const consents = await ConsentRecord.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const activeConsent = consents.find((c) => c.status === 'Active') || consents[0] || null;

    res.status(200).json({
      success: true,
      activeConsent,
      history: consents,
    });
  } catch (error) {
    console.error('Consent fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve consent records.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/compliance/data-rights — Submit Data Rights / Grievance Request
// ═══════════════════════════════════════════════════════
router.post('/data-rights', async (req, res) => {
  try {
    const {
      request_type,
      requester_name,
      requester_email,
      requester_phone,
      details,
      nominee_details,
    } = req.body;

    if (!request_type || !requester_name || !details) {
      return res.status(400).json({
        success: false,
        message: 'request_type, requester_name, and details are required.',
      });
    }

    let userId = null;
    // Check if authorization token was passed optionally
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Continue as unauthenticated rights request
      }
    }

    const rightsRequest = new DataRightsRequest({
      user_id: userId,
      request_type,
      requester_name: requester_name.trim(),
      requester_email: requester_email ? requester_email.trim().toLowerCase() : '',
      requester_phone: requester_phone ? requester_phone.trim() : '',
      details: details.trim(),
      nominee_details: nominee_details || {},
      status: 'Pending',
      target_sla_days: GRIEVANCE_DETAILS.sla_days,
    });

    await rightsRequest.save();

    res.status(201).json({
      success: true,
      message: `Your ${request_type} request has been recorded (Reference ID: ${rightsRequest._id}). The Grievance Officer will review within ${GRIEVANCE_DETAILS.sla_days} days.`,
      reference_id: rightsRequest._id,
      request: rightsRequest,
    });
  } catch (error) {
    console.error('Data rights request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit data rights request.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/compliance/my-data — Section 11 Data Portability Dump (Auth required)
// ═══════════════════════════════════════════════════════
router.get('/my-data', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. User Profile Data (excluding sensitive password hash)
    const user = await User.findById(userId).select('-password');

    // 2. Attendance History
    const attendanceRecords = await Attendance.find({ user_id: userId })
      .populate('event_id', 'name scheduled_date start_time status')
      .sort({ createdAt: -1 });

    // 3. Japmala Spiritual Records
    const japmalaRecords = await Japmala.find({ user_id: userId })
      .sort({ date: -1 });

    // 4. Consent Audit Trail
    const consentRecords = await ConsentRecord.find({ user_id: userId })
      .sort({ createdAt: -1 });

    // 5. Active Rights Requests
    const rightsRequests = await DataRightsRequest.find({ user_id: userId })
      .sort({ createdAt: -1 });

    const exportPayload = {
      export_metadata: {
        system: 'Sant Samagam Devotee Attendance & Japmala System',
        generated_at: new Date().toISOString(),
        data_principal_id: userId,
        statutory_basis: 'DPDP Act 2023 Section 11 (Right to Access Information)',
        grievance_contact: GRIEVANCE_DETAILS.email,
      },
      profile: user,
      attendance: {
        total_records: attendanceRecords.length,
        records: attendanceRecords,
      },
      japmala: {
        total_records: japmalaRecords.length,
        total_count: japmalaRecords.reduce((sum, r) => sum + (r.count || 0), 0),
        records: japmalaRecords,
      },
      consents: consentRecords,
      rights_requests: rightsRequests,
    };

    res.status(200).json({
      success: true,
      data: exportPayload,
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personal data export.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/compliance/admin/requests — List Rights Requests (Admin only)
// ═══════════════════════════════════════════════════════
router.get('/admin/requests', auth, adminOnly, async (req, res) => {
  try {
    const requests = await DataRightsRequest.find()
      .populate('user_id', 'name username phone email')
      .populate('resolved_by', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rights requests.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/compliance/admin/requests/:id — Resolve Request (Admin only)
// ═══════════════════════════════════════════════════════
router.patch('/admin/requests/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    const request = await DataRightsRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    if (status) request.status = status;
    if (admin_response !== undefined) request.admin_response = admin_response;
    if (status === 'Fulfilled' || status === 'Rejected') {
      request.resolved_at = new Date();
      request.resolved_by = req.user._id;
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request status updated.',
      request,
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request.',
    });
  }
});

module.exports = router;
