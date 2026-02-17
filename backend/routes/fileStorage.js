const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const File = require('../models/File');
const Folder = require('../models/Folder');
const ShareLink = require('../models/ShareLink');
const User = require('../models/User');
const { authenticate, optionalAuth, semiAuth } = require('../middleware/auth');
const {
  getUserUploadDir,
  generateFileId,
  generateFolderId,
  generateShareCode,
  generateAccessCode,
  getFileExtension,
  getMimeType,
  fileExists,
  moveFile,
  deleteFile,
  initializeFileStorage
} = require('../utils/fileStorage');

const router = express.Router();

// 初始化文件存储
initializeFileStorage();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = req.user.id;
      const type = req.body.type || 'private';
      const parentId = req.body.parentId || null;

      let uploadDir;
      if (parentId) {
        const parentFolder = await Folder.findOne({ _id: parentId, userId, isDeleted: false });
        if (!parentFolder) {
          return cb(new Error('Parent folder not found'));
        }
        uploadDir = path.join(getUserUploadDir(userId, type), parentFolder.folderId);
      } else {
        uploadDir = getUserUploadDir(userId, type);
      }

      // 确保目录存在
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // 使用UUID作为临时文件名，避免中文名文件名乱码问题
    const tempId = crypto.randomUUID();
    cb(null, tempId);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedMimeTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'audio/mpeg',
      'video/mp4',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// 获取用户文件列表
router.get('/files', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'private', parentId = null } = req.query;

    // 获取文件列表
    const files = await File.find({ 
      userId, 
      type, 
      parentId: parentId || null, 
      isDeleted: false 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
});

// 上传文件
router.post('/files/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'private', parentId = null } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // 生成文件ID
    const fileId = generateFileId();

    // 获取文件信息
    const originalName = req.file.originalname;
    const extension = getFileExtension(originalName);
    const mimeType = getMimeType(originalName);
    const size = req.file.size;

    // 重命名文件
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), fileId);
    await fs.rename(oldPath, newPath);

    // 创建文件记录
    const file = await File.create({
      userId,
      fileId,
      originalName,
      extension,
      mimeType,
      size,
      type,
      parentId: parentId || null
    });

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// 获取文件详情
router.get('/files/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file',
      error: error.message
    });
  }
});

// 下载文件
router.get('/files/:id/download', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 构建文件路径
    let filePath;
    if (file.parentId) {
      const parentFolder = await Folder.findOne({ _id: file.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      filePath = path.join(getUserUploadDir(userId, file.type), parentFolder.folderId, file.fileId);
    } else {
      filePath = path.join(getUserUploadDir(userId, file.type), file.fileId);
    }

    // 检查文件是否存在
    if (!(await fileExists(filePath))) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // 更新下载计数
    file.downloadCount += 1;
    await file.save();

    // 发送文件
    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// 更新文件
router.put('/files/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { originalName, type, parentId } = req.body;

    const file = await File.findOne({ _id: id, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 获取旧路径
    let oldPath;
    if (file.parentId) {
      const oldParentFolder = await Folder.findOne({ _id: file.parentId, userId, isDeleted: false });
      if (!oldParentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      oldPath = path.join(getUserUploadDir(userId, file.type), oldParentFolder.folderId, file.fileId);
    } else {
      oldPath = path.join(getUserUploadDir(userId, file.type), file.fileId);
    }

    // 更新文件属性
    if (originalName) {
      file.originalName = originalName;
      file.extension = getFileExtension(originalName);
      file.mimeType = getMimeType(originalName);
    }

    if (type && ['private', 'public', 'backup'].includes(type)) {
      file.type = type;
    }

    if (parentId !== undefined) {
      file.parentId = parentId || null;
    }

    await file.save();

    // 如果类型或父文件夹改变，移动文件
    if (type && type !== file.type || (parentId !== undefined && parentId !== file.parentId)) {
      let newPath;
      if (file.parentId) {
        const newParentFolder = await Folder.findOne({ _id: file.parentId, userId, isDeleted: false });
        if (!newParentFolder) {
          return res.status(404).json({
            success: false,
            message: 'Parent folder not found'
          });
        }
        newPath = path.join(getUserUploadDir(userId, file.type), newParentFolder.folderId, file.fileId);
      } else {
        newPath = path.join(getUserUploadDir(userId, file.type), file.fileId);
      }

      await moveFile(oldPath, newPath);
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file',
      error: error.message
    });
  }
});

// 删除文件（软删除）
router.delete('/files/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const file = await File.findOne({ _id: id, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 获取文件路径
    let filePath;
    if (file.parentId) {
      const parentFolder = await Folder.findOne({ _id: file.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      filePath = path.join(getUserUploadDir(userId, file.type), parentFolder.folderId, file.fileId);
    } else {
      filePath = path.join(getUserUploadDir(userId, file.type), file.fileId);
    }

    // 获取备份路径
    let backupPath;
    if (file.parentId) {
      const parentFolder = await Folder.findOne({ _id: file.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      backupPath = path.join(getUserUploadDir(userId, 'backup'), parentFolder.folderId, file.fileId);
    } else {
      backupPath = path.join(getUserUploadDir(userId, 'backup'), file.fileId);
    }

    // 移动文件到备份目录
    await moveFile(filePath, backupPath);

    // 软删除文件记录
    await file.softDelete();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// 获取用户文件夹列表
router.get('/folders', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'private', parentId = null } = req.query;

    // 获取文件夹列表
    const folders = await Folder.find({ 
      userId, 
      type, 
      parentId: parentId || null, 
      isDeleted: false 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders',
      error: error.message
    });
  }
});

// 创建文件夹
router.post('/folders', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type = 'private', parentId = null } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // 验证父文件夹是否存在
    let parentFolder = null;
    if (parentId) {
      parentFolder = await Folder.findOne({ _id: parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    // 生成文件夹ID
    const folderId = generateFolderId();

    // 创建文件夹记录
    const folder = await Folder.create({
      userId,
      folderId,
      name,
      type,
      parentId: parentId || null,
      path: parentId ? parentFolder.path + '/' + name : '/'
    });

    // 创建物理文件夹
    let folderPath;
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      folderPath = path.join(getUserUploadDir(userId, type), parentFolder.folderId, folderId);
    } else {
      folderPath = path.join(getUserUploadDir(userId, type), folderId);
    }

    await fs.mkdir(folderPath, { recursive: true });

    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: error.message
    });
  }
});

// 获取文件夹详情
router.get('/folders/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, userId, isDeleted: false });
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder',
      error: error.message
    });
  }
});

// 更新文件夹
router.put('/folders/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, parentId } = req.body;

    const folder = await Folder.findOne({ _id: id, userId, isDeleted: false });
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // 获取旧路径
    let oldPath;
    if (folder.parentId) {
      const oldParentFolder = await Folder.findOne({ _id: folder.parentId, userId, isDeleted: false });
      if (!oldParentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      oldPath = path.join(getUserUploadDir(userId, folder.type), oldParentFolder.folderId, folder.folderId);
    } else {
      oldPath = path.join(getUserUploadDir(userId, folder.type), folder.folderId);
    }

    // 更新文件夹属性
    if (name) {
      folder.name = name;
    }

    if (type && ['private', 'public', 'backup'].includes(type)) {
      folder.type = type;
    }

    if (parentId !== undefined) {
      folder.parentId = parentId || null;
    }

    await folder.save();

    // 如果类型或父文件夹改变，移动文件夹
    if (type && type !== folder.type || (parentId !== undefined && parentId !== folder.parentId)) {
      let newPath;
      if (folder.parentId) {
        const newParentFolder = await Folder.findOne({ _id: folder.parentId, userId, isDeleted: false });
        if (!newParentFolder) {
          return res.status(404).json({
            success: false,
            message: 'Parent folder not found'
          });
        }
        newPath = path.join(getUserUploadDir(userId, folder.type), newParentFolder.folderId, folder.folderId);
      } else {
        newPath = path.join(getUserUploadDir(userId, folder.type), folder.folderId);
      }

      await moveFile(oldPath, newPath);
    }

    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update folder',
      error: error.message
    });
  }
});

// 删除文件夹（软删除）
router.delete('/folders/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, userId, isDeleted: false });
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // 获取文件夹路径
    let folderPath;
    if (folder.parentId) {
      const parentFolder = await Folder.findOne({ _id: folder.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      folderPath = path.join(getUserUploadDir(userId, folder.type), parentFolder.folderId, folder.folderId);
    } else {
      folderPath = path.join(getUserUploadDir(userId, folder.type), folder.folderId);
    }

    // 获取备份路径
    let backupPath;
    if (folder.parentId) {
      const parentFolder = await Folder.findOne({ _id: folder.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      backupPath = path.join(getUserUploadDir(userId, 'backup'), parentFolder.folderId, folder.folderId);
    } else {
      backupPath = path.join(getUserUploadDir(userId, 'backup'), folder.folderId);
    }

    // 移动文件夹到备份目录
    await moveFile(folderPath, backupPath);

    // 软删除文件夹记录
    await folder.softDelete();

    // 递归软删除所有子文件夹和文件
    await deleteChildItems(folder._id, userId);

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder',
      error: error.message
    });
  }
});

// 递归删除子文件夹和文件
async function deleteChildItems(folderId, userId) {
  // 获取所有子文件夹
  const childFolders = await Folder.find({ parentId: folderId, userId, isDeleted: false });

  for (const childFolder of childFolders) {
    // 获取文件夹路径
    let folderPath;
    if (childFolder.parentId) {
      const parentFolder = await Folder.findOne({ _id: childFolder.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        continue;
      }
      folderPath = path.join(getUserUploadDir(userId, childFolder.type), parentFolder.folderId, childFolder.folderId);
    } else {
      folderPath = path.join(getUserUploadDir(userId, childFolder.type), childFolder.folderId);
    }

    // 获取备份路径
    let backupPath;
    if (childFolder.parentId) {
      const parentFolder = await Folder.findOne({ _id: childFolder.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        continue;
      }
      backupPath = path.join(getUserUploadDir(userId, 'backup'), parentFolder.folderId, childFolder.folderId);
    } else {
      backupPath = path.join(getUserUploadDir(userId, 'backup'), childFolder.folderId);
    }

    // 移动文件夹到备份目录
    await moveFile(folderPath, backupPath);

    // 软删除文件夹记录
    await childFolder.softDelete();

    // 递归删除子文件夹和文件
    await deleteChildItems(childFolder._id, userId);
  }

  // 获取所有子文件
  const childFiles = await File.find({ parentId: folderId, userId, isDeleted: false });

  for (const childFile of childFiles) {
    // 获取文件路径
    let filePath;
    if (childFile.parentId) {
      const parentFolder = await Folder.findOne({ _id: childFile.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        continue;
      }
      filePath = path.join(getUserUploadDir(userId, childFile.type), parentFolder.folderId, childFile.fileId);
    } else {
      filePath = path.join(getUserUploadDir(userId, childFile.type), childFile.fileId);
    }

    // 获取备份路径
    let backupPath;
    if (childFile.parentId) {
      const parentFolder = await Folder.findOne({ _id: childFile.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        continue;
      }
      backupPath = path.join(getUserUploadDir(userId, 'backup'), parentFolder.folderId, childFile.fileId);
    } else {
      backupPath = path.join(getUserUploadDir(userId, 'backup'), childFile.fileId);
    }

    // 移动文件到备份目录
    await moveFile(filePath, backupPath);

    // 软删除文件记录
    await childFile.softDelete();
  }
}

// 创建分享链接
router.post('/share-links', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId, authType = 'none', password, expirationDate, maxAccessCount } = req.body;

    // 验证文件是否存在
    const file = await File.findOne({ _id: fileId, userId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 生成分享码
    const shareCode = generateShareCode();

    // 如果需要访问码，生成访问码
    let accessCode = null;
    if (authType === 'code') {
      accessCode = generateAccessCode();
    }

    // 创建分享链接
    const shareLink = await ShareLink.create({
      fileId,
      userId,
      shareCode,
      authType,
      password,
      accessCode,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      maxAccessCount: maxAccessCount || null
    });

    res.json({
      success: true,
      shareLink
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create share link',
      error: error.message
    });
  }
});

// 获取分享链接
router.get('/share-links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const shareLink = await ShareLink.findOne({ shareCode: code });
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found'
      });
    }

    // 检查分享链接是否有效
    if (!shareLink.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Share link is invalid or expired'
      });
    }

    // 获取文件信息
    const file = await File.findOne({ _id: shareLink.fileId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      shareLink: {
        id: shareLink._id,
        authType: shareLink.authType,
        expirationDate: shareLink.expirationDate,
        maxAccessCount: shareLink.maxAccessCount,
        currentAccessCount: shareLink.currentAccessCount,
        file: {
          id: file._id,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType
        }
      }
    });
  } catch (error) {
    console.error('Error fetching share link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch share link',
      error: error.message
    });
  }
});

// 通过分享链接下载文件
router.get('/share-links/:code/download', optionalAuth, async (req, res) => {
  try {
    const { code } = req.params;
    const { password, accessCode } = req.query;

    const shareLink = await ShareLink.findOne({ shareCode: code });
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found'
      });
    }

    // 检查分享链接是否有效
    if (!shareLink.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Share link is invalid or expired'
      });
    }

    // 验证认证类型
    if (shareLink.authType === 'password' && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Login required'
      });
    }

    if (shareLink.authType === 'password' && password !== shareLink.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // 获取文件
    const file = await File.findOne({ _id: shareLink.fileId, isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 构建文件路径
    let filePath;
    if (file.parentId) {
      const parentFolder = await Folder.findOne({ _id: file.parentId, userId: shareLink.userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      filePath = path.join(getUserUploadDir(shareLink.userId, file.type), parentFolder.folderId, file.fileId);
    } else {
      filePath = path.join(getUserUploadDir(shareLink.userId, file.type), file.fileId);
    }

    // 检查文件是否存在
    if (!(await fileExists(filePath))) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // 更新下载计数
    file.downloadCount += 1;
    await file.save();

    // 更新分享链接访问计数
    await shareLink.incrementAccessCount();

    // 发送文件
    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file via share link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// 获取用户的分享链接列表
router.get('/share-links', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const shareLinks = await ShareLink.find({ userId })
      .populate('fileId', 'originalName size mimeType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      shareLinks
    });
  } catch (error) {
    console.error('Error fetching share links:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch share links',
      error: error.message
    });
  }
});

// 删除分享链接
router.delete('/share-links/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const shareLink = await ShareLink.findOne({ _id: id, userId });
    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found'
      });
    }

    await ShareLink.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Share link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting share link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete share link',
      error: error.message
    });
  }
});

// Semi-auth routes - for semi-authenticated users accessing public folders

// 获取semi-auth用户的文件列表（仅public类型）
router.get('/semi-auth/files', semiAuth, async (req, res) => {
  try {
    const { parentId = null } = req.query;
    const username = req.semiAuthUser.username;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;

    // 获取文件列表（仅public类型）
    const files = await File.find({
      userId,
      type: 'public',
      parentId: parentId || null,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error fetching semi-auth files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
});

// 获取semi-auth用户的文件夹列表（仅public类型）
router.get('/semi-auth/folders', semiAuth, async (req, res) => {
  try {
    const { parentId = null } = req.query;
    const username = req.semiAuthUser.username;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;

    // 获取文件夹列表（仅public类型）
    const folders = await Folder.find({
      userId,
      type: 'public',
      parentId: parentId || null,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('Error fetching semi-auth folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders',
      error: error.message
    });
  }
});

// Semi-auth上传文件
router.post('/semi-auth/files/upload', semiAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const username = req.semiAuthUser.username;
    const { parentId = null } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;
    const fileId = generateFileId();
    const tempPath = req.file.path;

    // 确定目标路径
    let targetPath;
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      targetPath = path.join(getUserUploadDir(userId, 'public'), parentFolder.folderId, fileId);
    } else {
      targetPath = path.join(getUserUploadDir(userId, 'public'), fileId);
    }

    // 移动文件到目标位置
    await moveFile(tempPath, targetPath);

    // 创建文件记录
    const file = await File.create({
      fileId,
      userId,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: 'public',
      parentId: parentId || null
    });

    res.json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// Semi-auth创建文件夹
router.post('/semi-auth/folders', semiAuth, async (req, res) => {
  try {
    const username = req.semiAuthUser.username;
    const { name, parentId = null } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;
    const folderId = generateFolderId();

    // 确定目标路径
    let targetPath;
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      targetPath = path.join(getUserUploadDir(userId, 'public'), parentFolder.folderId, folderId);
    } else {
      targetPath = path.join(getUserUploadDir(userId, 'public'), folderId);
    }

    // 创建文件夹
    await fs.mkdir(targetPath, { recursive: true });

    // 创建文件夹记录
    const folder = await Folder.create({
      folderId,
      userId,
      name,
      type: 'public',
      parentId: parentId || null
    });

    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: error.message
    });
  }
});

// Semi-auth下载文件
router.get('/semi-auth/files/:id/download', semiAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.semiAuthUser.username;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;

    // 获取文件
    const file = await File.findOne({ _id: id, userId, type: 'public', isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 构建文件路径
    let filePath;
    if (file.parentId) {
      const parentFolder = await Folder.findOne({ _id: file.parentId, userId, isDeleted: false });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
      filePath = path.join(getUserUploadDir(userId, 'public'), parentFolder.folderId, file.fileId);
    } else {
      filePath = path.join(getUserUploadDir(userId, 'public'), file.fileId);
    }

    // 检查文件是否存在
    if (!(await fileExists(filePath))) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // 更新下载计数
    file.downloadCount += 1;
    await file.save();

    // 发送文件
    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// Semi-auth删除文件
router.delete('/semi-auth/files/:id', semiAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.semiAuthUser.username;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;

    // 获取文件
    const file = await File.findOne({ _id: id, userId, type: 'public', isDeleted: false });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // 软删除文件
    file.isDeleted = true;
    await file.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// Semi-auth删除文件夹
router.delete('/semi-auth/folders/:id', semiAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.semiAuthUser.username;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = user._id;

    // 获取文件夹
    const folder = await Folder.findOne({ _id: id, userId, type: 'public', isDeleted: false });
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // 软删除文件夹
    folder.isDeleted = true;
    await folder.save();

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder',
      error: error.message
    });
  }
});

module.exports = router;
