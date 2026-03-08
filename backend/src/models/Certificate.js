const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificate_id: {
    type: String,
    required: true,
    unique: true   // e.g. "CERT-A1B2C3D4"
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  workshop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  issue_date: {
    type: Date,
    default: Date.now
  },
  verification_hash: {
    type: String,
    required: true,
    unique: true
  },
  file_path: {
    type: String,   // path to generated PDF
    default: ''
  },
  is_valid: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// One certificate per student per workshop
certificateSchema.index({ student_id: 1, workshop_id: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);