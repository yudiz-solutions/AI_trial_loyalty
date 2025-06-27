import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const WorkerSchema = new mongoose.Schema({
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
  oMerchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'merchants',
    required: [true, 'Merchant ID is required']
  },
  oBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'branches'
  },
  sProfileImageUrl: {
    type: String
  },
  sStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
  collection: 'workers',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
WorkerSchema.index({ sEmail: 1 }, { unique: true });
WorkerSchema.index({ oMerchantId: 1 });
WorkerSchema.index({ oBranchId: 1 });
WorkerSchema.index({ sStatus: 1 });

// Virtual for full name
WorkerSchema.virtual('sFullName').get(function() {
  return `${this.sFirstName} ${this.sLastName}`;
});

// Pre-save middleware
WorkerSchema.pre('save', async function(next) {
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
WorkerSchema.methods.isPasswordValid = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.sPasswordHash);
};

// Static methods
WorkerSchema.statics.findByEmail = function(email) {
  return this.findOne({ sEmail: email.toLowerCase() });
};

WorkerSchema.statics.findByMerchant = function(merchantId) {
  return this.find({ oMerchantId: merchantId, sStatus: 'active' }).lean();
};

export default mongoose.model('workers', WorkerSchema);