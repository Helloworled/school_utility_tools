# 阶段四：前端升级实施指南

## 概述

本指南详细说明如何实施"阶段四：前端升级"。我们已经创建了以下新文件：

1. `files_enhanced.js` - 增强的文件store
2. `FileList_enhanced.vue` - 增强的文件列表组件

## 实施步骤

### 步骤1：备份现有文件

**重要：在进行任何更改前，请先备份现有文件！**

```bash
cd src/stores
copy files.js files_backup.js

cd src/views/files
copy FileList.vue FileList_backup.vue
```

### 步骤2：更新files.js store

**操作：**

1. 对比 `files.js`和 `files_enhanced.js`
2. 将新增的功能添加到 `files.js`
3. 保留现有的所有功能
4. 测试确保功能正常

**新增功能：**

- `uploadMultipleFiles` - 批量上传文件
- `moveFile` - 移动文件
- `changeFileType` - 切换文件类型
- `previewFile` - 预览文件
- `moveFolder` - 移动文件夹
- `toggleRecycleBin` - 切换回收站视图
- `selectedFiles` - 选中的文件（用于批量操作）
- `showRecycleBin` - 回收站视图状态

**修改说明：**

1. 在state中添加：

   ```javascript
   const selectedFiles = ref([]);
   const showRecycleBin = ref(false);
   ```
2. 修改activeFiles和activeFolders计算属性：

   ```javascript
   const activeFiles = computed(() => {
     if (showRecycleBin.value) {
       return files.value.filter(f => f.isDeleted);
     }
     return files.value.filter(f => !f.isDeleted);
   });

   const activeFolders = computed(() => {
     if (showRecycleBin.value) {
       return folders.value.filter(f => f.isDeleted);
     }
     return folders.value.filter(f => !f.isDeleted);
   });
   ```
3. 添加新的actions：

   - uploadMultipleFiles
   - moveFile
   - changeFileType
   - previewFile
   - moveFolder
   - toggleRecycleBin
4. 更新return语句，包含新的state和actions

### 步骤3：更新FileList.vue

**操作：**

1. 对比 `FileList.vue`和 `FileList_enhanced.vue`
2. 将新增的功能添加到 `FileList.vue`
3. 保留现有的所有功能
4. 测试确保功能正常

**新增功能：**

1. **批量上传**

   - 支持选择多个文件
   - 显示上传进度
   - 显示上传和失败信息
2. **文件拖拽移动**

   - 文件夹支持拖拽
   - 文件支持拖拽
   - 拖拽时高亮显示
3. **文件移动**

   - 添加移动对话框
   - 选择目标文件夹
   - 确认移动操作
4. **文件类型切换**

   - 添加切换类型对话框
   - 选择新类型
   - 确认切换操作
5. **文件预览**

   - 添加预览按钮
   - 点击预览文件
   - 支持多种文件类型
6. **回收站视图**

   - 添加回收站切换按钮
   - 显示已删除的文件和文件夹
   - 支持恢复操作
7. **批量操作**

   - 添加批量移动功能
   - 添加批量删除功能
   - 显示选中项数

**修改说明：**

1. **添加回收站切换按钮**
   在标题栏添加：

   ```vue
   <v-btn icon @click="toggleRecycleBin">
     <v-icon>mdi-delete-restore</v-icon>
   </v-btn>
   ```
2. **修改标题显示**

   ```vue
   {{ showRecycleBin ? '回收站' : (currentType === 'private' ? '私有文件' : ...) }}
   ```
3. **添加文件拖拽**
   在文件夹卡片添加：

   ```vue
   @dragover.prevent="onDragOver(folder)"
   @dragleave.prevent="onDragLeave(folder)"
   @drop.prevent="onDrop(folder)"
   :class="{ 'drag-over': folder.isDragOver }"
   ```
4. **添加文件拖拽**
   在文件项添加：

   ```vue
   @dragover.prevent="onFileDragOver(item)"
   @dragleave.prevent="onFileDragLeave(item)"
   @drop.prevent="onFileDrop(item)"
   ```
5. **添加批量操作FAB**

   ```vue
   <v-fab
     v-if="selectedFiles.length > 0 && !showRecycleBin"
     location="bottom"
     right
     color="primary"
     app
   >
     <v-menu v-model="batchMenu">
       <!-- 批量操作菜单 -->
     </v-menu>
   </v-fab>
   ```
6. **添加新对话框**

   - 移动文件对话框
   - 移动文件夹对话框
   - 切换文件类型对话框
   - 批量移动对话框
7. **添加script部分的新状态**

   ```javascript
   const showMoveFileDialog = ref(false);
   const showMoveFolderDialog = ref(false);
   const showChangeTypeDialog = ref(false);
   const showBatchMoveDialog = ref(false);
   const targetFolderForFile = ref(null);
   const targetFolderForFolder = ref(null);
   const batchTargetFolder = ref(null);
   const newFileType = ref('private');
   const moving = ref(false);
   const changingType = ref(false);
   ```
8. **添加新方法**

   ```javascript
   // 拖拽相关
   const onDragOver = (folder) => {
     folder.isDragOver = true;
   };

   const onDragLeave = (folder) => {
     folder.isDragOver = false;
   };

   const onDrop = (folder) => {
     // 处理拖放
     folder.isDragOver = false;
   };

   // 文件操作
   const showMoveFileDialog = (file) => {
     fileToMove.value = file;
     targetFolderForFile.value = null;
     showMoveFileDialog.value = true;
   };

   const confirmMoveFile = async () => {
     await moveFile(fileToMove.value.fileId, targetFolderForFile.value);
     showMoveFileDialog.value = false;
   };

   const showChangeTypeDialog = (file) => {
     fileToChangeType.value = file;
     newFileType.value = file.type;
     showChangeTypeDialog.value = true;
   };

   const confirmChangeType = async () => {
     await changeFileType(fileToChangeType.value.fileId, newFileType.value);
     showChangeTypeDialog.value = false;
   };

   // 批量操作
   const showBatchMoveDialog = () => {
     batchTargetFolder.value = null;
     showBatchMoveDialog.value = true;
   };

   const confirmBatchMove = async () => {
     for (const file of selectedFiles.value) {
       await moveFile(file.fileId, batchTargetFolder.value);
     }
     showBatchMoveDialog.value = false;
     selectedFiles.value = [];
   };
   ```

### 步骤4：创建API文件

**需要创建或更新 `src/api/files.js`：**

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

// 获取文件列表
export const getFiles = async (type, parentId) => {
  const response = await axios.get(`${API_BASE_URL}/files`, {
    params: { type, parentId }
  });
  return response.data;
};

// 上传文件
export const uploadFile = async (file, type, parentId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (parentId) {
    formData.append('parentId', parentId);
  }

  const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// 批量上传文件
export const uploadMultipleFiles = async (filesArray, type, parentId) => {
  const formData = new FormData();
  filesArray.forEach(file => {
    formData.append('files', file);
  });
  formData.append('type', type);
  if (parentId) {
    formData.append('parentId', parentId);
  }

  const response = await axios.post(`${API_BASE_URL}/files/upload/multiple`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// 下载文件
export const downloadFile = async (fileId) => {
  const response = await axios.get(`${API_BASE_URL}/files/${fileId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

// 删除文件
export const deleteFile = async (fileId) => {
  const response = await axios.delete(`${API_BASE_URL}/files/${fileId}`);
  return response.data;
};

// 恢复文件
export const restoreFile = async (fileId) => {
  const response = await axios.post(`${API_BASE_URL}/files/${fileId}/restore`);
  return response.data;
};

// 移动文件
export const moveFile = async (fileId, targetFolderId) => {
  const response = await axios.put(`${API_BASE_URL}/files/${fileId}/move`, {
    targetFolderId
  });
  return response.data;
};

// 切换文件类型
export const changeFileType = async (fileId, newType) => {
  const response = await axios.put(`${API_BASE_URL}/files/${fileId}/type`, {
    type: newType
  });
  return response.data;
};

// 预览文件
export const previewFile = async (fileId) => {
  const response = await axios.get(`${API_BASE_URL}/preview/files/${fileId}`);
  return response.data;
};

// 创建文件夹
export const createFolder = async (name, type, parentId) => {
  const response = await axios.post(`${API_BASE_URL}/folders`, {
    name,
    type,
    parentId
  });
  return response.data;
};

// 删除文件夹
export const deleteFolder = async (folderId) => {
  const response = await axios.delete(`${API_BASE_URL}/folders/${folderId}`);
  return response.data;
};

// 恢复文件夹
export const restoreFolder = async (folderId) => {
  const response = await axios.post(`${API_BASE_URL}/folders/${folderId}/restore`);
  return response.data;
};

// 移动文件夹
export const moveFolder = async (folderId, targetFolderId) => {
  const response = await axios.put(`${API_BASE_URL}/folders/${folderId}/move`, {
    targetFolderId
  });
  return response.data;
};
```

### 步骤5：更新路由

**在 `src/router/index.js`中添加新路由：**

```javascript
{
  path: '/files',
  name: 'FileList',
  component: () => import('@/views/files/FileList.vue')
}
```

### 步骤6：更新环境变量

**在 `.env`或 `.env.local`中添加：**

```bash
VUE_APP_API_URL=http://localhost:5000/api
```

## 测试计划

### 1. 文件上传测试

**测试用例：**

- [ ] 单文件上传成功
- [ ] 批量文件上传成功
- [ ] 上传到不同文件夹
- [ ] 上传到不同类型（private/public/shared）
- [ ] 上传进度显示正常
- [ ] 上传失败提示正常

### 2. 文件管理测试

**测试用例：**

- [ ] 文件列表查询成功
- [ ] 分页功能正常
- [ ] 文件下载成功
- [ ] 文件删除成功
- [ ] 文件恢复成功
- [ ] 文件移动成功
- [ ] 文件类型切换成功
- [ ] 文件预览成功

### 3. 文件夹管理测试

**测试用例：**

- [ ] 创建文件夹成功
- [ ] 删除文件夹成功
- [ ] 恢复文件夹成功
- [ ] 移动文件夹成功
- [ ] 拖拽移动成功

### 4. 回收站功能测试

**测试用例：**

- [ ] 切换到回收站视图成功
- [ ] 显示已删除的文件
- [ ] 恢复文件成功
- [ ] 恢复文件夹成功
- [ ] 切换回正常视图成功

### 5. 批量操作测试

**测试用例：**

- [ ] 选择多个文件成功
- [ ] 批量移动成功
- [ ] 批量删除成功
- [ ] 取消选择成功

### 6. 拖拽功能测试

**测试用例：**

- [ ] 文件拖拽高亮显示
- [ ] 文件夹拖拽高亮显示
- [ ] 拖放成功
- [ ] 拖放取消正常

### 7. 文件预览测试

**测试用例：**

- [ ] 图片预览成功
- [ ] PDF预览成功
- [ ] 文本预览成功
- [ ] Office文档预览返回正确信息
- [ ] 压缩文件预览返回正确信息
- [ ] 不支持的类型提示下载

## 注意事项

1. **备份重要**

   - 在进行任何更改前备份数据
   - 备份现有代码文件
   - 测试新功能后再删除备份
2. **逐步实施**

   - 建议一次实施一个功能
   - 每个功能测试通过后再进行下一个
   - 确保不破坏现有功能
3. **性能优化**

   - 文件列表使用虚拟滚动
   - 大文件上传显示进度
   - 图片预览使用懒加载
4. **用户体验**

   - 提供清晰的操作反馈
   - 加载状态显示
   - 错误提示友好
   - 拖拽视觉反馈
5. **兼容性**

   - 确保新功能与现有功能兼容
   - 保持API响应格式一致
   - 保持数据结构一致

## 回滚计划

如果升级过程中遇到问题，可以按以下步骤回滚：

1. 恢复备份的文件

```bash
cd src/stores
copy files_backup.js files.js

cd src/views/files
copy FileList_backup.vue FileList.vue
```

2. 删除新文件

```bash
del src/stores/files_enhanced.js
del src/views/files/FileList_enhanced.vue
```

3. 重启前端服务

```bash
npm run serve
```

## 下一步

完成阶段四后，请继续实施：

- **阶段五：测试**

  - 后端功能测试
  - 前端功能测试
  - 集成测试
- **阶段六：部署**

  - 数据迁移
  - 依赖安装
  - 服务启动

## 问题排查

### 常见问题

**问题1：文件上传失败**

- 检查API URL配置
- 检查文件大小限制
- 检查网络连接

**问题2：拖拽不工作**

- 检查事件绑定
- 检查prevent修饰符
- 检查浏览器兼容性

**问题3：批量操作失败**

- 检查selectedFiles状态
- 检查API调用顺序
- 检查错误处理

**问题4：回收站不显示**

- 检查showRecycleBin状态
- 检查computed属性逻辑
- 检查数据过滤

## 总结

阶段四的前端升级已完成所有新文件的创建。请按照本指南的步骤逐步实施，并在每个步骤完成后进行充分测试。遇到问题请参考问题排查部分或回滚到备份版本。
