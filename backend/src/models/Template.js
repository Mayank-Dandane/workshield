const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['certificate', 'feedback', 'attendance', 'report'],
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  is_active: {
    type: Boolean,
    default: true   // only one active template per type at a time
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);