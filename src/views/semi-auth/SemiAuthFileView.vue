<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="text-h5">Public Files - {{ semiAuthStore.username }}</span>
            <v-spacer></v-spacer>
            <v-btn icon @click="goBack">
              <v-icon>mdi-close</v-icon>
            </v-btn>
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
                    <v-checkbox
                      v-model="selectedItems"
                      :value="item"
                      hide-details
                    ></v-checkbox>
                  </td>
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
                      v-if="!item.isFolder"
                      small
                      class="mr-2"
                      @click="downloadItem(item)"
                    >
                      mdi-download
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

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          确认删除
        </v-card-title>

        <v-card-text>
          确定要删除选中的 {{ selectedItems.length }} 个项目吗？
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="showDeleteDialog = false">
            取消
          </v-btn>
          <v-btn color="blue darken-1" text @click="deleteItems">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSemiAuthStore } from '@/stores/semiAuth';
import { uploadFile as uploadFileApi, downloadFile, createFolder as createFolderApi, getFiles, getFolders, deleteFile as deleteFileApi, deleteFolder as deleteFolderApi } from '@/api/files';

const router = useRouter();
const semiAuthStore = useSemiAuthStore();

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

// 删除
const showDeleteDialog = ref(false);

// 加载状态
const loading = ref(false);

// 获取所有项目（文件和文件夹）
const items = ref([]);

// 加载文件和文件夹
const loadItems = async () => {
  try {
    loading.value = true;

    const [filesResponse, foldersResponse] = await Promise.all([
      getFiles({ type: 'public', parentId: currentFolderId.value }),
      getFolders({ type: 'public', parentId: currentFolderId.value })
    ]);

    const files = filesResponse.data.files || [];
    const folders = foldersResponse.data.folders || [];

    // 合并文件和文件夹
    items.value = [
      ...folders.map(folder => ({
        id: folder._id,
        name: folder.name,
        size: 0,
        createdAt: folder.createdAt,
        isFolder: true
      })),
      ...files.map(file => ({
        id: file._id,
        name: file.originalName,
        size: file.size,
        createdAt: file.createdAt,
        isFolder: false
      }))
    ];
  } catch (error) {
    console.error('加载文件列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 导航到文件夹
const navigateToFolder = (folderId) => {
  if (folderId === null) {
    // 返回根目录
    currentFolderId.value = null;
    breadcrumbs.value = [{ text: '根目录', id: null, href: '#' }];
  } else {
    // 进入子文件夹
    const folder = items.value.find(item => item.id === folderId);
    if (folder) {
      currentFolderId.value = folderId;
      breadcrumbs.value.push({
        text: folder.name,
        id: folderId,
        href: '#'
      });
    }
  }
  loadItems();
};

// 上传文件
const uploadFiles = async () => {
  if (filesToUpload.value.length === 0) {
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const formData = new FormData();
    filesToUpload.value.forEach(file => {
      formData.append('files', file);
    });
    formData.append('type', 'public');
    formData.append('parentId', currentFolderId.value || '');

    await uploadFileApi(formData, (progressEvent) => {
      uploadProgress.value = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
    });

    showUploadDialog.value = false;
    filesToUpload.value = [];
    uploadProgress.value = 0;
    loadItems();
  } catch (error) {
    console.error('上传文件失败:', error);
  } finally {
    uploading.value = false;
  }
};

// 创建文件夹
const createFolder = async () => {
  if (!newFolderName.value) {
    return;
  }

  try {
    await createFolderApi({
      name: newFolderName.value,
      type: 'public',
      parentId: currentFolderId.value || null
    });

    showCreateFolderDialog.value = false;
    newFolderName.value = '';
    loadItems();
  } catch (error) {
    console.error('创建文件夹失败:', error);
  }
};

// 确认删除
const confirmDelete = () => {
  if (selectedItems.value.length > 0) {
    showDeleteDialog.value = true;
  }
};

// 删除项目
const deleteItems = async () => {
  try {
    for (const item of selectedItems.value) {
      if (item.isFolder) {
        await deleteFolderApi(item.id);
      } else {
        await deleteFileApi(item.id);
      }
    }

    showDeleteDialog.value = false;
    selectedItems.value = [];
    loadItems();
  } catch (error) {
    console.error('删除项目失败:', error);
  }
};

// 下载文件
const downloadItem = async (item) => {
  if (item.isFolder) {
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

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN');
};

// 返回
const goBack = () => {
  router.push('/');
};

// 监听当前文件夹变化
watch(currentFolderId, () => {
  loadItems();
});

// 组件挂载时加载文件列表
onMounted(() => {
  if (!semiAuthStore.isAuthenticated) {
    router.push('/semi-auth');
    return;
  }
  loadItems();
});
</script>

<style scoped>
.folder-name:hover {
  color: #1976d2;
}
</style>
