const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  extension: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    default: '/'
  },
  type: {
    type: String,
    enum: ['private', 'public', 'backup'],
    default: 'private'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// 索引
fileSchema.index({ userId: 1, isDeleted: 1 });
fileSchema.index({ fileId: 1 });
fileSchema.index({ parentId: 1, isDeleted: 1 });
fileSchema.index({ type: 1, isDeleted: 1 });

// 软删除方法
fileSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// 恢复方法
fileSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return await this.save();
};

module.exports = mongoose.model('File', fileSchema);
