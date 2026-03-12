const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Helper: derive academic year string from a date
// e.g. date in Jan-May 2026 → "2025-2026", date in Jun-Dec 2025 → "2025-2026"
function deriveAcademicYear(date) {
  const d = new Date(date);
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();
  // Academic year starts June (month 5)
  if (month >= 5) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// Map targeted_year enum → display labels used in the report
const YEAR_LABELS = {
  FY: { short: 'F. Y',  full: 'First Year B. Tech Students' },
  SY: { short: 'S. Y',  full: 'Second Year B. Tech Students' },
  TY: { short: 'T. Y',  full: 'Third Year B. Tech Students' },
  BY: { short: 'B. Y',  full: 'Fourth Year B. Tech Students' },
};

const workshopSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    default: () => `WS-${uuidv4().split('-')[0].toUpperCase()}`,
    unique: true
  },

  // ── Existing fields ───────────────────────────────────────────────────────
  topic: {
    type: String,
    required: true,
    trim: true
  },
  speakers: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'At least one speaker is required'
    }
  },
  date: {
    type: Date,
    required: true
  },
  start_time: { type: String, required: true },
  end_time:   { type: String, required: true },
  min_duration_minutes: { type: Number, required: true, default: 60 },
  random_check_enabled: { type: Boolean, default: false },
  qr_seed:    { type: String, default: () => uuidv4() },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'locked'],
    default: 'upcoming'
  },
  created_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  total_registered: { type: Number, default: 0 },

  // ── NEW: Report fields ────────────────────────────────────────────────────
  venue: {
    type: String,
    trim: true,
    default: ''
  },
  industry_name: {
    type: String,
    trim: true,
    default: ''
  },
  designation: {
    // Speaker's designation at their company
    type: String,
    trim: true,
    default: ''
  },
  targeted_year: {
    // Which year of students this workshop is for
    type: String,
    enum: ['FY', 'SY', 'TY', 'BY'],
    default: 'SY'
  },
  academic_year: {
    // Auto-derived from date, e.g. "2025-2026" — stored for report use
    type: String,
    default: ''
  },
  report_type: {
    // e.g. "Induction Program", "Expert Talk", "Guest Lecture"
    type: String,
    trim: true,
    default: 'Report on Industry Expert Session'
  },

}, { timestamps: true });

// ── Pre-save: auto-derive academic_year from date ─────────────────────────────
workshopSchema.pre('save', function (next) {
  if (this.date) {
    this.academic_year = deriveAcademicYear(this.date);
  }
  next();
});

// ── Virtual: human-readable year label for report letterhead ─────────────────
workshopSchema.virtual('year_label').get(function () {
  return YEAR_LABELS[this.targeted_year]?.short || 'S. Y';
});

// ── Virtual: full audience string for report field ────────────────────────────
workshopSchema.virtual('targeted_audience_label').get(function () {
  return YEAR_LABELS[this.targeted_year]?.full || 'B. Tech Students';
});

// ── Backward compat virtual ───────────────────────────────────────────────────
workshopSchema.virtual('speaker').get(function () {
  return this.speakers ? this.speakers.join(', ') : '';
});

// Export year labels too so the report generator can use them
workshopSchema.statics.YEAR_LABELS = YEAR_LABELS;

module.exports = mongoose.model('Workshop', workshopSchema);  