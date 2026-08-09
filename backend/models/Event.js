const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    scheduled_date: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    start_time: {
      type: String,
      required: [true, 'Start time is required'],
      // Stored as "HH:MM" (24-hour format) for display flexibility
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:MM format'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    radius_in_meters: {
      type: Number,
      default: 50,
      min: [10, 'Radius must be at least 10 meters'],
      max: [5000, 'Radius cannot exceed 5000 meters'],
    },
    status: {
      type: String,
      enum: {
        values: ['Upcoming', 'Active', 'Completed'],
        message: 'Status must be Upcoming, Active, or Completed',
      },
      default: 'Upcoming',
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes for efficient querying ───
eventSchema.index({ scheduled_date: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ status: 1, scheduled_date: 1 });

module.exports = mongoose.model('Event', eventSchema);
