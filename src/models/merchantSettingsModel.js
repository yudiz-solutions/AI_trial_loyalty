import mongoose from 'mongoose';

const MerchantSettingsSchema = new mongoose.Schema({
  oMerchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'merchants',
    required: [true, 'Merchant ID is required'],
    unique: true
  },
  nPointToCurrencyRate: {
    type: Number,
    required: [true, 'Point to currency rate is required'],
    min: 0.01,
    default: 1
  },
  nMaxWalletBalance: {
    type: Number,
    required: [true, 'Max wallet balance is required'],
    min: 0,
    default: 10000
  },
  nMaxDailyRedemption: {
    type: Number,
    required: [true, 'Max daily redemption is required'],
    min: 0,
    default: 1000
  },
  nMaxCustomersLimit: {
    type: Number,
    required: [true, 'Max customers limit is required'],
    min: 1,
    default: 1000
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
  collection: 'merchantsettings'
});

// Indexes
MerchantSettingsSchema.index({ oMerchantId: 1 }, { unique: true });

// Pre-save middleware
MerchantSettingsSchema.pre('save', function(next) {
  this.dUpdatedAt = new Date();
  next();
});

// Static methods
MerchantSettingsSchema.statics.findByMerchant = function(merchantId) {
  return this.findOne({ oMerchantId: merchantId }).lean();
};

export default mongoose.model('merchantsettings', MerchantSettingsSchema);