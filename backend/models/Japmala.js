const mongoose = require('mongoose');

const japmalaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    entryType: {
      type: String,
      enum: ['daily', 'range'],
      default: 'daily',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    toDate: {
      type: Date,
      default: null,
    },
    count: {
      type: Number,
      required: [true, 'Mala count is required'],
      min: [0, 'Count cannot be negative'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast query by user and date
japmalaSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Japmala', japmalaSchema);
