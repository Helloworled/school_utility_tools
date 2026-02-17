<template>
  <div v-if="!authStore.isAuthenticated" class="semi-auth-status">
    <v-alert
      v-if="semiAuthStore.isAuthenticated"
      type="success"
      density="compact"
      class="authenticated"
    >
      <template v-slot:prepend>
        <v-icon class="mr-2">mdi-shield-check</v-icon>
      </template>
      <div class="d-flex align-center justify-space-between">
        <span>Semi-authenticated as <strong>{{ semiAuthStore.username }}</strong></span>
        <span class="expires-in ml-4">{{ expiresIn }}</span>
      </div>
      <template v-slot:append>
        <v-btn
          size="small"
          variant="text"
          @click="logout"
          class="logout-btn"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
    </v-alert>

    <v-alert
      v-else
      type="info"
      density="compact"
      class="not-authenticated"
    >
      <template v-slot:prepend>
        <v-icon class="mr-2">mdi-shield-outline</v-icon>
      </template>
      <span>Not semi-authenticated</span>
    </v-alert>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSemiAuthStore } from '../stores/semiAuth';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'SemiAuthStatus',
  setup() {
    const authStore = useAuthStore();
    const semiAuthStore = useSemiAuthStore();
    const isComponentMounted = ref(true);

    onMounted(() => {
      isComponentMounted.value = true;
      semiAuthStore.initializeFromStorage();
    });

    onUnmounted(() => {
      isComponentMounted.value = false;
      // 不停止 ping interval，因为它应该在整个应用级别管理
      // 只有在用户明确登出或会话过期时才停止
    });

    const expiresIn = computed(() => {
      if (!semiAuthStore.expiresAt) return 'N/A';

      const now = new Date();
      const expires = new Date(semiAuthStore.expiresAt);
      const diff = Math.max(0, expires - now);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return `${minutes}m ${seconds}s`;
    });

    const logout = () => {
      semiAuthStore.logout();
    };

    return {
      authStore,
      semiAuthStore,
      expiresIn,
      logout
    };
  }
};
</script>

<style scoped>
.semi-auth-status {
  margin-bottom: 10px;
}

.expires-in {
  font-weight: bold;
  font-family: monospace;
}

.logout-btn {
  min-width: auto;
}
</style>
