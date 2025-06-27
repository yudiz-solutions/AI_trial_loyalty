import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  sFirstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  sLastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  sEmail: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  sPasswordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  sRole: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  bIsActive: {
    type: Boolean,
    default: true
  },
  bIsEmailVerified: {
    type: Boolean,
    default: false
  },
  dLastLogin: {
    type: Date
  },
  oProfile: {
    sPhone: {
      type: String,
      trim: true
    },
    sAvatar: {
      type: String
    },
    dDateOfBirth: {
      type: Date
    },
    sAddress: {
      sStreet: String,
      sCity: String,
      sState: String,
      sZipCode: String,
      sCountry: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ sEmail: 1 }, { unique: true });
UserSchema.index({ sRole: 1 });
UserSchema.index({ bIsActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('sFullName').get(function() {
  return `${this.sFirstName} ${this.sLastName}`;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('sPasswordHash')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.sPasswordHash = await bcrypt.hash(this.sPasswordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
UserSchema.methods.isPasswordValid = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.sPasswordHash);
};

// Instance method to update last login
UserSchema.methods.updateLastLogin = function() {
  this.dLastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find active users
UserSchema.statics.findActiveUsers = function() {
  return this.find({ bIsActive: true }).lean();
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ sEmail: email.toLowerCase() });
};

export default mongoose.model('users', UserSchema);