const express = require('express');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// ═══════════════════════════════════════════════════════
// POST /api/events — Create a new event (Admin only)
// ═══════════════════════════════════════════════════════
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, scheduled_date, start_time, latitude, longitude, radius_in_meters } = req.body;

    // Validation
    if (!name || !scheduled_date || !start_time || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'name, scheduled_date, start_time, latitude, and longitude are all required.',
      });
    }

    let parseDate = scheduled_date;
    if (typeof scheduled_date === 'string') {
      const cleanD = scheduled_date.replace(/\//g, '-');
      if (/^\d{2}-\d{2}-\d{4}$/.test(cleanD)) {
        const [d, m, y] = cleanD.split('-');
        parseDate = `${y}-${m}-${d}`;
      }
    }

    const event = new Event({
      name,
      scheduled_date: new Date(parseDate),
      start_time,
      latitude,
      longitude,
      radius_in_meters: radius_in_meters || parseInt(process.env.GEOFENCE_RADIUS) || 50,
      status: 'Upcoming',
      created_by: req.user._id,
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Event creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating event.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/events — List events (with optional status filter)
// ═══════════════════════════════════════════════════════
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter
    const filter = {};
    if (status && ['Upcoming', 'Active', 'Completed'].includes(status)) {
      filter.status = status;
    }

    const events = await Event.find(filter)
      .sort({ scheduled_date: 1, start_time: 1 })
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/events/:id — Get single event by ID
// ═══════════════════════════════════════════════════════
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('created_by', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    console.error('Event fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/events/:id/status — Update event status (Admin only)
// ═══════════════════════════════════════════════════════
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Upcoming', 'Active', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Upcoming, Active, Completed.',
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: `Event status updated to "${status}".`,
      event,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating event status.',
    });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/events/:id — Delete event (Admin only)
// ═══════════════════════════════════════════════════════
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Delete event document
    await Event.findByIdAndDelete(req.params.id);

    // Delete all attendance records associated with this event
    await Attendance.deleteMany({ event_id: req.params.id });

    res.status(200).json({
      success: true,
      message: `Event "${event.name}" and all associated attendance records deleted successfully.`,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    console.error('Event delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event.',
    });
  }
});

module.exports = router;
