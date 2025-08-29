// backend/models/Project.js
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  technologies: {
    type: String,
    trim: true,
    default: ''
  },
  githubLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty string or undefined
        if (!v || v === '') return true;
        // Validate URL format if provided
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL for GitHub link'
    }
  },
  liveLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty string or undefined
        if (!v || v === '') return true;
        // Validate URL format if provided
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL for live demo link'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for faster queries
projectSchema.index({ userId: 1, createdAt: -1 });

// Virtual to get formatted creation date
projectSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;