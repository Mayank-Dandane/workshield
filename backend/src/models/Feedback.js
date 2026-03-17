const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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

  // ── 10 rated questions (1-5) ─────────────────────────────────
  ratings: [{
    question: { type: String, required: true },
    score:    { type: Number, min: 1, max: 5, required: true }
  }],

  // ── Q21: Checkboxes ──────────────────────────────────────────
  helped_in: [{
    type: String,
    enum: [
      'Improving technical knowledge',
      'Understanding industry expectations',
      'Enhancing soft skills / personality',
      'Career guidance / higher studies preparation',
      'Stress management / mental well-being',
      'Ethical / value-based learning',
      'Competitive exam preparation'
    ]
  }],

  // ── Q22: Recommend ───────────────────────────────────────────
  recommend: {
    type: String,
    enum: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree'],
    required: true
  },

  // ── Open-ended ───────────────────────────────────────────────
  liked_most:           { type: String, default: '' },  // Q25
  suggestions:          { type: String, default: '' },  // Q26
  additional_comments:  { type: String, default: '' },  // Q27

  // ── Computed ─────────────────────────────────────────────────
  overall_rating: { type: Number },
  submitted_at:   { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-compute overall_rating from ratings array
feedbackSchema.pre('save', function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
    this.overall_rating = Math.round((sum / this.ratings.length) * 10) / 10;
  }
  next();
});

// One feedback per student per workshop
feedbackSchema.index({ student_id: 1, workshop_id: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);