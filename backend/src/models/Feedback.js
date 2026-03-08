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
  ratings: [
    {
      question: { type: String, required: true },
      score: { type: Number, min: 1, max: 5, required: true }
    }
  ],
  overall_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    trim: true,
    default: ''
  },
  suggestions: {
    type: String,
    trim: true,
    default: ''
  },
  submitted_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent multiple feedback submissions
feedbackSchema.index({ student_id: 1, workshop_id: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);