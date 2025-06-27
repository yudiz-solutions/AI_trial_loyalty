import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  oCustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'customers',
    required: [true, 'Customer ID is required']
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
  oWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'workers',
    required: [true, 'Worker ID is required']
  },
  sType: {
    type: String,
    enum: ['credit', 'debit'],
    required: [true, 'Transaction type is required']
  },
  nPoints: {
    type: Number,
    required: [true, 'Points amount is required'],
    min: 0
  },
  nCashEquivalentValue: {
    type: Number,
    required: [true, 'Cash equivalent value is required'],
    min: 0
  },
  nAdminCommissionValue: {
    type: Number,
    default: 0,
    min: 0
  },
  sPayStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
  },
  dTransactionDate: {
    type: Date,
    default: Date.now
  },
  nWalletBalanceAfterTransaction: {
    type: Number,
    required: [true, 'Wallet balance after transaction is required'],
    min: 0
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
  collection: 'transactions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TransactionSchema.index({ oCustomerId: 1 });
TransactionSchema.index({ oMerchantId: 1 });
TransactionSchema.index({ oBranchId: 1 });
TransactionSchema.index({ oWorkerId: 1 });
TransactionSchema.index({ sType: 1 });
TransactionSchema.index({ sPayStatus: 1 });
TransactionSchema.index({ dTransactionDate: -1 });
TransactionSchema.index({ dCreatedAt: -1 });

// Pre-save middleware
TransactionSchema.pre('save', function(next) {
  this.dUpdatedAt = new Date();
  next();
});

// Static methods
TransactionSchema.statics.findByCustomer = function(customerId) {
  return this.find({ oCustomerId: customerId }).sort({ dTransactionDate: -1 }).lean();
};

TransactionSchema.statics.findByMerchant = function(merchantId) {
  return this.find({ oMerchantId: merchantId }).sort({ dTransactionDate: -1 }).lean();
};

TransactionSchema.statics.findByBranch = function(branchId) {
  return this.find({ oBranchId: branchId }).sort({ dTransactionDate: -1 }).lean();
};

TransactionSchema.statics.findByWorker = function(workerId) {
  return this.find({ oWorkerId: workerId }).sort({ dTransactionDate: -1 }).lean();
};

export default mongoose.model('transactions', TransactionSchema);