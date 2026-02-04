<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Notification Details</h1>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else-if="notification">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="notification-header" :style="{ backgroundColor: getNotificationColor(notification.type) }">
              <h2>{{ notification.title }}</h2>
              <div class="notification-meta">
                <v-chip :color="notification.read ? 'grey' : 'white'" text-color="black" size="small" class="mr-2">
                  {{ notification.read ? 'Read' : 'Unread' }}
                </v-chip>
                <v-chip :color="notification.type" text-color="white" size="small">
                  {{ notification.type }}
                </v-chip>
              </div>
            </div>

            <v-divider></v-divider>

            <v-row class="mt-4">
              <v-col cols="12">
                <h3>Message</h3>
                <p>{{ notification.message }}</p>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <h3>Created At</h3>
                <p>{{ formatDateTime(notification.createdAt) }}</p>
              </v-col>

              <v-col cols="12" sm="6" v-if="notification.related_type">
                <h3>Related</h3>
                <p>{{ notification.related_type }}</p>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" to="/notifications">Back to List</v-btn>
            <v-btn 
color="primary" 
              @click="toggleReadStatus"
              v-if="!notification.read"
              
            >
              Mark as Read
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" class="text-center py-4">
        <p>Notification not found</p>
        <v-btn color="primary" to="/notifications">Back to List</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications';

const route = useRoute();
const notificationsStore = useNotificationsStore();

// Get notification from store
const notification = ref(null);
const loading = ref(false);

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Get notification color based on type
const getNotificationColor = (type) => {
  switch (type) {
    case 'info':
      return '#2196F3';
    case 'warning':
      return '#FF9800';
    case 'error':
      return '#F44336';
    case 'success':
      return '#4CAF50';
    default:
      return '#9E9E9E';
  }
};

// Toggle read status
const toggleReadStatus = async () => {
  if (notification.value) {
    const newReadStatus = !notification.value.read;
    await notificationsStore.markAsRead(notification.value._id, newReadStatus);
    notification.value.read = newReadStatus;
  }
};

// Load notification on mount
onMounted(async () => {
  loading.value = true;
  try {
    await notificationsStore.fetchNotification(route.params.id);
    notification.value = notificationsStore.currentNotification;
  } catch (error) {
    console.error('Error fetching notification:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.notification-header {
  padding: 16px;
  border-radius: 4px;
  color: white;
  margin-bottom: 16px;
}

.notification-header h2 {
  margin-top: 0;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  align-items: center;
}
</style>
