// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or valid phone number
        return v === '' || /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  place: {
    type: String,
    trim: true,
    default: '',
    maxlength: [100, 'Place cannot exceed 100 characters']
  },
  role: {
    type: String,
    trim: true,
    default: '',
    enum: {
      values: ['', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UI/UX Designer', 'DevOps Engineer'],
      message: 'Please select a valid role'
    }
  },
  profileImage: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        // Allow empty string or valid URL
        return v === '' || /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(v);
      },
      message: 'Please enter a valid image URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Virtual for user's full profile URL (if you implement profile pages later)
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this._id}`;
});

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true });
};

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastLogin')) {
    this.updatedAt = new Date();
  }
  next();
});

// Post-save middleware for logging
userSchema.post('save', function(doc) {
  console.log(`User ${doc.email} has been saved to the database`);
});

const User = mongoose.model('User', userSchema);

export default User;