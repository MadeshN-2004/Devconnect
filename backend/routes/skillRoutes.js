// backend/routes/skillRoutes.js
import express from 'express';
import Skill from '../models/Skill.js';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id, userId } = req.params;
  
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid skill ID format' 
    });
  }
  
  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid user ID format' 
    });
  }
  
  next();
};

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @route   POST /api/skills
// @desc    Add a new skill
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
  const { userId, skill, level } = req.body;

  // Validation
  if (!userId || !skill) {
    return res.status(400).json({
      success: false,
      message: 'User ID and skill name are required'
    });
  }

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  // Check if skill already exists for this user
  const existingSkill = await Skill.findOne({ 
    userId, 
    skill: { $regex: new RegExp(`^${skill}$`, 'i') } 
  });

  if (existingSkill) {
    return res.status(400).json({
      success: false,
      message: 'This skill already exists for the user'
    });
  }

  // Create new skill
  const newSkill = new Skill({
    userId,
    skill: skill.trim(),
    level: level || 'Intermediate'
  });

  const savedSkill = await newSkill.save();

  res.status(201).json({
    success: true,
    message: 'Skill added successfully',
    data: savedSkill
  });
}));

// @route   GET /api/skills/:userId
// @desc    Get all skills for a specific user
// @access  Private
router.get('/:userId', validateObjectId, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { level, sort = 'createdAt', order = 'desc' } = req.query;

  // Build query
  const query = { userId };
  if (level) {
    query.level = level;
  }

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sort]: sortOrder };

  const skills = await Skill.find(query).sort(sortObj);

  res.json({
    success: true,
    data: skills,
    count: skills.length
  });
}));

// @route   GET /api/skills/single/:id
// @desc    Get a single skill by ID
// @access  Private
router.get('/single/:id', validateObjectId, asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }

  res.json({
    success: true,
    data: skill
  });
}));

// @route   PUT /api/skills/:id
// @desc    Update a skill
// @access  Private
router.put('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const { skill, level } = req.body;

  // Find skill
  const existingSkill = await Skill.findById(req.params.id);

  if (!existingSkill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }

  // Update fields
  if (skill !== undefined) existingSkill.skill = skill.trim();
  if (level !== undefined) existingSkill.level = level;

  const updatedSkill = await existingSkill.save();

  res.json({
    success: true,
    message: 'Skill updated successfully',
    data: updatedSkill
  });
}));

// @route   DELETE /api/skills/:id
// @desc    Delete a skill
// @access  Private
router.delete('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }

  await Skill.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Skill deleted successfully'
  });
}));

// @route   GET /api/skills
// @desc    Get all skills (admin only or for public showcase)
// @access  Public/Private
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, level } = req.query;

  // Build query
  const query = {};
  if (search) {
    query.skill = { $regex: search, $options: 'i' };
  }
  if (level) {
    query.level = level;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const skills = await Skill.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Skill.countDocuments(query);

  res.json({
    success: true,
    data: skills,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
}));

// @route   DELETE /api/skills/user/:userId
// @desc    Delete all skills for a user
// @access  Private
router.delete('/user/:userId', validateObjectId, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await Skill.deleteMany({ userId });

  res.json({
    success: true,
    message: `${result.deletedCount} skills deleted successfully`
  });
}));

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('Skill Route Error:', error);

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default router;