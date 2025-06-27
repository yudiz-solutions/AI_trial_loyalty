import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  sFileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  sFileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: ['image', 'document', 'pdf', 'other']
  },
  sUploadedByRole: {
    type: String,
    required: [true, 'Uploaded by role is required'],
    enum: ['admin', 'merchant', 'worker']
  },
  oUploadedById: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Uploaded by ID is required']
  },
  dCreatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  collection: 'files'
});

// Indexes
FileSchema.index({ sUploadedByRole: 1, oUploadedById: 1 });
FileSchema.index({ sFileType: 1 });
FileSchema.index({ dCreatedAt: -1 });

export default mongoose.model('files', FileSchema);