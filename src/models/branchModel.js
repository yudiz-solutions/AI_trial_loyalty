import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  sName: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  sCity: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  sState: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  sAddress: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  sBranchImageUrl: {
    type: String
  },
  oMerchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'merchants',
    required: [true, 'Merchant ID is required']
  },
  oAssignedWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'workers'
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
  collection: 'branches',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
BranchSchema.index({ oMerchantId: 1 });
BranchSchema.index({ oAssignedWorkerId: 1 });
BranchSchema.index({ sStatus: 1 });
BranchSchema.index({ sCity: 1, sState: 1 });

// Pre-save middleware
BranchSchema.pre('save', function(next) {
  this.dUpdatedAt = new Date();
  next();
});

// Static methods
BranchSchema.statics.findByMerchant = function(merchantId) {
  return this.find({ oMerchantId: merchantId }).lean();
};

BranchSchema.statics.findActiveBranches = function() {
  return this.find({ sStatus: 'active' }).lean();
};

export default mongoose.model('branches', BranchSchema);