const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workshopSchema = new mongoose.Schema({
  workshop_id: {
    type: String,
    default: () => `WS-${uuidv4().split('-')[0].toUpperCase()}`,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Workshop title is required'],
    trim: true
  },
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
  end_time: { type: String, required: true },
  min_duration_minutes: { type: Number, required: true, default: 60 },
  random_check_enabled: { type: Boolean, default: false },
  qr_seed: { type: String, default: () => uuidv4() },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'locked'],
    default: 'upcoming'
  },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  total_registered: { type: Number, default: 0 }
}, { timestamps: true });

// backward compat virtual — if old docs have speaker string
workshopSchema.virtual('speaker').get(function () {
  return this.speakers ? this.speakers.join(', ') : '';
});

module.exports = mongoose.model('Workshop', workshopSchema);