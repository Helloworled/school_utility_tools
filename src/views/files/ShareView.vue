<template>
  <v-container>
    <v-card>
      <v-card-title>
        <span class="text-h5">文件分享</span>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-if="loading"
          type="info"
          class="mb-4"
        >
          加载中...
        </v-alert>

        <div v-if="shareLink && !error">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="text-h6">
                {{ file?.originalName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                文件大小: {{ formatFileSize(file?.size) }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider class="my-4"></v-divider>

          <!-- 无需认证 -->
          <div v-if="shareLink.authType === 'none'">
            <v-btn
              color="primary"
              @click="downloadFile"
              :loading="downloading"
              block
            >
              <v-icon left>mdi-download</v-icon>
              下载文件
            </v-btn>
          </div>

          <!-- 需要密码 -->
          <div v-else-if="shareLink.authType === 'password'">
            <v-alert type="info" class="mb-4">
              此文件需要登录并输入密码才能下载
            </v-alert>

            <v-text-field
              v-if="isAuthenticated"
              v-model="password"
              label="访问密码"
              type="password"
              class="mb-4"
            ></v-text-field>

            <v-btn
              v-if="!isAuthenticated"
              color="primary"
              @click="$router.push({ name: 'login', query: { redirect: $route.fullPath } })"
              block
            >
              <v-icon left>mdi-login</v-icon>
              登录
            </v-btn>

            <v-btn
              v-else
              color="primary"
              @click="downloadFile"
              :loading="downloading"
              block
            >
              <v-icon left>mdi-download</v-icon>
              下载文件
            </v-btn>
          </div>


        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getShareLink, downloadFileByShareLink as downloadSharedFile } from '@/api/files';

const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const downloading = ref(false);
const error = ref('');
const shareLink = ref(null);
const file = ref(null);
const password = ref('');

const isAuthenticated = computed(() => authStore.isAuthenticated);

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取分享链接信息
const fetchShareLink = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await getShareLink(route.params.code);

    if (response.data.success) {
      shareLink.value = response.data.shareLink;
      file.value = response.data.shareLink.file;
    } else {
      error.value = response.data.message || '获取分享链接失败';
    }
  } catch (err) {
    console.error('获取分享链接失败:', err);
    error.value = err.response?.data?.message || '获取分享链接失败';
  } finally {
    loading.value = false;
  }
};

// 下载文件
const downloadFile = async () => {
  try {
    downloading.value = true;
    error.value = '';

    const params = {};
    if (shareLink.value.authType === 'password' && password.value) {
      params.password = password.value;
    }

    const response = await downloadSharedFile(route.params.code, params);

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.value.originalName);
    document.body.appendChild(link);
    link.click();

    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (err) {
    console.error('下载文件失败:', err);
    error.value = err.response?.data?.message || '下载文件失败';
  } finally {
    downloading.value = false;
  }
};

onMounted(() => {
  fetchShareLink();
});
</script>
