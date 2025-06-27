import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
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
  sPhoneNumber: {
    type: String,
    trim: true
  },
  sPasswordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  dCreatedAt: {
    type: Date,
    default: Date.now
  },
  dUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  collection: 'admins'
});

// Indexes
AdminSchema.index({ sEmail: 1 }, { unique: true });

// Virtual for full name
AdminSchema.virtual('sFullName').get(function() {
  return `${this.sFirstName} ${this.sLastName}`;
});

// Pre-save middleware to hash password and update timestamps
AdminSchema.pre('save', async function(next) {
  this.dUpdatedAt = new Date();
  
  if (!this.isModified('sPasswordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.sPasswordHash = await bcrypt.hash(this.sPasswordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
AdminSchema.methods.isPasswordValid = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.sPasswordHash);
};

// Static method to find by email
AdminSchema.statics.findByEmail = function(email) {
  return this.findOne({ sEmail: email.toLowerCase() });
};

export default mongoose.model('admins', AdminSchema);