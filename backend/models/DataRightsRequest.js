const mongoose = require('mongoose');

/**
 * DataRightsRequest Schema
 * Tracks requests by Data Principals exercising statutory rights under DPDP Act 2023:
 * - Right to Access Information (Section 11)
 * - Right to Correction & Erasure (Section 12)
 * - Right to Grievance Redressal (Section 13)
 * - Right to Nominate (Section 14)
 * - Right to Withdraw Consent (Section 6(4))
 */
const DataRightsRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    request_type: {
      type: String,
      enum: ['Access', 'Correction', 'Erasure', 'WithdrawConsent', 'Nomination', 'Grievance'],
      required: true,
    },
    requester_name: {
      type: String,
      required: true,
      trim: true,
    },
    requester_email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    requester_phone: {
      type: String,
      trim: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    nominee_details: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      contact: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['Pending', 'InReview', 'Fulfilled', 'Rejected'],
      default: 'Pending',
    },
    admin_response: {
      type: String,
      default: '',
    },
    resolved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolved_at: {
      type: Date,
      default: null,
    },
    target_sla_days: {
      type: Number,
      default: 30, // DPDP prescribed timeframe
    },
  },
  {
    timestamps: true,
  }
);

DataRightsRequestSchema.index({ user_id: 1 });
DataRightsRequestSchema.index({ status: 1 });
DataRightsRequestSchema.index({ requester_email: 1 });

module.exports = mongoose.model('DataRightsRequest', DataRightsRequestSchema);
