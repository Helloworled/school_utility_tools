const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);
const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);

// 基础上传目录
const BASE_UPLOAD_DIR = path.join(__dirname, '../uploads/files');

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * 获取用户上传目录
 * @param {string} userId - 用户ID
 * @param {string} type - 文件类型 (private/public/backup)
 * @returns {string} 用户上传目录路径
 */
function getUserUploadDir(userId, type = 'private') {
  return path.join(BASE_UPLOAD_DIR, type, userId.toString());
}

/**
 * 获取文件夹物理路径
 * @param {string} userId - 用户ID
 * @param {string} type - 文件夹类型 (private/public/backup)
 * @param {string} parentId - 父文件夹ID
 * @param {string} folderId - 文件夹ID
 * @returns {string} 文件夹物理路径
 */
function getFolderPath(userId, type, parentId, folderId) {
  const userDir = getUserUploadDir(userId, type);

  if (!parentId) {
    return path.join(userDir, folderId);
  }

  // 这里需要从数据库获取父文件夹路径
  // 为了简化，我们假设父文件夹路径已经传入
  return path.join(userDir, parentId, folderId);
}

/**
 * 获取文件物理路径
 * @param {string} userId - 用户ID
 * @param {string} type - 文件类型 (private/public/backup)
 * @param {string} parentId - 父文件夹ID
 * @param {string} fileId - 文件ID
 * @returns {string} 文件物理路径
 */
function getFilePath(userId, type, parentId, fileId) {
  const userDir = getUserUploadDir(userId, type);

  if (!parentId) {
    return path.join(userDir, fileId);
  }

  // 这里需要从数据库获取父文件夹路径
  // 为了简化，我们假设父文件夹路径已经传入
  return path.join(userDir, parentId, fileId);
}

/**
 * 生成唯一文件ID
 * @returns {string} 唯一文件ID
 */
function generateFileId() {
  return `file_${crypto.randomUUID()}`;
}

/**
 * 生成唯一文件夹ID
 * @returns {string} 唯一文件夹ID
 */
function generateFolderId() {
  return `folder_${crypto.randomUUID()}`;
}

/**
 * 生成分享码
 * @returns {string} 分享码
 */
function generateShareCode() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 生成访问码
 * @returns {string} 访问码
 */
function generateAccessCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 获取文件MIME类型
 * @param {string} filename - 文件名
 * @returns {string} MIME类型
 */
function getMimeType(filename) {
  const extension = getFileExtension(filename).toLowerCase();

  const mimeTypes = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 删除文件
 * @param {string} filePath - 文件路径
 */
async function deleteFile(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * 移动文件
 * @param {string} sourcePath - 源文件路径
 * @param {string} targetPath - 目标文件路径
 */
async function moveFile(sourcePath, targetPath) {
  // 确保目标目录存在
  await ensureDir(path.dirname(targetPath));

  // 移动文件
  await rename(sourcePath, targetPath);
}

/**
 * 复制文件
 * @param {string} sourcePath - 源文件路径
 * @param {string} targetPath - 目标文件路径
 */
async function copyFileTo(sourcePath, targetPath) {
  // 确保目标目录存在
  await ensureDir(path.dirname(targetPath));

  // 复制文件
  await copyFile(sourcePath, targetPath);
}

/**
 * 获取目录内容
 * @param {string} dirPath - 目录路径
 * @returns {Array} 目录内容
 */
async function getDirectoryContents(dirPath) {
  try {
    const files = await readdir(dirPath);
    const contents = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await stat(filePath);

      contents.push({
        name: file,
        path: filePath,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      });
    }

    return contents;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * 初始化文件存储系统
 */
async function initializeFileStorage() {
  // 确保基础目录存在
  await ensureDir(BASE_UPLOAD_DIR);
  await ensureDir(path.join(BASE_UPLOAD_DIR, 'private'));
  await ensureDir(path.join(BASE_UPLOAD_DIR, 'public'));
  await ensureDir(path.join(BASE_UPLOAD_DIR, 'backup'));
}

module.exports = {
  BASE_UPLOAD_DIR,
  getUserUploadDir,
  getFolderPath,
  getFilePath,
  generateFileId,
  generateFolderId,
  generateShareCode,
  generateAccessCode,
  getFileExtension,
  getMimeType,
  fileExists,
  deleteFile,
  moveFile,
  copyFileTo,
  getDirectoryContents,
  initializeFileStorage
};
