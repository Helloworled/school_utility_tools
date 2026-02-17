<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Dashboard</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text class="text-center">
            <div class="text-h2">{{ todosStore.todos.length }}</div>
            <div class="text-subtitle-1">Total Todos</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text class="text-center">
            <div class="text-h2">{{ todosStore.todosByStatus.not_done.length }}</div>
            <div class="text-subtitle-1">Not Done</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text class="text-center">
            <div class="text-h2">{{ todosStore.todosByStatus.wait_submit.length }}</div>
            <div class="text-subtitle-1">Wait Submit</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4">
          <v-card-text class="text-center">
            <div class="text-h2">{{ todosStore.todosByStatus.already_done.length }}</div>
            <div class="text-subtitle-1">Already Done</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4" :color="notificationsStore.unreadCount > 0 ? 'info' : 'grey'">
          <v-card-text class="text-center">
            <div class="text-h2">{{ notificationsStore.unreadCount }}</div>
            <div class="text-subtitle-1">Unread Notifications</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>


    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>
            <span>In Progress Todos</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" @click="refreshTodos"></v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="todosStore.inProgressTodos.length === 0" class="text-center py-4">
              <p>No in progress todos</p>
            </div>

            <v-list v-else>
              <v-list-item
                v-for="todo in todosStore.inProgressTodos.slice(0, 10)"
                :key="todo._id"
                @click="viewTodo(todo._id)"
                class="todo-item"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getTodoColor(todo.theme)">
                    <span class="white--text">{{ todo.title.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                </template>

                <v-list-item-content>
                  <v-list-item-title>{{ todo.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(todo.start_date) }} - {{ formatDate(todo.end_date) }}
                  </v-list-item-subtitle>
                </v-list-item-content>

                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(todo.status)"
                    size="small"
                  >
                    {{ formatStatus(todo.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text to="/todos">View All</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>
            <span>Upcoming Todos</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" @click="refreshTodos"></v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="todosStore.upcomingTodos.length === 0" class="text-center py-4">
              <p>No upcoming todos</p>
            </div>

            <v-list v-else>
              <v-list-item
                v-for="todo in todosStore.upcomingTodos.slice(0, 5)"
                :key="todo._id"
                @click="viewTodo(todo._id)"
                class="todo-item"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getTodoColor(todo.theme)">
                    <span class="white--text">{{ todo.title.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                </template>

                <v-list-item-content>
                  <v-list-item-title>{{ todo.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(todo.start_date) }}
                  </v-list-item-subtitle>
                </v-list-item-content>

                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(todo.status)"
                    size="small"
                  >
                    {{ formatStatus(todo.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text to="/todos">View All</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>
            <span>Overdue Todos</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" @click="refreshTodos"></v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="todosStore.overdueTodos.length === 0" class="text-center py-4">
              <p>No overdue todos</p>
            </div>

            <v-list v-else>
              <v-list-item
                v-for="todo in todosStore.overdueTodos.slice(0, 5)"
                :key="todo._id"
                @click="viewTodo(todo._id)"
                class="todo-item"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getTodoColor(todo.theme)">
                    <span class="white--text">{{ todo.title.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                </template>

                <v-list-item-content>
                  <v-list-item-title>{{ todo.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Due: {{ formatDate(todo.end_date) }}
                  </v-list-item-subtitle>
                </v-list-item-content>

                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(todo.status)"
                    size="small"
                  >
                    {{ formatStatus(todo.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text to="/todos">View All</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-btn block color="primary" to="/calendar">
                  <v-icon left>mdi-calendar</v-icon>
                  Calendar
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn block color="success" to="/todos/create">
                  <v-icon left>mdi-plus</v-icon>
                  Create Todo
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn block color="info" to="/todos">
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                  View Todos
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn block color="primary" to="/files">
                  <v-icon left>mdi-folder</v-icon>
                  Files
                </v-btn>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-btn block color="warning" to="/notifications">
                  <v-icon left>mdi-bell</v-icon>
                  View Notifications
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>
            <span>Recent Notifications</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-refresh" @click="refreshNotifications"></v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="loadingNotifications" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="recentNotifications.length === 0" class="text-center py-4">
              <p>No recent notifications</p>
            </div>

            <v-list v-else>
              <v-list-item
                v-for="notification in recentNotifications.slice(0, 5)"
                :key="notification._id"
                @click="viewNotification(notification._id)"
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
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text to="/notifications">View All</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTodosStore } from '@/stores/todos';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';

const router = useRouter();
const todosStore = useTodosStore();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

const loading = ref(false);
const loadingNotifications = ref(false);

// Get recent notifications
const recentNotifications = computed(() => notificationsStore.notifications);

// View todo
const viewTodo = (id) => {
  router.push({ name: 'todo-detail', params: { id } });
};

// Refresh todos
const refreshTodos = async () => {
  loading.value = true;
  try {
    await todosStore.fetchTodos();
  } catch (error) {
    console.error('Error fetching todos:', error);
  } finally {
    loading.value = false;
  }
};

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

// Format status
const formatStatus = (status) => {
  switch (status) {
    case 'not_done':
      return 'Not Done';
    case 'wait_submit':
      return 'Wait Submit';
    case 'already_done':
      return 'Already Done';
    default:
      return status;
  }
};

// Get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'not_done':
      return 'error';
    case 'wait_submit':
      return 'warning';
    case 'already_done':
      return 'success';
    default:
      return 'grey';
  }
};

// Get todo color based on theme
const getTodoColor = (theme) => {
  switch (theme) {
    case 'red':
      return '#F44336';
    case 'green':
      return '#4CAF50';
    case 'blue':
      return '#2196F3';
    case 'yellow':
      return '#FFEB3B';
    case 'black':
      return '#000000';
    case 'white':
      return '#FFFFFF';
    case 'grey':
    default:
      return '#9E9E9E';
  }
};

// View notification
const viewNotification = (id) => {
  router.push({ name: 'notification-detail', params: { id } });
};

// Refresh notifications
const refreshNotifications = async () => {
  loadingNotifications.value = true;
  try {
    await notificationsStore.fetchNotifications();
  } catch (error) {
    console.error('Error fetching notifications:', error);
  } finally {
    loadingNotifications.value = false;
  }
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

// Initialize on mount
onMounted(async () => {
  loading.value = true;
  try {
    // Initialize auth state if needed
    if (!authStore.user && authStore.accessToken) {
      await authStore.getCurrentUser();
    }

    // Only fetch todos if user is authenticated
    if (authStore.isAuthenticated) {
      await todosStore.fetchTodos();
      await notificationsStore.fetchNotifications();
    }
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.todo-item {
  cursor: pointer;
}

.todo-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-item {
  cursor: pointer;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
