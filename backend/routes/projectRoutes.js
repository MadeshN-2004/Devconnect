// backend/routes/projectRoutes.js
import express from 'express';
import Project from '../models/Project.js';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id, userId } = req.params;
  
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid project ID format' 
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

// @route   POST /api/projects
// @desc    Add a new project
// @access  Private
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { userId, title, description, technologies, githubLink, liveLink } = req.body;

  // Validation
  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required'
    });
  }

  // Use authenticated user's ID if not provided
  const projectUserId = userId || req.user.id;

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(projectUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID format'
    });
  }

  // Clean up URLs - remove empty strings
  const projectData = {
    userId: projectUserId,
    title: title.trim(),
    description: description.trim(),
    technologies: technologies ? technologies.trim() : '',
  };

  // Only add URLs if they're not empty
  if (githubLink && githubLink.trim()) {
    projectData.githubLink = githubLink.trim();
  }
  if (liveLink && liveLink.trim()) {
    projectData.liveLink = liveLink.trim();
  }

  // Create new project
  const newProject = new Project(projectData);
  const savedProject = await newProject.save();

  res.status(201).json({
    success: true,
    message: 'Project added successfully',
    data: savedProject
  });
}));

// @route   GET /api/projects/user/:userId
// @desc    Get all projects for a specific user
// @access  Private
router.get('/user/:userId', authMiddleware, validateObjectId, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, sort = 'createdAt', order = 'desc' } = req.query;

  // Build query
  const query = { userId };
  if (status) {
    query.status = status;
  }

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sort]: sortOrder };

  const projects = await Project.find(query).sort(sortObj);

  res.json({
    success: true,
    data: projects,
    count: projects.length
  });
}));

// @route   GET /api/projects/:id
// @desc    Get a single project by ID
// @access  Private
router.get('/:id', authMiddleware, validateObjectId, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.json({
    success: true,
    data: project
  });
}));

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', authMiddleware, validateObjectId, asyncHandler(async (req, res) => {
  const { title, description, technologies, githubLink, liveLink, status } = req.body;

  // Find project
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user owns this project
  if (project.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this project'
    });
  }

  // Update fields
  if (title !== undefined) project.title = title.trim();
  if (description !== undefined) project.description = description.trim();
  if (technologies !== undefined) project.technologies = technologies.trim();
  if (status !== undefined) project.status = status;

  // Handle URLs - only update if provided, allow empty to clear
  if (githubLink !== undefined) {
    project.githubLink = githubLink.trim() || undefined;
  }
  if (liveLink !== undefined) {
    project.liveLink = liveLink.trim() || undefined;
  }

  const updatedProject = await project.save();

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: updatedProject
  });
}));

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', authMiddleware, validateObjectId, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user owns this project
  if (project.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this project'
    });
  }

  await Project.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// @route   GET /api/projects
// @desc    Get all projects (with pagination)
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, userId } = req.query;

  // Build query
  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { technologies: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) {
    query.status = status;
  }
  if (userId) {
    query.userId = userId;
  }

  // Pagination
  const skip = (page - 1) * limit;

  const projects = await Project.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Project.countDocuments(query);

  res.json({
    success: true,
    data: projects,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
}));

// @route   DELETE /api/projects/user/:userId
// @desc    Delete all projects for a user
// @access  Private
router.delete('/user/:userId', authMiddleware, validateObjectId, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user is deleting their own projects or is admin
  if (userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete projects for this user'
    });
  }

  const result = await Project.deleteMany({ userId });

  res.json({
    success: true,
    message: `${result.deletedCount} projects deleted successfully`
  });
}));

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('Project Route Error:', error);

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