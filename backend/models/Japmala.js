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

// Indexes for fast month/year/range queries
japmalaSchema.index({ user: 1, date: 1 });      // primary
japmalaSchema.index({ user: 1, toDate: 1 });     // range overlap
japmalaSchema.index({ user: 1, date: -1 });      // sort desc

module.exports = mongoose.model('Japmala', japmalaSchema);
