<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="text-h5">文件管理</span>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="fileType" mandatory color="primary">
              <v-btn value="private">私有</v-btn>
              <v-btn value="public">公开</v-btn>
            </v-btn-toggle>
          </v-card-title>

          <v-card-text>
            <!-- 面包屑导航 -->
            <v-breadcrumbs :items="breadcrumbs">
              <template #divider>
                <v-icon>mdi-chevron-right</v-icon>
              </template>
              <template #item="{ item }">
                <v-breadcrumbs-item
                  :href="item.href"
                  @click.prevent="navigateToFolder(item.id)"
                >
                  {{ item.text }}
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>

            <!-- 操作按钮 -->
            <div class="mb-4">
              <v-btn
                color="primary"
                @click="showUploadDialog = true"
                class="mr-2"
              >
                <v-icon left>mdi-upload</v-icon>
                上传文件
              </v-btn>

              <v-btn
                color="success"
                @click="showCreateFolderDialog = true"
                class="mr-2"
              >
                <v-icon left>mdi-folder-plus</v-icon>
                新建文件夹
              </v-btn>

              <v-btn
                v-if="selectedItems.length > 0"
                color="error"
                @click="confirmDelete"
              >
                <v-icon left>mdi-delete</v-icon>
                删除选中项
              </v-btn>
            </div>

            <!-- 文件列表 -->
            <v-data-table
              v-model="selectedItems"
              :headers="headers"
              :items="items"
              :loading="loading"
              show-select
              class="elevation-1"
            >
              <template v-slot:body="{ items }">
                <tr v-for="item in items" :key="item.id">
                  <td>
                    <v-icon v-if="item.isFolder" class="mr-2">mdi-folder</v-icon>
                    <v-icon v-else class="mr-2">mdi-file</v-icon>
                    <span
                      v-if="item.isFolder"
                      class="folder-name"
                      @click="navigateToFolder(item.id)"
                      style="cursor: pointer;"
                    >
                      {{ item.name }}
                    </span>
                    <span v-else>{{ item.name }}</span>
                  </td>
                  <td>{{ formatFileSize(item.size) }}</td>
                  <td>{{ formatDate(item.createdAt) }}</td>
                  <td>
                <v-icon
                  small
                  class="mr-2"
                  @click="viewItem(item)"
                >
                  mdi-eye
                </v-icon>

                <v-icon
                  v-if="!item.isFolder"
                  small
                  class="mr-2"
                  @click="downloadItem(item)"
                >
                  mdi-download
                </v-icon>

                <v-icon
                  small
                  class="mr-2"
                  @click="shareItem(item)"
                >
                  mdi-share-variant
                </v-icon>

                <v-icon
                  small
                  @click="deleteItem(item)"
                >
                  mdi-delete
                </v-icon>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 上传文件对话框 -->
    <v-dialog v-model="showUploadDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">上传文件</span>
        </v-card-title>

        <v-card-text>
          <v-file-input
            v-model="filesToUpload"
            label="选择文件"
            multiple
            show-size
            truncate-length="50"
          ></v-file-input>

          <v-progress-linear
            v-if="uploading"
            :value="uploadProgress"
            color="primary"
            height="25"
          >
            <strong>{{ Math.ceil(uploadProgress) }}%</strong>
          </v-progress-linear>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showUploadDialog = false">
            取消
          </v-btn>
          <v-btn color="blue darken-1" text @click="uploadFiles" :disabled="uploading">
            上传
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 创建文件夹对话框 -->
    <v-dialog v-model="showCreateFolderDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">新建文件夹</span>
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="newFolderName"
            label="文件夹名称"
            :rules="[rules.required]"
          ></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showCreateFolderDialog = false">
            取消
          </v-btn>
          <v-btn color="blue darken-1" text @click="createFolder">
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 分享对话框 -->
    <v-dialog v-model="showShareDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">分享文件</span>
        </v-card-title>

        <v-card-text>
          <v-select
            v-model="shareAuthType"
            :items="authTypes"
            label="访问权限"
            item-text="text"
            item-value="value"
          ></v-select>

          <v-text-field
            v-if="shareAuthType === 'password'"
            v-model="sharePassword"
            label="访问密码"
            type="password"
          ></v-text-field>

          <v-text-field
            v-model="shareExpirationDate"
            label="过期日期"
            type="date"
            :min="minDate"
          ></v-text-field>

          <v-text-field
            v-model="shareMaxAccessCount"
            label="最大访问次数"
            type="number"
            min="1"
          ></v-text-field>

          <v-text-field
            v-if="shareLink"
            v-model="shareLink"
            label="分享链接"
            readonly
            append-icon="mdi-content-copy"
            @click:append="copyShareLink"
          ></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showShareDialog = false">
            关闭
          </v-btn>
          <v-btn color="blue darken-1" text @click="generateShareLink" :disabled="generatingShareLink">
            生成分享链接
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          确认删除
        </v-card-title>

        <v-card-text>
          确定要删除选中的项目吗？此操作将把项目移动到回收站。
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showDeleteDialog = false">
            取消
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteSelectedItems">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useFilesStore } from '@/stores/files';
import { uploadFile, downloadFile, createShareLink } from '@/api/files';

const filesStore = useFilesStore();

const fileType = ref('private');
const currentFolderId = ref(null);
const breadcrumbs = ref([
  { text: '根目录', id: null, href: '#' }
]);
const headers = [
  { text: '名称', value: 'name' },
  { text: '大小', value: 'size' },
  { text: '创建时间', value: 'createdAt' },
  { text: '操作', value: 'actions', sortable: false }
];
const selectedItems = ref([]);

// 上传文件
const showUploadDialog = ref(false);
const filesToUpload = ref([]);
const uploading = ref(false);
const uploadProgress = ref(0);

// 创建文件夹
const showCreateFolderDialog = ref(false);
const newFolderName = ref('');
const rules = {
  required: value => !!value || '此项必填'
};

// 分享
const showShareDialog = ref(false);
const shareAuthType = ref('none');
const sharePassword = ref('');
const shareExpirationDate = ref('');
const shareMaxAccessCount = ref('');
const shareLink = ref('');
const generatingShareLink = ref(false);
const itemToShare = ref(null);
const authTypes = [
  { text: '无需认证', value: 'none' },
  { text: '需要密码', value: 'password' }
];
const minDate = new Date().toISOString().substr(0, 10);

// 删除
const showDeleteDialog = ref(false);
const itemToDelete = ref(null);

// 计算属性
const items = computed(() => filesStore.allItems);
const loading = computed(() => filesStore.loading);

// 监听文件类型和当前文件夹变化
watch(fileType, () => {
  loadItems();
});

watch(currentFolderId, () => {
  loadItems();
});

// 组件挂载时加载文件
onMounted(() => {
  loadItems();
});
// 加载文件和文件夹
const loadItems = async () => {
  try {
    await Promise.all([
      filesStore.fetchFiles({ type: fileType.value, parentId: currentFolderId.value }),
      filesStore.fetchFolders({ type: fileType.value, parentId: currentFolderId.value })
    ]);
  } catch (error) {
    console.error('加载文件失败:', error);
    // 可以在这里添加通知
  }
};

// 导航到文件夹
const navigateToFolder = (folderId) => {
  if (folderId === null) {
    // 返回根目录
    currentFolderId.value = null;
    breadcrumbs.value = [{ text: '根目录', id: null, href: '#' }];
    return;
  }

  // 查找文件夹信息
  const folder = items.value.find(item => item.id === folderId && item.isFolder);
  if (!folder) {
    // 如果在当前items中找不到，可能是从面包屑导航点击的父文件夹
    currentFolderId.value = folderId;
    
    // 更新面包屑导航，删除之后的所有项
    const index = breadcrumbs.value.findIndex(item => item.id === folderId);
    if (index >= 0) {
      breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
    }
    return;
  }

  // 直接设置当前文件夹ID
  currentFolderId.value = folderId;

  // 更新面包屑导航
  const index = breadcrumbs.value.findIndex(item => item.id === folderId);
  if (index >= 0) {
    // 如果已存在，则删除之后的所有项
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
  } else {
    // 否则添加新项
    breadcrumbs.value.push({
      text: folder.name,
      id: folderId,
      href: '#'
    });
  }
};

// 上传文件
const uploadFiles = async () => {
  if (filesToUpload.value.length === 0) {
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const totalFiles = filesToUpload.value.length;
    let uploadedFiles = 0;

    for (const file of filesToUpload.value) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType.value);
      if (currentFolderId.value) {
        formData.append('parentId', currentFolderId.value);
      }

      await uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          ((uploadedFiles * 100 + (progressEvent.loaded / progressEvent.total) * 100) / totalFiles)
        );
        uploadProgress.value = percentCompleted;
      });

      uploadedFiles++;
    }

    showUploadDialog.value = false;
    filesToUpload.value = [];
    loadItems();
  } catch (error) {
    console.error('上传文件失败:', error);
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

// 创建文件夹
const createFolder = async () => {
  if (!newFolderName.value) {
    return;
  }

  try {
    await filesStore.createFolderAction({
      name: newFolderName.value,
      type: fileType.value,
      parentId: currentFolderId.value
    });

    showCreateFolderDialog.value = false;
    newFolderName.value = '';
    loadItems();
  } catch (error) {
    console.error('创建文件夹失败:', error);
  }
};

// 查看项目
const viewItem = (item) => {
  if (item.isFolder) {
    navigateToFolder(item.id);
  } else {
    // 可以在这里实现文件预览功能
    console.log('查看文件:', item);
  }
};

// 下载项目
const downloadItem = async (item) => {
  if (item.isFolder) {
    // 文件夹不支持下载
    console.log('文件夹不支持下载');
    return;
  }

  try {
    const response = await downloadFile(item.id);

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', item.name);
    document.body.appendChild(link);
    link.click();

    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载文件失败:', error);
  }
};

// 分享项目
const shareItem = (item) => {
  if (item.isFolder) {
    // 文件夹不支持分享
    console.log('文件夹不支持分享');
    return;
  }

  itemToShare.value = item;
  showShareDialog.value = true;
};

// 生成分享链接
const generateShareLink = async () => {
  if (!itemToShare.value) {
    return;
  }

  generatingShareLink.value = true;

  try {
    const response = await createShareLink({
      fileId: itemToShare.value.id,
      authType: shareAuthType.value,
      password: sharePassword.value || null,
      expirationDate: shareExpirationDate.value || null,
      maxAccessCount: shareMaxAccessCount.value ? parseInt(shareMaxAccessCount.value) : null
    });

    if (response.data.success) {
      const shareCode = response.data.shareLink.shareCode;
      shareLink.value = `${window.location.origin}/share/${shareCode}`;
    }
  } catch (error) {
    console.error('生成分享链接失败:', error);
  } finally {
    generatingShareLink.value = false;
  }
};

// 复制分享链接
const copyShareLink = () => {
  if (!shareLink.value) {
    return;
  }

  navigator.clipboard.writeText(shareLink.value).then(() => {
    console.log('分享链接已复制到剪贴板');
  }).catch(err => {
    console.error('复制分享链接失败:', err);
  });
};

// 确认删除
const confirmDelete = () => {
  if (selectedItems.value.length > 0) {
    showDeleteDialog.value = true;
  }
};

// 删除项目
const deleteItem = (item) => {
  itemToDelete.value = item;
  selectedItems.value = [item];
  showDeleteDialog.value = true;
};

// 删除选中的项目
const deleteSelectedItems = async () => {
  try {
    const deletePromises = selectedItems.value.map(item => {
      if (item.isFolder) {
        return filesStore.deleteFolder(item.id);
      } else {
        return filesStore.deleteFile(item.id);
      }
    });

    await Promise.all(deletePromises);

    showDeleteDialog.value = false;
    selectedItems.value = [];
    itemToDelete.value = null;
    loadItems();
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
</script>

<style scoped>
.v-data-table {
  cursor: pointer;
}
</style>
