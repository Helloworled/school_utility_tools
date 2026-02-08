# FileList.vue 命名冲突修复指南

## 问题描述

在FileList_enhanced.vue中存在以下命名冲突：

1. `previewFile` - 与store中的previewFile方法冲突
2. `showMoveFileDialog` - 与store中的状态冲突
3. `showMoveFolderDialog` - 与store中的状态冲突
4. `showChangeTypeDialog` - 与store中的状态冲突
5. `showBatchMoveDialog` - 与store中的状态冲突
6. `showBatchDeleteDialog` - 与store中的状态冲突

## 解决方案

### 方案1：重命名组件方法（推荐）

将组件中的方法名添加`handle`前缀，以区分与store中的同名方法：

```javascript
// 修改前
const previewFile = async (file) => {
  // ...
};

// 修改后
const handlePreviewFile = async (file) => {
  // ...
};
```

### 方案2：使用命名空间

在组件中使用store时添加命名空间：

```javascript
import { useFilesStore } from '@/stores/files';
import { storeToRefs } from 'pinia';

const filesStore = useFilesStore();
const {
  files,
  folders,
  currentFolder,
  currentType,
  loading
} = storeToRefs(filesStore);

// 使用store方法时添加filesStore前缀
const previewFile = async (file) => {
  await filesStore.previewFile(file.fileId);
};
```

## 具体修改

### 1. 修改方法名

**需要修改的方法：**

```javascript
// 文件预览
const handlePreviewFile = async (file) => {
  fileToPreview.value = file;
  showPreviewDialog.value = true;
};

// 文件移动对话框
const handleMoveFileDialog = (file) => {
  fileToMove.value = file;
  targetFolderForFile.value = null;
  showMoveFileDialog.value = true;
};

// 文件夹移动对话框
const handleMoveFolderDialog = (folder) => {
  folderToMove.value = folder;
  targetFolderForFolder.value = null;
  showMoveFolderDialog.value = true;
};

// 文件类型切换对话框
const handleChangeTypeDialog = (file) => {
  fileToChangeType.value = file;
  newFileType.value = file.type;
  showChangeTypeDialog.value = true;
};

// 批量移动对话框
const handleBatchMoveDialog = () => {
  batchTargetFolder.value = null;
  showBatchMoveDialog.value = true;
};

// 批量删除对话框
const handleBatchDeleteDialog = () => {
  showBatchDeleteDialog.value = true;
};

// 文件删除对话框
const showDeleteFileConfirmDialog = (file) => {
  fileToDelete.value = file;
  showDeleteFileConfirm.value = true;
};

// 文件夹删除对话框
const showDeleteFolderConfirmDialog = (folder) => {
  folderToDelete.value = folder;
  showDeleteFolderConfirm.value = true;
};
```

### 2. 修改模板中的方法调用

**需要修改的模板部分：**

```vue
<!-- 文件操作按钮 -->
<template v-slot:[`item.actions`]="{ item }">
  <v-btn icon small @click="handlePreviewFile(item)">
    <v-icon small>mdi-eye</v-icon>
  </v-btn>
  <v-btn icon small @click="downloadFile(item.fileId, item.name)">
    <v-icon small>mdi-download</v-icon>
  </v-btn>
  <v-menu v-if="!showRecycleBin">
    <template v-slot:activator="{ props }">
      <v-btn icon small v-bind="props">
        <v-icon small>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item @click="handleMoveFileDialog(item)">
        <v-list-item-title>
          <v-icon left>mdi-folder-move</v-icon>
          移动
        </v-list-item-title>
      </v-list-item>
      <v-list-item @click="handleChangeTypeDialog(item)">
        <v-list-item-title>
          <v-icon left>mdi-swap-horizontal</v-icon>
          切换类型
        </v-list-item-title>
      </v-list-item>
      <v-list-item @click="showDeleteFileConfirmDialog(item)">
        <v-list-item-title>
          <v-icon left>mdi-delete</v-icon>
          删除
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
  <v-btn icon small v-else @click="handleRestoreFile(item)">
    <v-icon small>mdi-restore</v-icon>
  </v-btn>
</template>

<!-- 文件夹操作按钮 -->
<v-card-actions v-if="!showRecycleBin">
  <v-spacer></v-spacer>
  <v-btn icon small @click="handleMoveFolderDialog(folder)">
    <v-icon small>mdi-folder-move</v-icon>
  </v-btn>
  <v-btn icon small @click="showDeleteFolderConfirmDialog(folder)">
    <v-icon small>mdi-delete</v-icon>
  </v-btn>
</v-card-actions>

<!-- 批量操作菜单 -->
<v-list>
  <v-list-item @click="handleBatchMoveDialog">
    <v-list-item-title>
      <v-icon left>mdi-folder-move</v-icon>
      批量移动
    </v-list-item-title>
  </v-list-item>
  <v-list-item @click="handleBatchDeleteDialog">
    <v-list-item-title>
      <v-icon left>mdi-delete</v-icon>
      批量删除
    </v-list-item-title>
  </v-list-item>
</v-list>
```

### 3. 添加缺失的状态

**需要添加的状态变量：**

```javascript
// 对话框状态
const showPreviewDialog = ref(false);
const showMoveFileDialog = ref(false);
const showMoveFolderDialog = ref(false);
const showChangeTypeDialog = ref(false);
const showBatchMoveDialog = ref(false);
const showBatchDeleteDialog = ref(false);

// 操作对象
const fileToPreview = ref(null);
const fileToMove = ref(null);
const folderToMove = ref(null);
const fileToChangeType = ref(null);
```

### 4. 添加确认方法

```javascript
// 文件移动确认
const confirmMoveFile = async () => {
  if (!fileToMove.value || !targetFolderForFile.value) return;

  moving.value = true;
  try {
    await moveFile(fileToMove.value.fileId, targetFolderForFile.value);
    showMoveFileDialog.value = false;
    fileToMove.value = null;
  } catch (err) {
    console.error('移动文件失败:', err);
    alert('移动文件失败: ' + (err.response?.data?.message || err.message));
  } finally {
    moving.value = false;
  }
};

// 文件夹移动确认
const confirmMoveFolder = async () => {
  if (!folderToMove.value || !targetFolderForFolder.value) return;

  moving.value = true;
  try {
    await moveFolder(folderToMove.value.folderId, targetFolderForFolder.value);
    showMoveFolderDialog.value = false;
    folderToMove.value = null;
  } catch (err) {
    console.error('移动文件夹失败:', err);
    alert('移动文件夹失败: ' + (err.response?.data?.message || err.message));
  } finally {
    moving.value = false;
  }
};

// 文件类型切换确认
const confirmChangeType = async () => {
  if (!fileToChangeType.value) return;

  changingType.value = true;
  try {
    await changeFileType(fileToChangeType.value.fileId, newFileType.value);
    showChangeTypeDialog.value = false;
    fileToChangeType.value = null;
  } catch (err) {
    console.error('切换文件类型失败:', err);
    alert('切换文件类型失败: ' + (err.response?.data?.message || err.message));
  } finally {
    changingType.value = false;
  }
};

// 批量移动确认
const confirmBatchMove = async () => {
  if (!batchTargetFolder.value || selectedFiles.value.length === 0) return;

  moving.value = true;
  try {
    for (const file of selectedFiles.value) {
      await moveFile(file.fileId, batchTargetFolder.value);
    }
    showBatchMoveDialog.value = false;
    selectedFiles.value = [];
  } catch (err) {
    console.error('批量移动失败:', err);
    alert('批量移动失败: ' + (err.response?.data?.message || err.message));
  } finally {
    moving.value = false;
  }
};

// 批量删除确认
const confirmBatchDelete = async () => {
  if (selectedFiles.value.length === 0) return;

  deleting.value = true;
  try {
    for (const file of selectedFiles.value) {
      await deleteFile(file.fileId);
    }
    showBatchDeleteDialog.value = false;
    selectedFiles.value = [];
  } catch (err) {
    console.error('批量删除失败:', err);
    alert('批量删除失败: ' + (err.response?.data?.message || err.message));
  } finally {
    deleting.value = false;
  }
};

// 文件恢复
const handleRestoreFile = async (file) => {
  try {
    await restoreFile(file.fileId);
  } catch (err) {
    console.error('恢复文件失败:', err);
    alert('恢复文件失败: ' + (err.response?.data?.message || err.message));
  }
};

// 文件夹恢复
const handleRestoreFolder = async (folder) => {
  try {
    await restoreFolder(folder.folderId);
  } catch (err) {
    console.error('恢复文件夹失败:', err);
    alert('恢复文件夹失败: ' + (err.response?.data?.message || err.message));
  }
};
```

## 实施步骤

1. 备份现有的FileList.vue
2. 打开FileList.vue和FileList_fixed.vue
3. 对比两个文件，找出差异
4. 应用上述修改
5. 测试所有功能
6. 删除临时文件FileList_fixed.vue

## 注意事项

1. **命名一致性**
   - 组件方法使用`handle`前缀
   - 对话框状态使用`show`前缀
   - 操作对象使用`To`后缀

2. **状态管理**
   - 组件状态使用ref定义
   - store状态使用storeToRefs解构
   - 避免命名冲突

3. **方法调用**
   - 模板中使用组件方法
   - 组件方法中调用store方法
   - 保持清晰的调用链

4. **测试验证**
   - 测试所有对话框
   - 测试所有操作
   - 确保无命名冲突

## 总结

通过重命名组件方法并添加适当的前缀，可以避免与store中的同名方法和状态冲突。推荐使用`handle`前缀来命名组件中的事件处理方法。