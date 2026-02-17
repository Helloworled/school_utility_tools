# File Storage System - 技术实现细节

## 系统架构概述

本文件存储系统旨在提供一个类似Google Drive或百度网盘的云存储解决方案，支持私有、公开和共享文件管理。

## 目录结构设计

### 物理文件系统结构
```
uploads/
└── files/
    ├── private/
    │   └── [userId]/
    │       ├── folder_[dbId]/
    │       │   └── folder_[dbId]/
    │       │       └── file_[dbId]
    │       └── file_[dbId]
    ├── public/
    │   └── [userId]/
    │       ├── folder_[dbId]/
    │       │   └── folder_[dbId]/
    │       │       └── file_[dbId]
    │       └── file_[dbId]
    └── backup/
        └── [userId]/
            ├── folder_[dbId]/
            │   └── folder_[dbId]/
            │       └── file_[dbId]
            └── file_[dbId]
```

### 数据库设计

#### 文件表 (files)
```javascript
{
  id: ObjectId,           // 主键
  userId: ObjectId,       // 文件所有者ID
  fileId: String,         // 文件物理名称 (file_[dbId])
  originalName: String,   // 原始文件名
  extension: String,      // 文件扩展名
  mimeType: String,       // MIME类型
  size: Number,           // 文件大小(字节)
  path: String,           // 相对路径 (如: "/documents/work")
  type: String,           // 文件类型: "private"/"public"/"backup"
  parentId: ObjectId,     // 父文件夹ID (null表示根目录)
  downloadCount: Number,  // 下载次数
  isDeleted: Boolean,     // 是否已删除
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 最后修改时间
}
```

#### 文件夹表 (folders)
```javascript
{
  id: ObjectId,           // 主键
  userId: ObjectId,       // 文件夹所有者ID
  folderId: String,       // 文件夹物理名称 (folder_[dbId])
  name: String,           // 文件夹名称
  path: String,           // 相对路径 (如: "/documents/work")
  type: String,           // 文件夹类型: "private"/"public"/"backup"
  parentId: ObjectId,     // 父文件夹ID (null表示根目录)
  isDeleted: Boolean,     // 是否已删除
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 最后修改时间
}
```

#### 分享链接表 (shareLinks)
```javascript
{
  id: ObjectId,           // 主键
  fileId: ObjectId,       // 关联文件ID
  userId: ObjectId,       // 创建分享的用户ID
  shareCode: String,      // 分享码 (UUID)
  authType: String,       // 认证类型: "none"/"account"/"code"
  password: String,       // 认证密码 (如果authType="account")
  accessCode: String,     // 访问码 (如果authType="code")
  expirationDate: Date,   // 过期时间 (null表示永不过期)
  maxAccessCount: Number, // 最大访问次数 (null表示无限制)
  currentAccessCount: Number, // 当前访问次数
  isActive: Boolean,     // 是否激活
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 最后修改时间
}
```

## 核心功能实现

### 文件上传

#### 技术栈
- 前端: Vue.js + Axios + Dropzone.js (拖放上传)
- 后端: Node.js + Express + Multer (文件处理)

#### 实现流程
1. 前端选择文件或拖放文件到上传区域
2. 前端发送预检请求，检查文件大小和类型是否符合要求
3. 前端将文件分块上传（大文件）
4. 后端接收文件，验证权限
5. 后端生成唯一文件ID (file_[dbId])
6. 后端保存文件到指定目录
7. 后端创建文件记录到数据库
8. 后端返回文件信息给前端

#### 大文件分块上传实现
```javascript
// 前端代码示例
async function uploadLargeFile(file, chunkSize = 5 * 1024 * 1024) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = generateFileId();

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', i);
    formData.append('totalChunks', totalChunks);
    formData.append('fileId', fileId);
    formData.append('originalName', file.name);
    formData.append('fileSize', file.size);

    await axios.post('/api/upload/chunk', formData, {
      onUploadProgress: progressEvent => {
        const percentCompleted = Math.round(
          ((i * chunkSize + progressEvent.loaded) / file.size) * 100
        );
        updateProgress(percentCompleted);
      }
    });
  }

  // 通知服务器合并所有分块
  await axios.post('/api/upload/complete', { fileId });
}
```

```javascript
// 后端代码示例
const uploadChunks = multer({ dest: 'temp/chunks/' });

app.post('/api/upload/chunk', uploadChunks.single('file'), async (req, res) => {
  const { chunkIndex, totalChunks, fileId, originalName, fileSize } = req.body;
  const chunkPath = req.file.path;

  // 保存分块信息到临时存储
  tempStorage[fileId] = tempStorage[fileId] || { chunks: [], info: {} };
  tempStorage[fileId].chunks[chunkIndex] = chunkPath;
  tempStorage[fileId].info = { originalName, fileSize, totalChunks };

  res.json({ success: true, chunkIndex });
});

app.post('/api/upload/complete', async (req, res) => {
  const { fileId } = req.body;
  const { chunks, info } = tempStorage[fileId];

  // 创建新文件记录
  const fileRecord = await File.create({
    userId: req.user.id,
    originalName: info.originalName,
    size: info.fileSize,
    // ...其他字段
  });

  // 合并分块
  const filePath = path.join(getUserUploadDir(req.user.id, fileRecord.type), `file_${fileRecord._id}`);
  const writeStream = fs.createWriteStream(filePath);

  for (let i = 0; i < info.totalChunks; i++) {
    const chunkPath = chunks[i];
    const chunkData = fs.readFileSync(chunkPath);
    writeStream.write(chunkData);
    fs.unlinkSync(chunkPath); // 删除临时分块文件
  }

  writeStream.end();

  // 更新文件记录
  fileRecord.fileId = `file_${fileRecord._id}`;
  await fileRecord.save();

  // 清理临时存储
  delete tempStorage[fileId];

  res.json({ success: true, file: fileRecord });
});
```

### 文件夹管理

#### 创建文件夹
```javascript
// 前端代码
async function createFolder(name, parentId, type) {
  const response = await axios.post('/api/folders', {
    name,
    parentId,
    type
  });

  return response.data;
}

// 后端代码
app.post('/api/folders', authenticateUser, async (req, res) => {
  const { name, parentId, type } = req.body;

  // 验证父文件夹是否存在且属于当前用户
  if (parentId) {
    const parentFolder = await Folder.findOne({ _id: parentId, userId: req.user.id });
    if (!parentFolder) {
      return res.status(404).json({ error: 'Parent folder not found' });
    }
  }

  // 创建文件夹记录
  const folder = await Folder.create({
    userId: req.user.id,
    name,
    type,
    parentId,
    path: parentId ? parentFolder.path + '/' + name : '/'
  });

  // 创建物理文件夹
  const folderPath = path.join(
    getBaseUploadDir(),
    type,
    req.user.id.toString(),
    parentId ? parentFolder.folderId : '',
    `folder_${folder._id}`
  );

  fs.mkdirSync(folderPath, { recursive: true });

  // 更新文件夹记录
  folder.folderId = `folder_${folder._id}`;
  await folder.save();

  res.json(folder);
});
```

#### 移动文件/文件夹
```javascript
// 前端代码
async function moveItems(items, targetFolderId) {
  const response = await axios.put('/api/items/move', {
    items,
    targetFolderId
  });

  return response.data;
}

// 后端代码
app.put('/api/items/move', authenticateUser, async (req, res) => {
  const { items, targetFolderId } = req.body;
  const results = [];

  for (const item of items) {
    if (item.type === 'file') {
      const file = await File.findOne({ _id: item.id, userId: req.user.id });
      if (!file) continue;

      // 获取目标文件夹路径
      let targetPath;
      if (targetFolderId) {
        const targetFolder = await Folder.findOne({ _id: targetFolderId, userId: req.user.id });
        if (!targetFolder) continue;
        targetPath = targetFolder.path;
        file.parentId = targetFolderId;
      } else {
        targetPath = '/';
        file.parentId = null;
      }

      // 更新文件路径
      file.path = targetPath;
      await file.save();

      // 移动物理文件
      const oldPath = getFilePath(file);
      const newPath = getFilePath(file);

      fs.renameSync(oldPath, newPath);

      results.push({ id: file._id, type: 'file', success: true });
    } else if (item.type === 'folder') {
      const folder = await Folder.findOne({ _id: item.id, userId: req.user.id });
      if (!folder) continue;

      // 获取目标文件夹路径
      let targetPath;
      if (targetFolderId) {
        const targetFolder = await Folder.findOne({ _id: targetFolderId, userId: req.user.id });
        if (!targetFolder) continue;
        targetPath = targetFolder.path;
        folder.parentId = targetFolderId;
      } else {
        targetPath = '/';
        folder.parentId = null;
      }

      // 更新文件夹路径
      const oldPath = folder.path;
      folder.path = targetPath + '/' + folder.name;
      await folder.save();

      // 移动物理文件夹
      const oldPhysicalPath = getFolderPath(folder);
      const newPhysicalPath = getFolderPath(folder);

      fs.renameSync(oldPhysicalPath, newPhysicalPath);

      // 更新所有子文件和子文件夹的路径
      await updateChildPaths(folder._id, oldPath, folder.path);

      results.push({ id: folder._id, type: 'folder', success: true });
    }
  }

  res.json({ results });
});

async function updateChildPaths(folderId, oldPath, newPath) {
  // 更新子文件夹
  const childFolders = await Folder.find({ parentId: folderId });
  for (const childFolder of childFolders) {
    const oldChildPath = childFolder.path;
    childFolder.path = childFolder.path.replace(oldPath, newPath);
    await childFolder.save();

    // 递归更新子文件夹的子项
    await updateChildPaths(childFolder._id, oldChildPath, childFolder.path);
  }

  // 更新子文件
  const childFiles = await File.find({ parentId: folderId });
  for (const childFile of childFiles) {
    childFile.path = childFile.path.replace(oldPath, newPath);
    await childFile.save();
  }
}
```

### 文件删除

#### 软删除实现
```javascript
// 前端代码
async function deleteItems(items) {
  const response = await axios.delete('/api/items', { data: { items } });

  return response.data;
}

// 后端代码
app.delete('/api/items', authenticateUser, async (req, res) => {
  const { items } = req.body;
  const results = [];

  for (const item of items) {
    if (item.type === 'file') {
      const file = await File.findOne({ _id: item.id, userId: req.user.id });
      if (!file) continue;

      // 标记为已删除
      file.isDeleted = true;
      await file.save();

      // 将文件移动到备份目录
      const oldPath = getFilePath(file);
      const newPath = path.join(
        getBaseUploadDir(),
        'backup',
        req.user.id.toString(),
        file.parentId ? getFolderById(file.parentId).folderId : '',
        file.fileId
      );

      fs.ensureDirSync(path.dirname(newPath));
      fs.renameSync(oldPath, newPath);

      results.push({ id: file._id, type: 'file', success: true });
    } else if (item.type === 'folder') {
      const folder = await Folder.findOne({ _id: item.id, userId: req.user.id });
      if (!folder) continue;

      // 标记为已删除
      folder.isDeleted = true;
      await folder.save();

      // 将文件夹移动到备份目录
      const oldPath = getFolderPath(folder);
      const newPath = path.join(
        getBaseUploadDir(),
        'backup',
        req.user.id.toString(),
        folder.parentId ? getFolderById(folder.parentId).folderId : '',
        folder.folderId
      );

      fs.ensureDirSync(path.dirname(newPath));
      fs.renameSync(oldPath, newPath);

      // 递归删除所有子文件和子文件夹
      await deleteChildItems(folder._id);

      results.push({ id: folder._id, type: 'folder', success: true });
    }
  }

  res.json({ results });
});

async function deleteChildItems(folderId) {
  // 标记子文件夹为已删除
  const childFolders = await Folder.find({ parentId: folderId });
  for (const childFolder of childFolders) {
    childFolder.isDeleted = true;
    await childFolder.save();

    // 递归删除子文件夹的子项
    await deleteChildItems(childFolder._id);
  }

  // 标记子文件为已删除
  const childFiles = await File.find({ parentId: folderId });
  for (const childFile of childFiles) {
    childFile.isDeleted = true;
    await childFile.save();
  }
}
```

### 文件分享

#### 生成分享链接
```javascript
// 前端代码
async function createShareLink(fileId, authType, options = {}) {
  const response = await axios.post('/api/share-links', {
    fileId,
    authType,
    ...options
  });

  return response.data;
}

// 后端代码
app.post('/api/share-links', authenticateUser, async (req, res) => {
  const { fileId, authType, expirationDate, maxAccessCount, password } = req.body;

  // 验证文件是否存在且属于当前用户
  const file = await File.findOne({ _id: fileId, userId: req.user.id });
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // 生成分享码
  const shareCode = uuidv4();

  // 创建分享链接记录
  const shareLink = await ShareLink.create({
    fileId,
    userId: req.user.id,
    shareCode,
    authType,
    password: authType === 'account' ? bcrypt.hashSync(password, 10) : null,
    accessCode: authType === 'code' ? generateAccessCode() : null,
    expirationDate: expirationDate ? new Date(expirationDate) : null,
    maxAccessCount: maxAccessCount || null,
    currentAccessCount: 0,
    isActive: true
  });

  res.json(shareLink);
});
```

#### 访问分享文件
```javascript
// 前端代码
async function accessSharedFile(shareCode, authData = {}) {
  const response = await axios.post(`/api/shared/${shareCode}`, authData);

  return response.data;
}

// 后端代码
app.post('/api/shared/:shareCode', async (req, res) => {
  const { shareCode } = req.params;
  const { password, accessCode } = req.body;

  // 查找分享链接
  const shareLink = await ShareLink.findOne({ shareCode, isActive: true });
  if (!shareLink) {
    return res.status(404).json({ error: 'Share link not found or inactive' });
  }

  // 检查是否过期
  if (shareLink.expirationDate && new Date() > shareLink.expirationDate) {
    return res.status(403).json({ error: 'Share link has expired' });
  }

  // 检查访问次数限制
  if (shareLink.maxAccessCount && shareLink.currentAccessCount >= shareLink.maxAccessCount) {
    return res.status(403).json({ error: 'Maximum access count reached' });
  }

  // 根据认证类型验证访问权限
  if (shareLink.authType === 'account') {
    if (!password || !bcrypt.compareSync(password, shareLink.password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } else if (shareLink.authType === 'code') {
    if (!accessCode || accessCode !== shareLink.accessCode) {
      return res.status(401).json({ error: 'Invalid access code' });
    }
  }

  // 增加访问计数
  shareLink.currentAccessCount += 1;
  await shareLink.save();

  // 获取文件信息
  const file = await File.findById(shareLink.fileId);
  if (!file || file.isDeleted) {
    return res.status(404).json({ error: 'File not found' });
  }

  // 返回文件信息
  res.json({
    file: {
      id: file._id,
      name: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      downloadUrl: `/api/download/shared/${shareCode}`
    }
  });
});
```

### 公共文件访问

#### 公共文件认证系统
```javascript
// 前端代码
async function loginToPublicFolder(username) {
  const response = await axios.post('/api/public/login', { username });

  return response.data;
}

// 后端代码
app.post('/api/public/login', async (req, res) => {
  const { username } = req.body;

  // 查找用户
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 生成验证码
  const verificationCode = generateVerificationCode();

  // 创建通知
  await Notification.create({
    userId: user._id,
    type: 'public_access',
    content: `Verification code for public folder access: ${verificationCode}`,
    isRead: false
  });

  // 临时存储验证码
  tempCodes[username] = {
    code: verificationCode,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10分钟后过期
  };

  res.json({ message: 'Verification code sent to user' });
});

app.post('/api/public/verify', async (req, res) => {
  const { username, code } = req.body;

  // 验证验证码
  const tempCode = tempCodes[username];
  if (!tempCode || tempCode.code !== code || Date.now() > tempCode.expiresAt) {
    return res.status(401).json({ error: 'Invalid or expired verification code' });
  }

  // 查找用户
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 创建会话
  const sessionToken = generateSessionToken();
  sessions[sessionToken] = {
    userId: user._id,
    type: 'public_access',
    createdAt: Date.now()
  };

  res.json({ sessionToken });
});

app.get('/api/public/files', authenticatePublicSession, async (req, res) => {
  const userId = req.session.userId;
  const folderId = req.query.folderId;

  // 构建查询条件
  const query = {
    userId,
    type: 'public',
    isDeleted: false
  };

  if (folderId) {
    query.parentId = folderId;
  } else {
    query.parentId = null;
  }

  // 获取文件和文件夹
  const files = await File.find(query);
  const folders = await Folder.find(query);

  res.json({ files, folders });
});
```

### 文件预览

#### 文件预览实现
```javascript
// 前端代码
async function previewFile(fileId) {
  const response = await axios.get(`/api/files/${fileId}/preview`);

  return response.data;
}

// 后端代码
app.get('/api/files/:fileId/preview', authenticateUser, async (req, res) => {
  const { fileId } = req.params;

  // 查找文件
  const file = await File.findOne({ _id: fileId, userId: req.user.id });
  if (!file || file.isDeleted) {
    return res.status(404).json({ error: 'File not found' });
  }

  // 获取文件路径
  const filePath = getFilePath(file);

  // 根据文件类型返回不同的预览方式
  const mimeType = file.mimeType;

  if (mimeType.startsWith('image/')) {
    // 图片预览
    res.sendFile(filePath);
  } else if (mimeType === 'application/pdf') {
    // PDF预览
    res.sendFile(filePath);
  } else if (
    mimeType.includes('word') || 
    mimeType.includes('document') || 
    mimeType.includes('excel') || 
    mimeType.includes('spreadsheet') || 
    mimeType.includes('powerpoint') || 
    mimeType.includes('presentation')
  ) {
    // Office文档预览，使用在线预览服务
    const previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(getFileUrl(file))}`;
    res.json({ previewType: 'iframe', url: previewUrl });
  } else if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    // 压缩文件预览，返回文件列表
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    const fileList = zipEntries.map(entry => ({
      name: entry.entryName,
      size: entry.header.size,
      isDirectory: entry.isDirectory
    }));

    res.json({ previewType: 'zip', files: fileList });
  } else if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
    // 文本文件预览
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ previewType: 'text', content });
  } else {
    // 不支持的预览类型
    res.json({ previewType: 'unsupported' });
  }
});
```

### 文件下载

#### 文件下载实现
```javascript
// 前端代码
async function downloadFile(fileId) {
  const response = await axios.get(`/api/files/${fileId}/download`, {
    responseType: 'blob'
  });

  // 创建下载链接
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', response.headers['x-file-name']);
  document.body.appendChild(link);
  link.click();

  // 清理
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

// 后端代码
app.get('/api/files/:fileId/download', authenticateUser, async (req, res) => {
  const { fileId } = req.params;

  // 查找文件
  const file = await File.findOne({ _id: fileId, userId: req.user.id });
  if (!file || file.isDeleted) {
    return res.status(404).json({ error: 'File not found' });
  }

  // 获取文件路径
  const filePath = getFilePath(file);

  // 增加下载计数
  file.downloadCount += 1;
  await file.save();

  // 设置响应头
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('X-File-Name', file.originalName);

  // 发送文件
  res.sendFile(filePath);
});
```

### 文件系统缓存

#### 内存缓存实现
```javascript
// 使用Node.js缓存模块
const NodeCache = require('node-cache');
const fileCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 缓存5分钟，每60秒检查过期

// 获取目录内容（带缓存）
async function getDirectoryContents(userId, type, folderId) {
  const cacheKey = `dir_${userId}_${type}_${folderId || 'root'}`;

  // 尝试从缓存获取
  const cachedData = fileCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // 构建查询条件
  const query = {
    userId,
    type,
    isDeleted: false
  };

  if (folderId) {
    query.parentId = folderId;
  } else {
    query.parentId = null;
  }

  // 从数据库获取文件和文件夹
  const files = await File.find(query).lean();
  const folders = await Folder.find(query).lean();

  // 构建结果
  const result = {
    files: files.map(file => ({
      id: file._id,
      name: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    })),
    folders: folders.map(folder => ({
      id: folder._id,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    }))
  };

  // 存入缓存
  fileCache.set(cacheKey, result);

  return result;
}

// 清除目录缓存
function clearDirectoryCache(userId, type, folderId) {
  const cacheKey = `dir_${userId}_${type}_${folderId || 'root'}`;
  fileCache.del(cacheKey);
}

// 当文件或文件夹发生变化时，清除相关缓存
app.post('/api/folders', authenticateUser, async (req, res) => {
  // ... 创建文件夹逻辑

  // 清除父目录缓存
  clearDirectoryCache(req.user.id, req.body.type, req.body.parentId);

  // ... 返回结果
});

app.put('/api/items/move', authenticateUser, async (req, res) => {
  // ... 移动文件/文件夹逻辑

  // 清除相关目录缓存
  for (const item of req.body.items) {
    if (item.type === 'file') {
      const file = await File.findOne({ _id: item.id });
      clearDirectoryCache(req.user.id, file.type, file.parentId);
    } else if (item.type === 'folder') {
      const folder = await Folder.findOne({ _id: item.id });
      clearDirectoryCache(req.user.id, folder.type, folder.parentId);
    }
  }

  // 清除目标目录缓存
  if (req.body.targetFolderId) {
    const targetFolder = await Folder.findOne({ _id: req.body.targetFolderId });
    clearDirectoryCache(req.user.id, targetFolder.type, targetFolder.parentId);
  } else {
    clearDirectoryCache(req.user.id, 'private', null);
    clearDirectoryCache(req.user.id, 'public', null);
  }

  // ... 返回结果
});
```

### 文件系统备份

#### 备份实现
```javascript
// 创建文件系统备份
async function createFileSystemBackup() {
  const backupDir = path.join(getBaseUploadDir(), 'backups', Date.now().toString());
  fs.ensureDirSync(backupDir);

  // 备份数据库
  const dbBackupPath = path.join(backupDir, 'database.json');
  const files = await File.find({}).lean();
  const folders = await Folder.find({}).lean();
  const shareLinks = await ShareLink.find({}).lean();

  fs.writeFileSync(dbBackupPath, JSON.stringify({ files, folders, shareLinks }, null, 2));

  // 备份文件系统树
  const fsTreePath = path.join(backupDir, 'file-system-tree.json');
  const fsTree = await buildFileSystemTree();

  fs.writeFileSync(fsTreePath, JSON.stringify(fsTree, null, 2));

  // 备份物理文件
  const filesBackupDir = path.join(backupDir, 'files');
  fs.copySync(path.join(getBaseUploadDir(), 'files'), filesBackupDir);

  return backupDir;
}

// 构建文件系统树
async function buildFileSystemTree() {
  const tree = {
    private: {},
    public: {},
    backup: {}
  };

  // 获取所有用户
  const users = await User.find({}).lean();

  for (const user of users) {
    const userId = user._id.toString();

    // 获取用户的私有文件夹
    const privateFolders = await Folder.find({ userId, type: 'private', isDeleted: false }).lean();
    tree.private[userId] = buildFolderTree(privateFolders);

    // 获取用户的公共文件夹
    const publicFolders = await Folder.find({ userId, type: 'public', isDeleted: false }).lean();
    tree.public[userId] = buildFolderTree(publicFolders);

    // 获取用户的备份文件夹
    const backupFolders = await Folder.find({ userId, type: 'backup', isDeleted: false }).lean();
    tree.backup[userId] = buildFolderTree(backupFolders);
  }

  return tree;
}

// 构建文件夹树
function buildFolderTree(folders) {
  const folderMap = {};
  const rootFolders = [];

  // 创建文件夹映射
  for (const folder of folders) {
    folderMap[folder._id.toString()] = {
      id: folder._id.toString(),
      name: folder.name,
      folderId: folder.folderId,
      path: folder.path,
      children: []
    };
  }

  // 构建文件夹树
  for (const folder of folders) {
    const folderId = folder._id.toString();
    const parentId = folder.parentId ? folder.parentId.toString() : null;

    if (parentId && folderMap[parentId]) {
      folderMap[parentId].children.push(folderMap[folderId]);
    } else {
      rootFolders.push(folderMap[folderId]);
    }
  }

  return rootFolders;
}

// 恢复文件系统备份
async function restoreFileSystemBackup(backupDir) {
  // 恢复数据库
  const dbBackupPath = path.join(backupDir, 'database.json');
  const dbBackup = JSON.parse(fs.readFileSync(dbBackupPath, 'utf8'));

  await File.deleteMany({});
  await Folder.deleteMany({});
  await ShareLink.deleteMany({});

  await File.insertMany(dbBackup.files);
  await Folder.insertMany(dbBackup.folders);
  await ShareLink.insertMany(dbBackup.shareLinks);

  // 恢复文件系统树
  const fsTreePath = path.join(backupDir, 'file-system-tree.json');
  const fsTree = JSON.parse(fs.readFileSync(fsTreePath, 'utf8'));

  await restoreFileSystemTree(fsTree);

  // 恢复物理文件
  const filesBackupDir = path.join(backupDir, 'files');
  const filesDir = path.join(getBaseUploadDir(), 'files');

  fs.emptyDirSync(filesDir);
  fs.copySync(filesBackupDir, filesDir);

  return true;
}

// 恢复文件系统树
async function restoreFileSystemTree(fsTree) {
  // 恢复私有文件夹
  for (const userId in fsTree.private) {
    await restoreFolderTree(userId, 'private', fsTree.private[userId]);
  }

  // 恢复公共文件夹
  for (const userId in fsTree.public) {
    await restoreFolderTree(userId, 'public', fsTree.public[userId]);
  }

  // 恢复备份文件夹
  for (const userId in fsTree.backup) {
    await restoreFolderTree(userId, 'backup', fsTree.backup[userId]);
  }
}

// 恢复文件夹树
async function restoreFolderTree(userId, type, folders) {
  for (const folder of folders) {
    // 创建文件夹
    const folderPath = path.join(
      getBaseUploadDir(),
      type,
      userId,
      folder.path,
      folder.folderId
    );

    fs.ensureDirSync(folderPath);

    // 递归恢复子文件夹
    if (folder.children && folder.children.length > 0) {
      await restoreFolderTree(userId, type, folder.children);
    }
  }
}
```

## 安全性考虑

### 文件上传安全
- 验证文件类型和扩展名
- 限制文件大小
- 扫描上传的文件是否有恶意内容
- 使用随机文件名防止路径遍历攻击
- 限制上传频率

### 文件访问安全
- 实施严格的访问控制
- 使用HTTPS加密传输
- 实施会话管理
- 限制下载速度和频率
- 记录所有文件访问日志

### 数据安全
- 定期备份数据
- 加密敏感数据
- 实施数据保留策略
- 安全删除敏感数据
- 实施数据完整性检查

## 性能优化

### 文件上传优化
- 使用分块上传大文件
- 实现断点续传功能
- 使用CDN加速文件传输
- 压缩上传的文件
- 使用多线程上传

### 文件访问优化
- 使用缓存减少数据库查询
- 实现文件预加载
- 使用CDN加速文件下载
- 实现文件预览功能
- 使用索引加速数据库查询

### 存储优化
- 使用文件压缩减少存储空间
- 实施文件去重
- 使用分层存储策略
- 定期清理无用文件
- 使用云存储服务扩展存储容量

## 监控和日志

### 系统监控
- 监控磁盘使用情况
- 监控文件上传和下载速度
- 监控系统响应时间
- 监控错误率和异常
- 设置警报机制

### 日志记录
- 记录所有文件操作
- 记录用户访问日志
- 记录系统错误和异常
- 定期分析日志
- 实施日志轮转策略

## 总结

本文件存储系统设计提供了类似Google Drive或百度网盘的功能，支持私有、公共和共享文件管理。通过使用数据库索引和物理文件系统相结合的方式，实现了高效的文件存储和检索。系统还实现了文件上传、下载、预览、分享等功能，并考虑了安全性和性能优化。
