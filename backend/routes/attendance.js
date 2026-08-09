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

module.exports = router;
