const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const File = require('../models/File');
const Folder = require('../models/Folder');

// 基础上传目录
const BASE_UPLOAD_DIR = path.join(__dirname, '../uploads/files');

/**
 * 迁移public文件夹到新的用户目录结构
 */
async function migratePublicFiles() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_utility_tools', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('已连接到数据库');

    // 获取所有public类型的文件夹
    const publicFolders = await Folder.find({ type: 'public', isDeleted: false });
    console.log(`找到 ${publicFolders.length} 个public文件夹`);

    // 获取所有public类型的文件
    const publicFiles = await File.find({ type: 'public', isDeleted: false });
    console.log(`找到 ${publicFiles.length} 个public文件`);

    // 按用户分组
    const usersMap = new Map();

    // 处理文件夹
    for (const folder of publicFolders) {
      const userId = folder.userId.toString();
      if (!usersMap.has(userId)) {
        usersMap.set(userId, { folders: [], files: [] });
      }
      usersMap.get(userId).folders.push(folder);
    }

    // 处理文件
    for (const file of publicFiles) {
      const userId = file.userId.toString();
      if (!usersMap.has(userId)) {
        usersMap.set(userId, { folders: [], files: [] });
      }
      usersMap.get(userId).files.push(file);
    }

    // 为每个用户创建新的目录结构
    for (const [userId, items] of usersMap.entries()) {
      console.log(`\n处理用户 ${userId}...`);

      // 创建新的public用户目录
      const newUserDir = path.join(BASE_UPLOAD_DIR, 'public', userId);
      await fs.mkdir(newUserDir, { recursive: true });
      console.log(`  创建目录: ${newUserDir}`);

      // 移动文件夹
      for (const folder of items.folders) {
        const oldPath = getOldFolderPath(folder);
        const newPath = getNewFolderPath(userId, folder);

        if (oldPath !== newPath) {
          try {
            // 确保目标目录存在
            const newParentDir = path.dirname(newPath);
            await fs.mkdir(newParentDir, { recursive: true });

            // 移动文件夹
            await fs.rename(oldPath, newPath);
            console.log(`  移动文件夹: ${folder.name}`);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              console.error(`  移动文件夹失败: ${folder.name}`, error.message);
            }
          }
        }
      }

      // 移动文件
      for (const file of items.files) {
        const oldPath = getOldFilePath(file);
        const newPath = getNewFilePath(userId, file);

        if (oldPath !== newPath) {
          try {
            // 确保目标目录存在
            const newParentDir = path.dirname(newPath);
            await fs.mkdir(newParentDir, { recursive: true });

            // 移动文件
            await fs.rename(oldPath, newPath);
            console.log(`  移动文件: ${file.originalName}`);
          } catch (error) {
            if (error.code !== 'ENOENT') {
              console.error(`  移动文件失败: ${file.originalName}`, error.message);
            }
          }
        }
      }
    }

    console.log('\n迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

/**
 * 获取旧的文件夹路径（迁移前）
 */
function getOldFolderPath(folder) {
  const oldPublicDir = path.join(BASE_UPLOAD_DIR, 'public');

  if (!folder.parentId) {
    return path.join(oldPublicDir, folder.folderId);
  }

  // 对于子文件夹，需要获取父文件夹的folderId
  // 这里简化处理，假设父文件夹的folderId就是路径的一部分
  return path.join(oldPublicDir, folder.parentId.toString(), folder.folderId);
}

/**
 * 获取新的文件夹路径（迁移后）
 */
function getNewFolderPath(userId, folder) {
  const newUserDir = path.join(BASE_UPLOAD_DIR, 'public', userId);

  if (!folder.parentId) {
    return path.join(newUserDir, folder.folderId);
  }

  // 对于子文件夹，需要从数据库获取父文件夹的folderId
  // 这里简化处理，需要递归获取完整路径
  return path.join(newUserDir, folder.parentId.toString(), folder.folderId);
}

/**
 * 获取旧的文件路径（迁移前）
 */
function getOldFilePath(file) {
  const oldPublicDir = path.join(BASE_UPLOAD_DIR, 'public');

  if (!file.parentId) {
    return path.join(oldPublicDir, file.fileId);
  }

  return path.join(oldPublicDir, file.parentId.toString(), file.fileId);
}

/**
 * 获取新的文件路径（迁移后）
 */
function getNewFilePath(userId, file) {
  const newUserDir = path.join(BASE_UPLOAD_DIR, 'public', userId);

  if (!file.parentId) {
    return path.join(newUserDir, file.fileId);
  }

  return path.join(newUserDir, file.parentId.toString(), file.fileId);
}

// 运行迁移
migratePublicFiles();
