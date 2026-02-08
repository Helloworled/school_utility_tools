**Specific:**

## 简化的文件存储系统计划

### 1. 系统概述

针对小型用户群体(1-20人)的文件存储系统，采用MongoDB作为数据库，提供三种文件类型：

- **Private**: 私有文件，仅用户本人可见
- **Public**: 公共文件，通过验证码系统可公开访问
- **Shared**: 共享文件，所有用户可访问但不可删除

技术栈：

- 后端: Node.js + Express + MongoDB
- 前端: Vue.js + Vuetify
- 文件上传: Multer
- 认证: JWT + Session

核心功能：

- 文件上传（支持拖拽和批量上传）
- 文件管理（创建文件夹、移动、删除、恢复）
- 文件预览（PDF、Office文档、图片、压缩文件等）
- 文件类型切换
- 公共文件访问（验证码系统）

### 2. 文件存储结构

#### 2.1 物理存储结构

```
backend/uploads/files/
├── private/[userId]/
│   ├── File_[uuid]
│   └── Folder_[uuid]/
├── public/[userId]/
│   ├── File_[uuid]
│   └── Folder_[uuid]/
├── shared/
│   ├── File_[uuid]
│   └── Folder_[uuid]/
└── deleted/
    ├── File_[uuid]
    └── Folder_[uuid]/
```

#### 2.3 存储逻辑

1. **文件上传流程**

   - 接收文件后立即生成UUID
   - 根据文件类型确定存储目录
   - 将文件重命名为File_[uuid]并存储
   - 在数据库中记录原始文件名和路径
2. **文件夹创建流程**

   - 生成UUID作为folderId
   - 根据文件夹类型确定存储目录
   - 创建Folder_[folderId]目录
   - 在数据库中记录文件夹信息
3. **文件删除流程**

   - 将isDeleted标记为true
   - 将文件移动到deleted目录
   - 保留数据库记录
4. **文件恢复流程**

   - 将isDeleted标记为false
   - 根据文件类型将文件移回原目录
   - 更新数据库记录

### 3. 数据库模型 (MongoDB)

#### 3.1 文件模型 (File)

```javascript
const FileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  }, // 上传文件的用户ID
  fileId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  }, // 文件的唯一ID (UUID v4)
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  }, // 原始文件名
  type: { 
    type: String, 
    enum: ['private', 'public', 'shared'], 
    default: 'private',
    index: true
  }, // 文件类型
  mimeType: { 
    type: String, 
    required: true,
    trim: true
  }, // MIME类型
  size: { 
    type: Number, 
    required: true,
    min: 0
  }, // 文件大小(字节)
  path: { 
    type: String, 
    required: true 
  }, // 物理存储路径
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Folder', 
    default: null,
    index: true
  }, // 父文件夹ID (null表示根目录)
  downloadable: { 
    type: Boolean, 
    default: true 
  }, // 是否可下载 (仅对public文件有效)
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  }, // 是否已删除
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }, // 创建时间
  updatedAt: { 
    type: Date, 
    default: Date.now 
  } // 最后修改时间
});

// 复合索引
FileSchema.index({ userId: 1, type: 1, isDeleted: 1 });
FileSchema.index({ parentId: 1, isDeleted: 1 });
FileSchema.index({ fileId: 1 });

// 中间件：自动更新updatedAt
FileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 虚拟字段：文件大小格式化
FileSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});
```

#### 3.2 文件夹模型 (Folder)

```javascript
const FolderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  }, // 创建该文件夹的用户ID
  folderId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  }, // 文件夹的唯一ID (UUID v4)
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255
  }, // 文件夹原始名称
  type: { 
    type: String, 
    enum: ['private', 'public', 'shared'], 
    default: 'private',
    index: true
  }, // 文件夹类型
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Folder', 
    default: null,
    index: true
  }, // 父文件夹ID (null表示根目录)
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true
  }, // 是否已删除
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }, // 创建时间
  updatedAt: { 
    type: Date, 
    default: Date.now 
  } // 最后修改时间
});

// 复合索引
FolderSchema.index({ userId: 1, type: 1, isDeleted: 1 });
FolderSchema.index({ parentId: 1, isDeleted: 1 });
FolderSchema.index({ folderId: 1 });

// 中间件：自动更新updatedAt
FolderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 虚拟字段：完整路径
FolderSchema.virtual('fullPath').get(function() {
  // 递归构建完整路径
  const buildPath = async (folderId) => {
    if (!folderId) return '/';
    const folder = await this.constructor.findOne({ folderId });
    if (!folder) return '/';
    const parentPath = await buildPath(folder.parentId);
    return `${parentPath}${folder.name}/`;
  };
  return buildPath(this.folderId);
});
```

### 4. API端点设计

#### 4.1 文件上传

##### 4.1.1 单文件上传

- **端点**: `POST /api/files/upload`
- **认证**: 需要JWT token
- **请求**: multipart/form-data

  - file: 文件
  - type: private/public/shared (默认: private)
  - parentId: 文件夹ID(可选)
- **实现逻辑**:

  1. 验证JWT token和用户权限
  2. 验证文件类型(白名单机制)
  3. 验证文件大小(MAX_FILE_SIZE)
  4. 生成UUID作为fileId
  5. 根据type确定存储目录
  6. 使用Multer存储文件(重命名为File_[fileId])
  7. 在数据库中创建文件记录
  8. 更新备份JSON文件
- **错误处理**:

  - 400: 文件类型不允许
  - 400: 文件大小超出限制
  - 401: 未授权
  - 404: 父文件夹不存在
  - 500: 服务器错误
- **响应**:

  ```json
  {
    "success": true,
    "file": {
      "_id": "file_id",
      "fileId": "File_uuid",
      "name": "filename.ext",
      "type": "private",
      "size": 1024,
      "mimeType": "application/pdf",
      "downloadable": true,
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
  ```

##### 4.1.2 批量文件上传

- **端点**: `POST /api/files/upload/multiple`
- **认证**: 需要JWT token
- **请求**: multipart/form-data

  - files[]: 文件数组
  - type: private/public/shared (默认: private)
  - parentId: 文件夹ID(可选)
- **实现逻辑**:

  1. 验证JWT token和用户权限
  2. 遍历所有文件
  3. 对每个文件执行单文件上传逻辑
  4. 收集所有成功和失败的文件
  5. 更新备份JSON文件
- **响应**:

  ```json
  {
    "success": true,
    "uploaded": [
      {
        "_id": "file_id",
        "fileId": "File_uuid",
        "name": "filename.ext",
        "type": "private",
        "size": 1024,
        "mimeType": "application/pdf",
        "downloadable": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "failed": [
      {
        "name": "failed_file.txt",
        "error": "File type not allowed"
      }
    ]
  }
  ```

#### 4.2 文件列表

- **端点**: `GET /api/files`
- **认证**: 需要JWT token
- **查询参数**:

  - type: private/public/shared (默认: private)
  - parentId: 文件夹ID(可选)
  - page: 页码(可选，默认1)
  - limit: 每页数量(可选，默认20)
- **实现逻辑**:

  1. 验证JWT token和用户权限
  2. 构建查询条件(userId, type, isDeleted=false)
  3. 如果指定parentId，添加到查询条件
  4. 执行分页查询
  5. 返回文件和文件夹列表
- **错误处理**:

  - 401: 未授权
  - 400: 无效的type参数
  - 500: 服务器错误
- **响应**:

  ```json
  {
    "success": true,
    "files": [
      {
        "_id": "file_id",
        "fileId": "File_uuid",
        "name": "filename.ext",
        "type": "private",
        "size": 1024,
        "mimeType": "application/pdf",
        "downloadable": true,
        "parentId": null,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "folders": [
      {
        "_id": "folder_id",
        "folderId": "Folder_uuid",
        "name": "文件夹名称",
        "type": "private",
        "parentId": null,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
  ```

#### 4.3 文件下载

- **端点**: `GET /api/files/:id/download`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件ID或fileId
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件记录
  3. 验证用户是否有权限访问该文件
  4. 检查文件是否存在
  5. 设置Content-Disposition头(使用原始文件名)
  6. 发送文件流
- **错误处理**:
  - 401: 未授权
  - 403: 无权限访问
  - 404: 文件不存在
  - 500: 服务器错误
- **响应**: 文件流
  - Content-Type: 文件的MIME类型
  - Content-Disposition: attachment; filename="原始文件名.ext"

#### 4.4 文件删除(软删除)

- **端点**: `DELETE /api/files/:id`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件ID或fileId
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件记录
  3. 验证用户是否有权限删除该文件
  4. 将isDeleted标记为true
  5. 将文件移动到deleted目录
  6. 更新数据库记录
  7. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限删除
  - 404: 文件不存在
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "message": "文件已删除"
  }
  ```

#### 4.5 文件恢复

- **端点**: `POST /api/files/:id/restore`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件ID或fileId
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件记录(包括已删除的)
  3. 验证用户是否有权限恢复该文件
  4. 将isDeleted标记为false
  5. 根据文件类型将文件移回原目录
  6. 更新数据库记录
  7. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限恢复
  - 404: 文件不存在
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "message": "文件已恢复"
  }
  ```

#### 4.6 文件移动

- **端点**: `PUT /api/files/:id/move`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件ID或fileId
- **请求体**:
  ```json
  {
    "targetFolderId": "folder_id" // null表示移动到根目录
  }
  ```
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件记录
  3. 验证用户是否有权限移动该文件
  4. 验证目标文件夹是否存在且有权限
  5. 检查是否会造成循环引用(如果目标是子文件夹)
  6. 更新parentId
  7. 如果需要，移动物理文件到新目录
  8. 更新数据库记录
  9. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限移动
  - 404: 文件或目标文件夹不存在
  - 400: 循环引用
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "message": "文件已移动"
  }
  ```

#### 4.7 文件类型切换

- **端点**: `PUT /api/files/:id/type`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件ID或fileId
- **请求体**:
  ```json
  {
    "type": "public" // private/public/shared
  }
  ```
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件记录
  3. 验证用户是否有权限修改文件类型
  4. 验证新类型是否有效
  5. 将文件移动到对应的目录(private/public/shared)
  6. 更新type字段
  7. 更新数据库记录
  8. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限修改
  - 404: 文件不存在
  - 400: 无效的type参数
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "file": {
      "_id": "file_id",
      "type": "public"
    }
  }
  ```

#### 4.8 文件夹操作

##### 4.8.1 创建文件夹

- **端点**: `POST /api/folders`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "name": "文件夹名称",
    "type": "private",
    "parentId": "父文件夹ID或null"
  }
  ```
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 验证文件夹名称(长度、特殊字符等)
  3. 验证type参数是否有效
  4. 如果指定parentId，验证父文件夹是否存在且有权限
  5. 生成UUID作为folderId
  6. 根据type确定存储目录
  7. 创建Folder_[folderId]目录
  8. 在数据库中创建文件夹记录
  9. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 400: 无效的文件夹名称
  - 404: 父文件夹不存在
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "folder": {
      "_id": "folder_id",
      "folderId": "Folder_uuid",
      "name": "文件夹名称",
      "type": "private",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
  ```

##### 4.8.2 删除文件夹

- **端点**: `DELETE /api/folders/:id`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件夹ID或folderId
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件夹记录
  3. 验证用户是否有权限删除该文件夹
  4. 递归删除文件夹内的所有文件和子文件夹
  5. 将isDeleted标记为true
  6. 将文件夹移动到deleted目录
  7. 更新数据库记录
  8. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限删除
  - 404: 文件夹不存在
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "message": "文件夹已删除"
  }
  ```

##### 4.8.3 恢复文件夹

- **端点**: `POST /api/folders/:id/restore`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件夹ID或folderId
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件夹记录(包括已删除的)
  3. 验证用户是否有权限恢复该文件夹
  4. 递归恢复文件夹内的所有文件和子文件夹
  5. 将isDeleted标记为false
  6. 将文件夹移回原目录
  7. 更新数据库记录
  8. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限恢复
  - 404: 文件夹不存在
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "message": "文件夹已恢复"
  }
  ```

##### 4.8.4 移动文件夹

- **端点**: `PUT /api/folders/:id/move`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件夹ID或folderId
- **请求体**:
  ```json
  {
    "targetFolderId": "folder_id" // null表示移动到根目录
  }
  ```
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件夹记录
  3. 验证用户是否有权限移动该文件夹
  4. 验证目标文件夹是否存在且有权限
  5. 检查是否会造成循环引用(如果目标是子文件夹或自身)
  6. 递归移动文件夹内的所有文件和子文件夹
  7. 更新parentId
  8. 如果需要，移动物理文件夹到新目录
  9. 更新数据库记录
  10. 更新备份JSON文件
- **错误处理**:
  - 401: 未授权
  - 403: 无权限移动
  - 404: 文件夹或目标文件夹不存在
  - 400: 循环引用
  - 500: 服务器错误
- **响应**:
  ```json
  {
    "success": true,
    "message": "文件夹已移动"
  }
  ```

### 5. 文件预览

#### 5.1 支持的文件类型

##### 图片

- **格式**: jpg, jpeg, png, gif, svg, webp, bmp
- **预览方式**: 直接浏览器预览
- **实现**:
  - 使用img标签或Vuetify的v-img组件
  - 支持缩放和旋转
  - 支持全屏查看

##### 文档

- **格式**: pdf, txt, md
- **预览方式**: 使用简单的预览组件
- **实现**:
  - PDF: 使用pdf.js或vue-pdf组件
  - TXT/MD: 使用v-textarea或markdown编辑器

##### Office文档

- **格式**: docx, xlsx, pptx
- **预览方式**: 使用前端库进行预览
- **实现**:
  - DOCX: 使用mammoth.js转换为HTML
  - XLSX: 使用SheetJS(xlsx)预览
  - PPTX: 使用PptxGenJS或类似库

##### 压缩文件

- **格式**: zip, rar, 7z, tar, gz
- **预览方式**: 使用前端zip库查看内容
- **实现**:
  - ZIP: 使用JSZip库
  - RAR/7Z: 需要后端支持或使用WebAssembly
  - 显示压缩包内的文件列表
  - 支持解压单个文件

##### 其他类型

- **预览方式**: 提供下载链接
- **实现**:
  - 显示文件图标
  - 显示文件大小和类型
  - 提供下载按钮

#### 5.2 预览API

- **端点**: `GET /api/files/:id/preview`
- **认证**: 需要JWT token
- **参数**:
  - id: 文件ID或fileId
- **查询参数**:
  - page: 页码(仅对PDF有效)
  - size: 预览尺寸(仅对图片有效)
- **实现逻辑**:
  1. 验证JWT token和用户权限
  2. 查询文件记录
  3. 验证用户是否有权限访问该文件
  4. 检查文件是否存在
  5. 根据文件类型返回相应内容
- **错误处理**:
  - 401: 未授权
  - 403: 无权限访问
  - 404: 文件不存在
  - 415: 不支持的文件类型
  - 500: 服务器错误
- **响应**: 根据文件类型返回预览内容或文件流

### 6. 安全措施

#### 6.1 文件类型验证

- **MIME类型验证**

  - 使用file-type库检测真实文件类型
  - 与声明的MIME类型对比
  - 使用白名单机制
- **文件扩展名验证**

  - 验证文件扩展名是否在允许列表中
  - 防止双重扩展名攻击
  - 防止路径遍历攻击
- **内容验证**

  - 对图片文件验证文件头
  - 对Office文档验证文件结构

#### 6.2 文件大小限制

- **配置方式**: 在.env配置
- **默认限制**: 100MB
- **实现**:
  - 在Multer配置中设置limits
  - 前端也进行预验证
  - 提供友好的错误提示

#### 6.3 用户身份验证

- **JWT Token验证**

  - 所有API端点需要JWT token
  - 使用express-jwt中间件
  - Token过期时间: 24小时
  - 支持Token刷新
- **Session管理(公共文件)**

  - 使用express-session
  - 会话超时: 1小时
  - 页面关闭时清除会话
  - 使用心跳检测维持会话

#### 6.4 权限检查

- **私有文件**

  - 用户只能访问自己的文件
  - 验证userId匹配
  - 验证文件类型匹配
- **公共文件**

  - 需要会话验证或JWT验证(jwt针对已登录用户)
  - 只能访问(预览+下载)downloadable=true的文件(downloadable=true的文件依然会被列出)
  - 验证目标用户存在
- **共享文件**

  - 所有用户可查看
  - 所有用户可下载
  - 不能删除或移动

#### 6.5 文件名安全

- **重命名机制**

  - 所有文件重命名为唯一ID
  - 原始文件名存储在数据库中
  - 使用UUID v4确保唯一性
- **路径安全**

  - 防止路径遍历攻击
  - 使用path.join规范化路径
  - 验证路径在允许的目录内
- **编码处理**

  - 正确处理中文文件名
  - 使用UTF-8编码
  - 下载时使用Content-Disposition头

### 7. 环境变量

```bash
# 文件上传
UPLOAD_DIR=backend/uploads/files
MAX_FILE_SIZE=104857600  # 100MB
ALLOWED_FILE_TYPES=image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/*,application/zip,application/x-rar-compressed,application/x-7z-compressed

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

### 8. 实现步骤

#### 8.1 后端实现

##### 8.1.1 数据库模型

1. **创建File模型**

   - 定义Schema结构
   - 添加字段验证
   - 创建复合索引
   - 添加虚拟字段
   - 添加中间件
2. **创建Folder模型**

   - 定义Schema结构
   - 添加字段验证
   - 创建复合索引
   - 添加虚拟字段
   - 添加中间件
3. **创建备份模型**

   - 定义备份JSON结构
   - 实现备份更新逻辑
   - 实现备份恢复逻辑

##### 8.1.2 文件上传API

1. **配置Multer**

   - 设置存储目录
   - 配置文件大小限制
   - 实现文件名生成逻辑
   - 处理中文文件名
2. **实现单文件上传**

   - 验证文件类型
   - 生成UUID
   - 存储文件
   - 创建数据库记录
   - 更新备份
3. **实现批量上传**

   - 处理多个文件
   - 收集成功和失败的文件
   - 返回详细结果

##### 8.1.3 文件管理API

1. **文件列表查询**

   - 实现分页查询
   - 支持类型过滤
   - 支持文件夹过滤
2. **文件下载**

   - 验证权限
   - 设置响应头
   - 发送文件流
3. **文件删除**

   - 实现软删除
   - 移动文件到deleted目录
   - 更新数据库
4. **文件恢复**

   - 查找已删除文件
   - 移回原目录
   - 更新数据库
5. **文件移动**

   - 验证目标文件夹
   - 检查循环引用
   - 更新parentId
6. **文件类型切换**

   - 验证新类型
   - 移动文件到对应目录
   - 更新type字段

##### 8.1.4 文件夹管理API

1. **创建文件夹**

   - 验证文件夹名称
   - 生成UUID
   - 创建物理目录
2. **删除文件夹**

   - 递归删除内容
   - 移动到deleted目录
3. **恢复文件夹**

   - 递归恢复内容
   - 移回原目录
4. **移动文件夹**

   - 检查循环引用
   - 递归移动内容

##### 8.1.5 文件预览API

1. **图片预览**

   - 返回图片文件
   - 支持尺寸调整
2. **文档预览**

   - PDF: 返回文件流
   - TXT/MD: 返回文本内容
3. **Office文档预览**

   - 返回转换后的HTML
   - 或返回原始文件
4. **压缩文件预览**

   - 返回文件列表
   - 支持解压单个文件

##### 8.1.6 公共文件访问

1. **认证系统**

   - 实现验证码发送
   - 实现验证码验证
   - 创建会话
2. **会话管理**

   - 配置express-session
   - 实现心跳检测
   - 实现会话清理
3. **公共文件API**

   - 文件列表查询
   - 文件下载(带downloadable检查)

#### 8.2 前端实现

##### 8.2.1 文件列表页面

1. **布局设计**

   - 文件类型切换标签
   - 文件夹导航
   - 文件列表展示
   - 工具栏
2. **功能实现**

   - 类型切换
   - 文件夹导航
   - 文件搜索
   - 分页加载

##### 8.2.2 文件上传功能

1. **拖拽上传**

   - 实现拖拽区域
   - 处理drop事件
   - 显示上传进度
2. **常规上传**

   - 文件选择器
   - 上传对话框
   - 批量上传
3. **上传管理**

   - 进度显示
   - 错误处理
   - 重试机制

##### 8.2.3 文件管理功能

1. **创建文件夹**

   - 文件夹名称输入
   - 类型选择
   - 表单验证
2. **移动文件/文件夹**

   - 拖拽移动
   - 目标选择
   - 移动确认
3. **删除/恢复**

   - 删除确认对话框
   - 回收站功能
   - 批量操作

##### 8.2.4 文件预览功能

1. **图片预览**

   - 图片查看器
   - 缩放和旋转
   - 全屏模式
2. **文档预览**

   - PDF查看器
   - 文本查看器
   - Markdown渲染器
3. **Office文档预览**

   - DOCX预览
   - XLSX预览
   - PPTX预览
4. **压缩文件预览**

   - 文件列表
   - 解压功能

##### 8.2.5 公共文件访问

1. **登录界面**

   - 用户名输入
   - 验证码输入
   - 登录按钮
2. **公共文件浏览**

   - 文件列表
   - 文件下载
   - 权限提示

#### 8.3 集成与测试

1. **集成到现有项目**

   - 添加路由
   - 添加导航菜单
   - 配置权限
2. **功能测试**

   - 上传下载测试
   - 文件管理测试
   - 预览功能测试
3. **性能测试**

   - 大文件上传
   - 批量操作
   - 并发访问
4. **安全测试**

   - 权限验证
   - 文件类型验证
   - 路径遍历测试

### 9. 备份机制

#### 9.1 备份文件结构

在 `/uploads/files`目录下创建 `file_system_backup.json`文件，用于跟踪所有文件和文件夹的ID及其名称。

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-01T00:00:00Z",
  "files": [
    {
      "fileId": "File_uuid",
      "name": "原始文件名.ext",
      "type": "private",
      "userId": "user_id",
      "path": "/private/user_id/File_uuid",
      "size": 1024,
      "mimeType": "application/pdf",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "folders": [
    {
      "folderId": "Folder_uuid",
      "name": "文件夹名称",
      "type": "private",
      "userId": "user_id",
      "path": "/private/user_id/Folder_uuid",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 9.2 备份更新策略

##### 9.2.1 触发时机

1. **文件操作时**

   - 文件上传后
   - 文件删除后
   - 文件恢复后
   - 文件移动后
   - 文件类型切换后
2. **文件夹操作时**

   - 文件夹创建后
   - 文件夹删除后
   - 文件夹恢复后
   - 文件夹移动后
3. **定期备份**

   - 每天自动备份一次
   - 保留最近7天的备份
   - 备份文件命名: `file_system_backup_YYYYMMDD.json`

##### 9.2.2 更新逻辑

1. **增量更新**

   - 只更新变化的部分
   - 减少I/O操作
   - 使用文件锁防止并发冲突
2. **全量备份**

   - 定期执行全量备份
   - 确保数据完整性
   - 压缩备份文件

#### 9.3 备份恢复

##### 9.3.1 恢复流程

1. **读取备份文件**

   - 解析JSON结构
   - 验证版本兼容性
2. **重建文件系统树**

   - 根据备份重建目录结构
   - 重命名文件为原始名称
   - 恢复文件元数据
3. **同步数据库**

   - 创建缺失的记录
   - 更新现有记录
   - 删除多余记录

##### 9.3.2 恢复工具

创建独立的恢复工具脚本:

```javascript
// restore-backup.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function restoreBackup(backupPath) {
  // 1. 读取备份文件
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  
  // 2. 连接数据库
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 3. 恢复文件夹
  for (const folder of backup.folders) {
    await restoreFolder(folder);
  }
  
  // 4. 恢复文件
  for (const file of backup.files) {
    await restoreFile(file);
  }
  
  // 5. 关闭连接
  await mongoose.disconnect();
}

restoreBackup('./file_system_backup.json');
```

#### 9.4 备份验证

1. **完整性检查**

   - 验证所有文件存在
   - 验证所有文件夹存在
   - 验证路径有效性
2. **一致性检查**

   - 验证与数据库一致性
   - 验证父子关系
   - 验证用户权限
3. **定期验证**

   - 每周执行一次
   - 生成验证报告
   - 发现问题及时修复

---

***IT IS ADVISABLE TO READ AND FOLLOW THE ABOVE INSTRUCTIONS ONLY.***
