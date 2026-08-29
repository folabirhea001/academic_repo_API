const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  action: {
    type: String,
    enum: ['viewed', 'downloaded'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);