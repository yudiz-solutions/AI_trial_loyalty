import mongoose from 'mongoose';

const PasswordResetTokenSchema = new mongoose.Schema({
  sEmail: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  sToken: {
    type: String,
    required: [true, 'Token is required'],
    unique: true
  },
  dExpiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  dCreatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  collection: 'passwordresettokens'
});

// Indexes
PasswordResetTokenSchema.index({ sToken: 1 }, { unique: true });
PasswordResetTokenSchema.index({ sEmail: 1 });
PasswordResetTokenSchema.index({ dExpiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static methods
PasswordResetTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    sToken: token,
    dExpiresAt: { $gt: new Date() }
  });
};

export default mongoose.model('passwordresettokens', PasswordResetTokenSchema);