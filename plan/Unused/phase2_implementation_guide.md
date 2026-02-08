# 阶段二：路由升级实施指南

## 概述

本指南详细说明如何实施"阶段二：路由升级"。我们已经创建了以下新文件：

1. `fileRoutes_complete.js` - 完整的文件路由（包含现有功能+新增功能）
2. `folderRoutes_enhanced.js` - 增强的文件夹路由
3. `publicRoutes.js` - 公共文件访问路由
4. `previewRoutes.js` - 文件预览路由

## 实施步骤

### 步骤1：备份现有文件

**重要：在进行任何更改前，请先备份现有文件！**

```bash
cd backend/routes

# 备份fileRoutes.js
copy fileRoutes.js fileRoutes_backup.js

# 如果folderRoutes.js存在，也备份它
if exist folderRoutes.js (
    copy folderRoutes.js folderRoutes_backup.js
)
```

### 步骤2：替换文件路由

**操作：**

1. 使用 `fileRoutes_complete.js`替换 `fileRoutes.js`
2. 或者手动合并两个文件（推荐）

**手动合并步骤：**

1. 打开 `fileRoutes.js`和 `fileRoutes_complete.js`
2. 对比两个文件，找出差异
3. 将 `fileRoutes_complete.js`中的新增功能添加到 `fileRoutes.js`
4. 保留现有的所有功能
5. 测试确保功能正常

**新增端点：**

- `POST /api/files/upload/multiple` - 批量文件上传
- `PUT /api/files/:id/move` - 移动文件
- `POST /api/files/:id/restore` - 恢复文件

### 步骤3：创建或更新文件夹路由

**操作：**

1. 如果 `folderRoutes.js`不存在，使用 `folderRoutes_enhanced.js`
2. 如果 `folderRoutes.js`存在，手动合并

**命令：**

```bash
cd backend/routes

# 如果folderRoutes.js不存在
if not exist folderRoutes.js (
    copy folderRoutes_enhanced.js folderRoutes.js
    del folderRoutes_enhanced.js
)
```

**新增端点：**

- `POST /api/folders` - 创建文件夹
- `DELETE /api/folders/:id` - 删除文件夹
- `POST /api/folders/:id/restore` - 恢复文件夹
- `PUT /api/folders/:id/move` - 移动文件夹

### 步骤4：添加公共文件路由

**操作：**

1. `publicRoutes.js`已经创建在 `backend/routes/`目录
2. 需要在 `server.js`中注册此路由

**新增端点：**

- `POST /api/public/send-code` - 发送验证码
- `POST /api/public/login` - 公共文件登录
- `GET /api/public/files/:userId` - 获取公共文件列表
- `GET /api/public/files/:fileId/download` - 下载公共文件
- `POST /api/public/ping` - 心跳检测
- `POST /api/public/logout` - 登出

### 步骤5：添加文件预览路由

**操作：**

1. `previewRoutes.js`已经创建在 `backend/routes/`目录
2. 需要在 `server.js`中注册此路由

**新增端点：**

- `GET /api/preview/files/:id` - 文件预览

### 步骤6：更新server.js

**需要在 `server.js`中添加以下内容：**

```javascript
// 导入新路由
const folderRoutes = require('./routes/folderRoutes');
const publicRoutes = require('./routes/publicRoutes');
const previewRoutes = require('./routes/previewRoutes');

// 注册路由
app.use('/api/folders', folderRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/preview', previewRoutes);
```

**完整的server.js路由注册示例：**

```javascript
const express = require('express');
const app = express();
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/folderRoutes');
const publicRoutes = require('./routes/publicRoutes');
const previewRoutes = require('./routes/previewRoutes');
// ... 其他路由

// 注册所有路由
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/preview', previewRoutes);
// ... 其他路由注册
```

### 步骤7：安装依赖

**需要安装的新依赖：**

```bash
cd backend
npm install express-session
```

### 步骤8：更新环境变量

**在 `.env`文件中添加以下配置：**

```bash
# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# 公共文件访问
PUBLIC_ACCESS_ENABLED=true
PUBLIC_SESSION_TIMEOUT=3600  # 1小时
PUBLIC_SESSION_SECRET=your_session_secret

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/school_utility_tools

# 服务器配置
PORT=5000
NODE_ENV=development
```

## 测试计划

### 1. 文件上传测试

**测试用例：**

- [ ] 单文件上传成功
- [ ] 批量文件上传成功
- [ ] 中文文件名正确处理
- [ ] 文件类型验证正常
- [ ] 文件大小限制正常
- [ ] 上传到不同文件夹
- [ ] 上传到不同类型（private/public/shared）

**测试命令：**

```bash
# 单文件上传
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "type=private"

# 批量上传
curl -X POST http://localhost:5000/api/files/upload/multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test1.pdf" \
  -F "files=@test2.pdf" \
  -F "type=private"
```

### 2. 文件管理测试

**测试用例：**

- [ ] 文件列表查询成功
- [ ] 分页功能正常
- [ ] 文件下载成功
- [ ] 文件删除成功（软删除）
- [ ] 文件恢复成功
- [ ] 文件移动成功
- [ ] 权限验证正常

**测试命令：**

```bash
# 获取文件列表
curl -X GET "http://localhost:5000/api/files?type=private&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 下载文件
curl -X GET "http://localhost:5000/api/files/FILE_ID/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded_file.pdf

# 删除文件
curl -X DELETE "http://localhost:5000/api/files/FILE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 恢复文件
curl -X POST "http://localhost:5000/api/files/FILE_ID/restore" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 移动文件
curl -X PUT "http://localhost:5000/api/files/FILE_ID/move" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetFolderId": "FOLDER_ID"}'
```

### 3. 文件夹管理测试

**测试用例：**

- [ ] 创建文件夹成功
- [ ] 删除文件夹成功（递归）
- [ ] 恢复文件夹成功（递归）
- [ ] 移动文件夹成功
- [ ] 循环引用检测正常

**测试命令：**

```bash
# 创建文件夹
curl -X POST http://localhost:5000/api/folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "测试文件夹", "type": "private"}'

# 删除文件夹
curl -X DELETE "http://localhost:5000/api/folders/FOLDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 恢复文件夹
curl -X POST "http://localhost:5000/api/folders/FOLDER_ID/restore" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 移动文件夹
curl -X PUT "http://localhost:5000/api/folders/FOLDER_ID/move" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetFolderId": "TARGET_FOLDER_ID"}'
```

### 4. 公共文件访问测试

**测试用例：**

- [ ] 发送验证码成功
- [ ] 公共文件登录成功
- [ ] 获取公共文件列表成功
- [ ] 下载公共文件成功（downloadable=true）
- [ ] 下载公共文件失败（downloadable=false）
- [ ] 心跳检测正常
- [ ] 登出成功

**测试命令：**

```bash
# 发送验证码
curl -X POST http://localhost:5000/api/public/send-code \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'

# 公共文件登录
curl -X POST http://localhost:5000/api/public/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "code": "123456"}'

# 获取公共文件列表
curl -X GET "http://localhost:5000/api/public/files/USER_ID" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# 下载公共文件
curl -X GET "http://localhost:5000/api/public/files/FILE_ID/download" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -o downloaded_file.pdf

# 心跳检测
curl -X POST http://localhost:5000/api/public/ping \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# 登出
curl -X POST http://localhost:5000/api/public/logout \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### 5. 文件预览测试

**测试用例：**

- [ ] 图片预览成功
- [ ] PDF预览成功
- [ ] 文本预览成功
- [ ] Office文档预览返回正确信息
- [ ] 压缩文件预览返回正确信息
- [ ] 不支持的类型返回下载提示

**测试命令：**

```bash
# 预览文件
curl -X GET "http://localhost:5000/api/preview/files/FILE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 注意事项

1. **备份重要**

   - 务必先备份现有文件
   - 测试新功能后再删除备份
2. **逐步实施**

   - 建议一次实施一个文件的路由
   - 每个路由测试通过后再进行下一个
3. **错误处理**

   - 所有新端点都包含完善的错误处理
   - 返回统一的错误响应格式
4. **权限验证**

   - 所有端点都包含权限验证
   - 确保用户只能访问自己的文件
5. **数据一致性**

   - 文件操作后更新备份
   - 确保数据库和文件系统同步

## 回滚计划

如果遇到问题，可以按以下步骤回滚：

1. 恢复备份的文件路由

```bash
cd backend/routes
copy fileRoutes_backup.js fileRoutes.js
if exist folderRoutes_backup.js (
    copy folderRoutes_backup.js folderRoutes.js
)
```

2. 删除新文件

```bash
del fileRoutes_complete.js
del folderRoutes_enhanced.js
```

3. 重启服务器

```bash
cd backend
npm start
```

## 下一步

完成阶段二后，请继续实施：

- **阶段三：服务器配置**

  - 更新server.js
  - 配置环境变量
- **阶段四：前端升级**

  - 更新FileList.vue
  - 更新files.js store
  - 创建新组件
- **阶段五：测试**

  - 后端功能测试
  - 前端功能测试
- **阶段六：部署**

  - 数据迁移
  - 依赖安装
  - 服务启动

## 问题排查

### 常见问题

**问题1：路由未生效**

- 检查server.js中是否正确注册路由
- 检查路由路径是否正确
- 重启服务器

**问题2：文件上传失败**

- 检查uploads目录权限
- 检查文件大小限制
- 检查文件类型白名单

**问题3：公共文件访问失败**

- 检查session配置
- 检查验证码是否过期
- 检查cookie设置

**问题4：文件预览失败**

- 检查文件是否存在
- 检查权限验证
- 检查MIME类型判断

## 总结

阶段二的路由升级已完成所有新路由文件的创建。请按照本指南的步骤逐步实施，并在每个步骤完成后进行充分测试。遇到问题请参考问题排查部分或回滚到备份版本。
