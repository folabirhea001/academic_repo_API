const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
  type: String,
  enum: ['pdf', 'docx', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'other'],
  default: 'pdf'
  },
  category: {
    type: String,
    required: true,
    enum: ['past_question', 'lecture_note', 'textbook', 'other']
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    enum: [100, 200, 300, 400, 500]
  },
  department: {
    type: String,
    required: true,
    default: 'Information Technology'
  },
  tags: [{
    type: String,
    trim: true
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);