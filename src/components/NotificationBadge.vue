<template>
  <v-badge
    :content="unreadCount"
    :color="badgeColor"
    overlap
  >
    <v-btn icon @click="toggleNotifications">
      <v-icon>mdi-bell</v-icon>
    </v-btn>
  </v-badge>
</template>

<script setup>
import { computed } from 'vue';
import { useNotificationsStore } from '@/stores/notifications';
import { useRouter } from 'vue-router';

const router = useRouter();
const notificationsStore = useNotificationsStore();

// Get unread count from store
const unreadCount = computed(() => notificationsStore.unreadCount);

// Determine badge color based on count
const badgeColor = computed(() => {
  if (unreadCount.value === 0) return 'grey';
  if (unreadCount.value < 5) return 'info';
  if (unreadCount.value < 10) return 'warning';
  return 'error';
});

// Navigate to notifications page
const toggleNotifications = () => {
  router.push('/notifications');
};
</script>

<style scoped>
.v-badge {
  cursor: pointer;
}
</style>
