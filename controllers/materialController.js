const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');
const axios = require('axios');

// ─── GET ALL MATERIALS (with filters) ───────────────────────
const getMaterials = async (req, res) => {
  try {
    const { level, course, category, search } = req.query;

    let filter = {};

    // Filter by student's level if no level specified
    if (level) filter.level = Number(level);
    if (course) filter.course = course.toUpperCase();
    if (category) filter.category = category;

    // Search by title, courseName or tags
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { course: { $regex: search, $options: 'i' } }
      ];
    }

    const materials = await Material.find(filter)
      .sort({ createdAt: -1 });

    res.json({ count: materials.length, materials });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET SINGLE MATERIAL ─────────────────────────────────────
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Log that this student viewed this material
    await ActivityLog.create({
      studentId: req.student._id,
      materialId: material._id,
      action: 'viewed'
    });

    res.json({ material });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET RECOMMENDED MATERIALS FOR STUDENT ───────────────────
const getRecommendedMaterials = async (req, res) => {
  try {
    const student = req.student;

    // Get student's weak topics from latest quiz attempt
    const QuizAttempt = require('../models/QuizAttempt');
    const latestAttempt = await QuizAttempt.findOne({
      studentId: student._id
    }).sort({ createdAt: -1 });

    const weakTopics = latestAttempt ? latestAttempt.weakTopics : [];

    // Get all materials from database
    const allMaterials = await Material.find().lean();

    if (allMaterials.length === 0) {
      return res.json({ 
        count: 0, 
        materials: [],
        message: 'No materials available yet'
      });
    }

    // Format materials for Python service
    const formattedMaterials = allMaterials.map(m => ({
      id: m._id.toString(),
      title: m.title,
      courseName: m.courseName,
      course: m.course,
      description: m.description || '',
      category: m.category,
      level: m.level,
      department: m.department,
      tags: m.tags || []
    }));

    // Call Python recommendation service
    const response = await axios.post('http://localhost:8000/recommend', {
      student: {
        level: student.level,
        department: student.department,
        weakTopics: weakTopics
      },
      materials: formattedMaterials,
      top_n: 10
    });

    res.json({
      message: `Smart recommendations for ${student.fullName}`,
      weakTopics,
      count: response.data.count,
      materials: response.data.recommendations
    });

  } catch (error) {
    // Fallback to simple level-based filter if Python service is down
    const materials = await Material.find({ 
      level: req.student.level 
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      message: 'Basic recommendations (AI service unavailable)',
      count: materials.length,
      materials
    });
  }
};

// ─── LOG DOWNLOAD ─────────────────────────────────────────────
const logDownload = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    await ActivityLog.create({
      studentId: req.student._id,
      materialId: material._id,
      action: 'downloaded'
    });

    res.json({ 
      message: 'Download logged',
      fileUrl: material.fileUrl 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  getMaterials, 
  getMaterialById, 
  getRecommendedMaterials,
  logDownload
};