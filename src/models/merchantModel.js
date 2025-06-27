import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MerchantSchema = new mongoose.Schema({
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
  sBusinessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  sBusinessImageUrl: {
    type: String
  },
  sBusinessAddress: {
    type: String,
    trim: true
  },
  sLegalDocsUrl: {
    type: String
  },
  sStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
    default: 'pending'
  },
  sRejectionReason: {
    type: String
  },
  nCommissionPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  sBrandLogoUrl: {
    type: String
  },
  sThemeColor: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
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
  collection: 'merchants',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
MerchantSchema.index({ sEmail: 1 }, { unique: true });
MerchantSchema.index({ sStatus: 1 });
MerchantSchema.index({ sBusinessName: 1 });

// Virtual for full name
MerchantSchema.virtual('sFullName').get(function() {
  return `${this.sFirstName} ${this.sLastName}`;
});

// Pre-save middleware
MerchantSchema.pre('save', async function(next) {
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

// Instance methods
MerchantSchema.methods.isPasswordValid = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.sPasswordHash);
};

// Static methods
MerchantSchema.statics.findByEmail = function(email) {
  return this.findOne({ sEmail: email.toLowerCase() });
};

MerchantSchema.statics.findActiveApproved = function() {
  return this.find({ sStatus: { $in: ['approved', 'active'] } }).lean();
};

export default mongoose.model('merchants', MerchantSchema);