const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    marked_by: {
      type: String,
      enum: {
        values: ['Self', 'Admin'],
        message: 'marked_by must be either Self or Admin',
      },
      required: [true, 'marked_by field is required'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound unique index: Prevents duplicate attendance ───
// A user can only be marked present ONCE per event
attendanceSchema.index({ event_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
