import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  oUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  sToken: {
    type: String,
    required: true
  },
  sType: {
    type: String,
    enum: ['email-verification', 'password-reset', 'refresh'],
    required: true
  },
  dExpiresAt: {
    type: Date,
    required: true
  },
  bIsUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
TokenSchema.index({ sToken: 1 }, { unique: true });
TokenSchema.index({ oUserId: 1 });
TokenSchema.index({ sType: 1 });
TokenSchema.index({ dExpiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to find valid token
TokenSchema.statics.findValidToken = function(token, type) {
  return this.findOne({
    sToken: token,
    sType: type,
    bIsUsed: false,
    dExpiresAt: { $gt: new Date() }
  });
};

// Instance method to mark token as used
TokenSchema.methods.markAsUsed = function() {
  this.bIsUsed = true;
  return this.save();
};

export default mongoose.model('tokens', TokenSchema);