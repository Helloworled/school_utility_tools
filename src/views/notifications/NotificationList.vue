<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Notifications</h1>
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                  v-model="filters.query"
                  label="Search"
                  prepend-icon="mdi-magnify"
                  clearable
                  @keyup.enter="performSearch"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="filters.read"
                  :items="readOptions"
                  label="Read Status"
                  clearable
                  @update:model-value="performSearch"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="filters.type"
                  :items="typeOptions"
                  label="Type"
                  clearable
                  @update:model-value="performSearch"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="filters.related_type"
                  :items="relatedTypeOptions"
                  label="Related Type"
                  clearable
                  @update:model-value="performSearch"
                ></v-select>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" sm="6">
                <v-menu
                  v-model="createdAfterMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="formattedCreatedAfter"
                      label="Created After"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      clearable
                      @click:clear="clearCreatedAfter"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="filters.created_after"
                    @update:model-value="createdAfterMenu = false; performSearch()"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12" sm="6">
                <v-menu
                  v-model="createdBeforeMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="formattedCreatedBefore"
                      label="Created Before"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      clearable
                      @click:clear="clearCreatedBefore"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="filters.created_before"
                    @update:model-value="createdBeforeMenu = false; performSearch()"
                  ></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12">
                <v-btn
                  color="primary"
                  @click="performSearch"
                  :loading="loading"
                  block
                >
                  Search
                </v-btn>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12">
                <v-btn
                  color="grey"
                  @click="resetFilters"
                  block
                  outlined
                >
                  Reset Filters
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Notification List -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="notifications.length === 0" class="text-center py-4">
              <p>No notifications found.</p>
            </div>

            <div v-else>
              <v-list>
                <v-list-item
                  v-for="notification in notifications"
                  :key="notification._id"
                  @click="viewNotification(notification._id)"
                  :class="{ 'unread': !notification.read }"
                  class="notification-item"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="getNotificationColor(notification.type)">
                      <v-icon color="white">
                        {{ getNotificationIcon(notification.type) }}
                      </v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ notification.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ notification.message }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-chip
                      :color="notification.read ? 'grey' : 'primary'"
                      size="small"
                      class="mr-2"
                    >
                      {{ notification.read ? 'Read' : 'Unread' }}
                    </v-chip>

                    <v-btn
                      :icon="notification.read ? 'mdi-close' : 'mdi-check'"
                      size="small"
                      variant="text"
                      @click.stop="markAsRead(notification._id, !notification.read)"
                    ></v-btn>

                    <v-btn
                      icon="mdi-dots-vertical"
                      size="small"
                      variant="text"
                      @click.stop="showMenu(notification._id)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              v-if="pagination.total > pagination.limit"
              color="primary"
              @click="loadMore"
              :loading="loading"
              outlined
            >
              Load More
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications';

const router = useRouter();
const notificationsStore = useNotificationsStore();

// Date picker menus
const createdAfterMenu = ref(false);
const createdBeforeMenu = ref(false);

// Filter options
const readOptions = [
  { title: 'All', value: null },
  { title: 'Read', value: 'true' },
  { title: 'Unread', value: 'false' }
];

const typeOptions = [
  { title: 'All', value: null },
  { title: 'Info', value: 'info' },
  { title: 'Warning', value: 'warning' },
  { title: 'Error', value: 'error' },
  { title: 'Success', value: 'success' }
];

const relatedTypeOptions = [
  { title: 'All', value: null },
  { title: 'Todo', value: 'todo' },
  { title: 'Calendar', value: 'calendar' },
  { title: 'Note', value: 'note' }
];

// Get notifications and filters from store
const notifications = computed(() => notificationsStore.notifications);
const loading = computed(() => notificationsStore.loading);
const filters = computed(() => notificationsStore.filters);
const pagination = computed(() => notificationsStore.pagination);

// Formatted dates for display
const formattedCreatedAfter = computed(() => {
  return formatDate(filters.value.created_after);
});

const formattedCreatedBefore = computed(() => {
  return formatDate(filters.value.created_before);
});

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get notification color based on type
const getNotificationColor = (type) => {
  switch (type) {
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'success':
      return 'success';
    default:
      return 'grey';
  }
};

// Get notification icon based on type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'info':
      return 'mdi-information';
    case 'warning':
      return 'mdi-alert';
    case 'error':
      return 'mdi-alert-circle';
    case 'success':
      return 'mdi-check-circle';
    default:
      return 'mdi-bell';
  }
};

// Perform search
const performSearch = async () => {
  notificationsStore.setPagination({ page: 1 });
  await notificationsStore.searchNotifications();
};

// Reset filters
const resetFilters = () => {
  notificationsStore.resetFilters();
  performSearch();
};

// Clear date filters
const clearCreatedAfter = () => {
  notificationsStore.setFilters({ created_after: null });
  performSearch();
};

const clearCreatedBefore = () => {
  notificationsStore.setFilters({ created_before: null });
  performSearch();
};

// View notification
const viewNotification = (id) => {
  router.push(`/notifications/${id}`);
};

// Mark notification as read/unread
const markAsRead = async (id, read) => {
  await notificationsStore.markAsRead(id, read);
};

// Load more notifications
const loadMore = async () => {
  const newPage = pagination.value.page + 1;
  notificationsStore.setPagination({ page: newPage });
  await notificationsStore.searchNotifications();
};

// Show menu for notification actions
const showMenu = (id) => {
  // This function can be expanded to show a menu with additional actions
  // For now, it's a placeholder for future functionality
  console.log('Show menu for notification:', id);
};

// Initialize on mount
onMounted(async () => {
  await performSearch();
});
</script>

<style scoped>
.notification-item {
  cursor: pointer;
}

.notification-item.unread {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.08);
}
</style>
