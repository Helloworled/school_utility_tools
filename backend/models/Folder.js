const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folderId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
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
folderSchema.index({ userId: 1, isDeleted: 1 });
folderSchema.index({ folderId: 1 });
folderSchema.index({ parentId: 1, isDeleted: 1 });
folderSchema.index({ type: 1, isDeleted: 1 });

// 软删除方法
folderSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// 恢复方法
folderSchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return await this.save();
};

// 获取子文件夹
folderSchema.methods.getChildFolders = async function() {
  return await Folder.find({ 
    parentId: this._id, 
    isDeleted: false 
  });
};

// 获取子文件
folderSchema.methods.getChildFiles = async function() {
  return await File.find({ 
    parentId: this._id, 
    isDeleted: false 
  });
};

// 递归获取所有子文件夹
folderSchema.methods.getAllChildFolders = async function() {
  const childFolders = await this.getChildFolders();
  const allFolders = [...childFolders];

  for (const childFolder of childFolders) {
    const grandChildFolders = await childFolder.getAllChildFolders();
    allFolders.push(...grandChildFolders);
  }

  return allFolders;
};

// 递归获取所有子文件
folderSchema.methods.getAllChildFiles = async function() {
  const childFiles = await this.getChildFiles();
  const allFiles = [...childFiles];

  const childFolders = await this.getChildFolders();
  for (const childFolder of childFolders) {
    const grandChildFiles = await childFolder.getAllChildFiles();
    allFiles.push(...grandChildFiles);
  }

  return allFiles;
};

module.exports = mongoose.model('Folder', folderSchema);
