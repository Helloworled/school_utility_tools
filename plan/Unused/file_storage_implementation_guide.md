# 文件存储系统升级实施指南

## 概述

本文档说明如何将新编写的文件存储系统计划与现有系统相结合。

## 阶段一：数据库模型升级

### 1.1 更新File模型

**操作步骤：**
1. 备份现有的File.js
   ```bash
   cd backend/models
   cp File.js File_backup.js
   ```

2. 使用新的File_new.js替换File.js
   ```bash
   cp File_new.js File.js
   ```

3. 删除临时文件
   ```bash
   rm File_new.js
   ```

**主要变更：**
- 添加了`downloadable`字段（默认值：true）
- 添加了字段验证（trim、maxlength、min等）
- 添加了更多索引
- 添加了自动更新updatedAt的中间件
- 添加了虚拟字段`formattedSize`

### 1.2 更新Folder模型

**操作步骤：**
1. 备份现有的Folder.js
   ```bash
   cd backend/models
   cp Folder.js Folder_backup.js
   ```

2. 使用新的Folder_new.js替换Folder.js
   ```bash
   cp Folder_new.js Folder.js
   ```

3. 删除临时文件
   ```bash
   rm Folder_new.js
   ```

**主要变更：**
- 添加了更多字段验证
- 添加了更多索引
- 添加了自动更新updatedAt的中间件
- 添加了虚拟字段`fullPath`

### 1.3 添加FileSystemBackup模型

**操作步骤：**
1. FileSystemBackup.js已经创建在backend/models/目录下
2. 无需额外操作

**功能说明：**
- 创建文件系统备份
- 从备份恢复文件系统
- 验证备份完整性

## 阶段二：路由升级

### 2.1 更新文件路由

**操作步骤：**
1. 备份现有的fileRoutes.js
   ```bash
   cd backend/routes
   cp fileRoutes.js fileRoutes_backup.js
   ```

2. 合并fileRoutes_enhanced.js到fileRoutes.js
   - 手动合并两个文件
   - 保留现有的上传功能
   - 添加批量上传功能
   - 添加文件移动功能
   - 添加文件类型切换功能
   - 添加文件恢复功能

3. 删除临时文件
   ```bash
   rm fileRoutes_enhanced.js
   ```

**新增端点：**
- POST /api/files/upload/multiple - 批量上传
- PUT /api/files/:id/move - 移动文件
- PUT /api/files/:id/type - 切换文件类型
- POST /api/files/:id/restore - 恢复文件

### 2.2 更新文件夹路由

**操作步骤：**
1. 创建folderRoutes.js（如果不存在）
   ```bash
   cd backend/routes
   touch folderRoutes.js
   ```

2. 使用folderRoutes_enhanced.js的内容
   ```bash
   cp folderRoutes_enhanced.js folderRoutes.js
   ```

3. 删除临时文件
   ```bash
   rm folderRoutes_enhanced.js
   ```

**新增端点：**
- POST /api/folders - 创建文件夹
- DELETE /api/folders/:id - 删除文件夹
- POST /api/folders/:id/restore - 恢复文件夹
- PUT /api/folders/:id/move - 移动文件夹

### 2.3 添加公共文件路由

**操作步骤：**
1. publicRoutes.js已经创建在backend/routes/目录下
2. 在server.js中注册路由

**新增端点：**
- POST /api/public/send-code - 发送验证码
- POST /api/public/login - 公共文件登录
- GET /api/public/files/:userId - 获取公共文件列表
- GET /api/public/files/:fileId/download - 下载公共文件
- POST /api/public/ping - 心跳检测
- POST /api/public/logout - 登出

### 2.4 添加预览路由

**操作步骤：**
1. previewRoutes.js已经创建在backend/routes/目录下
2. 在server.js中注册路由

**新增端点：**
- GET /api/preview/files/:id - 文件预览

## 阶段三：服务器配置

### 3.1 更新server.js

**操作步骤：**
1. 在server.js中添加新的路由
   ```javascript
   const fileRoutes = require('./routes/fileRoutes');
   const folderRoutes = require('./routes/folderRoutes');
   const publicRoutes = require('./routes/publicRoutes');
   const previewRoutes = require('./routes/previewRoutes');

   // 注册路由
   app.use('/api/files', fileRoutes);
   app.use('/api/folders', folderRoutes);
   app.use('/api/public', publicRoutes);
   app.use('/api/preview', previewRoutes);
   ```

2. 添加环境变量配置
   ```javascript
   // 在server.js顶部添加
   require('dotenv').config();

   // 确保以下环境变量已设置
   // PUBLIC_SESSION_SECRET
   // JWT_SECRET
   // JWT_REFRESH_SECRET
   // MONGODB_URI
   ```

### 3.2 更新.env文件

**操作步骤：**
1. 在项目根目录创建或更新.env文件
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

## 阶段四：前端升级

### 4.1 更新FileList.vue

**需要添加的功能：**
1. 文件拖拽移动
2. 批量操作
3. 文件预览功能
4. 文件类型切换按钮
5. 回收站视图

**操作步骤：**
1. 在FileList.vue中添加拖拽事件处理
2. 添加批量选择功能
3. 添加文件预览对话框
4. 添加类型切换按钮
5. 添加回收站标签页

### 4.2 更新files.js store

**需要添加的方法：**
1. moveFile - 移动文件
2. changeFileType - 切换类型
3. restoreFile - 恢复文件
4. previewFile - 预览文件

**操作步骤：**
1. 在src/stores/files.js中添加新方法
2. 更新API调用

### 4.3 创建新组件

**需要创建的组件：**
1. FilePreview.vue - 文件预览组件
2. PublicFileLogin.vue - 公共文件登录组件
3. RecycleBin.vue - 回收站组件

**操作步骤：**
1. 在src/views/files/目录下创建新组件
2. 在router中注册新路由

## 阶段五：测试

### 5.1 后端测试

**测试项目：**
1. 文件上传
   - 单文件上传
   - 批量文件上传
   - 中文文件名处理
   - 文件类型验证

2. 文件管理
   - 文件列表查询
   - 文件下载
   - 文件删除
   - 文件恢复
   - 文件移动
   - 文件类型切换

3. 文件夹管理
   - 创建文件夹
   - 删除文件夹
   - 恢复文件夹
   - 移动文件夹

4. 公共文件访问
   - 发送验证码
   - 公共文件登录
   - 公共文件列表
   - 公共文件下载
   - 心跳检测

5. 文件预览
   - 图片预览
   - PDF预览
   - 文本预览
   - Office文档预览

### 5.2 前端测试

**测试项目：**
1. 文件列表页面
   - 类型切换
   - 文件夹导航
   - 文件搜索
   - 分页加载

2. 文件上传
   - 拖拽上传
   - 常规上传
   - 批量上传

3. 文件管理
   - 创建文件夹
   - 移动文件/文件夹
   - 删除/恢复

4. 文件预览
   - 图片预览
   - 文档预览
   - Office文档预览

5. 公共文件访问
   - 登录功能
   - 文件浏览
   - 文件下载

## 阶段六：部署

### 6.1 数据迁移

**操作步骤：**
1. 为现有File记录添加downloadable字段
   ```javascript
   // 在MongoDB中执行
   db.files.updateMany(
     { downloadable: { $exists: false } },
     { $set: { downloadable: true } }
   );
   ```

2. 创建初始备份
   ```javascript
   // 在server启动时执行
   const { createBackup } = require('./models/FileSystemBackup');
   createBackup();
   ```

### 6.2 依赖安装

**需要安装的新依赖：**
```bash
cd backend
npm install express-session
```

### 6.3 启动服务

**操作步骤：**
1. 重启后端服务
   ```bash
   cd backend
   npm start
   ```

2. 重启前端服务
   ```bash
   npm run serve
   ```

## 注意事项

1. **备份重要数据**
   - 在进行任何更改前备份数据库
   - 备份现有代码文件
   - 备份uploads目录

2. **逐步实施**
   - 每个阶段完成后进行测试
   - 确保不破坏现有功能
   - 发现问题及时修复

3. **文档更新**
   - 更新API文档
   - 更新用户指南
   - 记录新增功能

4. **性能监控**
   - 监控文件上传性能
   - 监控数据库查询性能
   - 优化慢查询

## 回滚计划

如果升级过程中遇到问题，可以按以下步骤回滚：

1. 恢复数据库模型
   ```bash
   cd backend/models
   cp File_backup.js File.js
   cp Folder_backup.js Folder.js
   ```

2. 恢复路由文件
   ```bash
   cd backend/routes
   cp fileRoutes_backup.js fileRoutes.js
   ```

3. 回滚数据库更改
   ```javascript
   // 在MongoDB中执行
   db.files.updateMany(
     { downloadable: { $exists: true } },
     { $unset: { downloadable: 1 } }
   );
   ```

## 总结

本升级方案采用渐进式扩展策略，在不破坏现有功能的基础上，逐步添加新功能。建议按照上述步骤逐步实施，并在每个阶段完成后进行充分测试。