const express = require('express');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const haversineDistance = require('../utils/haversine');

const router = express.Router();

// ═══════════════════════════════════════════════════════
// POST /api/attendance/mark — Mark attendance (Geofence-verified)
// ═══════════════════════════════════════════════════════
//
// Flow:
// 1. User taps "Mark Attendance" on their phone
// 2. React Native app gets GPS coordinates via expo-location
// 3. App sends { eventId, latitude, longitude } to this endpoint
// 4. Backend calculates Haversine distance
// 5. If within geofence radius → attendance recorded
// 6. If outside → 403 rejected
//
router.post('/mark', auth, async (req, res) => {
  try {
    const { eventId, latitude, longitude } = req.body;

    // ─── Validation ───
    if (!eventId || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'eventId, latitude, and longitude are required.',
      });
    }

    // ─── Find the event ───
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // ─── Check event is active ───
    if (event.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark attendance. Event status is "${event.status}". It must be "Active".`,
      });
    }

    // ─── Calculate distance using Haversine formula ───
    const distanceInMeters = haversineDistance(
      latitude,
      longitude,
      event.latitude,
      event.longitude
    );

    const geofenceRadius = event.radius_in_meters || parseInt(process.env.GEOFENCE_RADIUS) || 50;

    // ─── Geofence check ───
    if (distanceInMeters > geofenceRadius) {
      return res.status(403).json({
        success: false,
        message: `You are ${Math.round(distanceInMeters)}m away from the event. You must be within ${geofenceRadius}m to mark attendance.`,
        distance: Math.round(distanceInMeters),
        required_radius: geofenceRadius,
      });
    }

    // ─── Check for duplicate attendance ───
    const existing = await Attendance.findOne({
      event_id: eventId,
      user_id: req.user._id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already marked attendance for this event.',
      });
    }

    // ─── Record attendance ───
    const attendance = new Attendance({
      event_id: eventId,
      user_id: req.user._id,
      marked_by: 'Self',
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: `✅ Attendance marked! You were ${Math.round(distanceInMeters)}m from the event.`,
      attendance,
      distance: Math.round(distanceInMeters),
    });
  } catch (error) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already marked attendance for this event.',
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    console.error('Attendance marking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking attendance.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/attendance/event/:eventId — Get attendance list (Admin)
// ═══════════════════════════════════════════════════════
router.get('/event/:eventId', auth, adminOnly, async (req, res) => {
  try {
    const records = await Attendance.find({ event_id: req.params.eventId })
      .populate('user_id', 'name phone is_manual_entry')
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      attendance: records,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    console.error('Attendance fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attendance.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/attendance/my — Get current user's attendance history
// ═══════════════════════════════════════════════════════
router.get('/my', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ user_id: req.user._id })
      .populate('event_id', 'name scheduled_date start_time status')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      attendance: records,
    });
  } catch (error) {
    console.error('My attendance fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your attendance.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/attendance/export-doc/:eventId — Export Word Doc (.doc)
// ═══════════════════════════════════════════════════════
router.get('/export-doc/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).send('Event not found.');
    }

    const records = await Attendance.find({ event_id: eventId })
      .populate('user_id', 'name username phone email')
      .sort({ timestamp: 1 });

    const reportTitle = `Sant_Samagam_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance`;

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${event.name} — Attendance Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #ffffff; }
          .header { text-align: center; border-bottom: 3px solid #ff6b00; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #ff6b00; margin: 0; }
          .subtitle { font-size: 16px; color: #64748b; margin-top: 4px; }
          .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
          .info-row { font-size: 14px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #ff6b00; color: #ffffff; font-size: 13px; font-weight: bold; padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
          td { font-size: 13px; padding: 9px 10px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge-self { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .badge-admin { background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🚩 जय सच्चिदानंद — Sant Samagam</div>
          <div class="subtitle">Official Attendance Roster Report</div>
        </div>

        <div class="info-card">
          <div class="info-row"><b>Event Name / Venue:</b> ${event.name}</div>
          <div class="info-row"><b>Total Present Attendees:</b> ${records.length} Users</div>
          <div class="info-row"><b>Report Generated Date:</b> ${new Date().toLocaleString('en-IN')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Attendee Name</th>
              <th>Mobile Number</th>
              <th>Verification Mode</th>
              <th>Attendance Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((item, index) => `
              <tr>
                <td><b>${index + 1}</b></td>
                <td><b>${item.user_id?.name || item.user_id?.username || 'Unknown'}</b></td>
                <td>${item.user_id?.phone || '—'}</td>
                <td>
                  <span class="${item.marked_by === 'Self' ? 'badge-self' : 'badge-admin'}">
                    ${item.marked_by === 'Self' ? '📍 GPS Verified' : '👤 Admin Marked'}
                  </span>
                </td>
                <td>${new Date(item.timestamp).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by Sant Samagam Attendance System
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportTitle}.doc"`);
    return res.status(200).send(docHtml);
  } catch (err) {
    console.error('Doc export error:', err);
    res.status(500).send('Error generating document.');
  }
});

module.exports = router;
