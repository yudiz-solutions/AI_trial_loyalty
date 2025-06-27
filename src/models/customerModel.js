import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  sFullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  sEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  sPhoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  dDateOfBirth: {
    type: Date
  },
  oMerchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'merchants',
    required: [true, 'Merchant ID is required']
  },
  oBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'branches',
    required: [true, 'Branch ID is required']
  },
  oAssignedWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'workers'
  },
  sLoyaltyCardQRCodeUrl: {
    type: String
  },
  nWalletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  dRegistrationDate: {
    type: Date,
    default: Date.now
  },
  dFirstTransactionDate: {
    type: Date
  },
  dLastTransactionDate: {
    type: Date
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
  collection: 'customers',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CustomerSchema.index({ oMerchantId: 1 });
CustomerSchema.index({ oBranchId: 1 });
CustomerSchema.index({ oAssignedWorkerId: 1 });
CustomerSchema.index({ sPhoneNumber: 1, oMerchantId: 1 }, { unique: true });
CustomerSchema.index({ sStatus: 1 });
CustomerSchema.index({ dRegistrationDate: -1 });

// Pre-save middleware
CustomerSchema.pre('save', function(next) {
  this.dUpdatedAt = new Date();
  next();
});

// Static methods
CustomerSchema.statics.findByMerchant = function(merchantId) {
  return this.find({ oMerchantId: merchantId }).lean();
};

CustomerSchema.statics.findByBranch = function(branchId) {
  return this.find({ oBranchId: branchId }).lean();
};

CustomerSchema.statics.findByWorker = function(workerId) {
  return this.find({ oAssignedWorkerId: workerId }).lean();
};

export default mongoose.model('customers', CustomerSchema);