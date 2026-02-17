<template>
  <div v-if="showBadge" class="semi-auth-badge">
    <v-menu offset-y>
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          :color="semiAuthStore.isAuthenticated ? 'success' : 'grey'"
          :variant="semiAuthStore.isAuthenticated ? 'elevated' : 'outlined'"
          size="small"
          class="semi-auth-btn"
        >
          <v-icon start>mdi-shield-account</v-icon>
          {{ semiAuthStore.isAuthenticated ? 'Semi-auth Active' : 'Semi-auth' }}
        </v-btn>
      </template>

      <v-list min-width="200">
        <v-list-item v-if="semiAuthStore.isAuthenticated">
          <v-list-item-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
            Semi-authenticated as {{ semiAuthStore.username }}
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-else>
          <v-list-item-title class="d-flex align-center">
            <v-icon class="mr-2" color="grey">mdi-circle-outline</v-icon>
            Not semi-authenticated
          </v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item v-if="semiAuthStore.isAuthenticated">
          <v-list-item-title class="d-flex align-center justify-space-between">
            <span>Expires in:</span>
            <span class="font-weight-bold">{{ expiresIn }}</span>
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-if="semiAuthStore.isAuthenticated" @click="handleLogout">
          <v-list-item-title class="d-flex align-center text-error">
            <v-icon class="mr-2" color="error">mdi-logout</v-icon>
            End Semi-auth Session
          </v-list-item-title>
        </v-list-item>
        <v-list-item v-else to="/semi-auth">
          <v-list-item-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-login</v-icon>
            Start Semi-auth
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSemiAuthStore } from '@/stores/semiAuth';

const authStore = useAuthStore();
const semiAuthStore = useSemiAuthStore();

// 只在未认证用户登录后显示
const showBadge = computed(() => !authStore.isAuthenticated);

const expiresIn = computed(() => {
  if (!semiAuthStore.expiresAt) return 'N/A';

  const now = new Date();
  const expires = new Date(semiAuthStore.expiresAt);
  const diff = Math.max(0, expires - now);

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${minutes}m ${seconds}s`;
});

// 定时器，每秒更新过期时间
let timer = null;

onMounted(() => {
  // Initialize semi-auth state from storage
  semiAuthStore.initializeFromStorage();

  if (showBadge.value) {
    timer = setInterval(() => {
      // 触发重新计算
      expiresIn.value;
    }, 1000);
  }
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

const handleLogout = () => {
  semiAuthStore.logout();
};
</script>

<style scoped>
.semi-auth-badge {
  display: inline-block;
  margin-left: 10px;
}

.semi-auth-btn {
  min-width: auto;
}
</style>
