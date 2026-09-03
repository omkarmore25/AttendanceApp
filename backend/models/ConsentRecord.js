const mongoose = require('mongoose');

/**
 * ConsentRecord Schema
 * Immutable audit trail for Data Principal consent under DPDP Act 2023 Section 6.
 */
const ConsentRecordSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // May be unauthenticated visitor/pre-registration
    },
    user_identifier: {
      type: String, // email, phone, or visitor session id
      required: false,
    },
    purposes: {
      essential_account: {
        type: Boolean,
        default: false,
        description: 'Account management, authentication, and core service operations',
      },
      location_attendance: {
        type: Boolean,
        default: false,
        description: 'Accessing GPS coordinates on-demand during event check-in to verify radius proximity',
      },
      japmala_community: {
        type: Boolean,
        default: false,
        description: 'Recording Japmala counts and displaying in aggregate community standings',
      },
      communications: {
        type: Boolean,
        default: false,
        description: 'Receiving spiritual samagam announcements and event alerts',
      },
      analytics_performance: {
        type: Boolean,
        default: false,
        description: 'Non-essential anonymous performance & error tracking',
      },
    },
    age_confirmed: {
      type: Boolean,
      default: false,
      description: 'Confirmed user is 18+ or has verifiable parental consent (DPDP Sec 9)',
    },
    notice_version: {
      type: String,
      default: 'v1.0.0-2026-09',
    },
    ip_address: {
      type: String,
      default: '',
    },
    user_agent: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['Registration', 'ProfileUpdate', 'WebBanner', 'AdminEntry'],
      default: 'Registration',
    },
    status: {
      type: String,
      enum: ['Active', 'Withdrawn', 'Updated'],
      default: 'Active',
    },
    withdrawn_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ConsentRecordSchema.index({ user_id: 1, createdAt: -1 });
ConsentRecordSchema.index({ user_identifier: 1 });

module.exports = mongoose.model('ConsentRecord', ConsentRecordSchema);
