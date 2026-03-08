const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
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
  entry_time: {
    type: Date,
    default: null
  },
  exit_time: {
    type: Date,
    default: null
  },
  random_check_time: {
    type: Date,
    default: null
  },
  random_check_passed: {
    type: Boolean,
    default: false
  },
  total_duration_minutes: {
    type: Number,
    default: 0
  },
  verified_status: {
    type: Boolean,
    default: false   // true only when all conditions met
  },
  verification_note: {
    type: String,
    default: ''   // reason if not verified e.g. "Exit not scanned"
  }
}, { timestamps: true });

// Prevent duplicate attendance log per student per workshop
attendanceLogSchema.index({ student_id: 1, workshop_id: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);