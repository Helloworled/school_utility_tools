<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Todo Details</h1>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else-if="todo">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <div class="todo-detail-header" :style="{ backgroundColor: getTodoColor(todo.theme) }">
              <h2>{{ todo.title }}</h2>
            </div>

            <v-divider></v-divider>

            <v-row class="mt-4">
              <v-col cols="12">
                <h3>Description</h3>
                <p>{{ todo.description }}</p>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <h3>Category</h3>
                <p>{{ formatCategory(todo.category) }}</p>
              </v-col>

              <v-col cols="12" sm="6">
                <h3>Tag</h3>
                <p>{{ todo.tag || 'None' }}</p>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <h3>Status</h3>
                <v-chip :color="getStatusColor(todo.status)">
                  {{ formatStatus(todo.status) }}
                </v-chip>
              </v-col>

              <v-col cols="12" sm="6">
                <h3>Priority</h3>
                <v-chip :color="getPriorityColor(todo.priority)">
                  {{ todo.priority }}
                </v-chip>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <h3>Start Date</h3>
                <p>{{ formatDate(todo.start_date) }}</p>
              </v-col>

              <v-col cols="12" sm="6">
                <h3>End Date</h3>
                <p>{{ formatDate(todo.end_date) }}</p>
              </v-col>
            </v-row>

            <v-row v-if="todo.reminder">
              <v-col cols="12">
                <h3>Reminder</h3>
                <p>{{ formatDate(todo.reminder) }}</p>
              </v-col>
            </v-row>

            <v-row v-if="todo.recurrence !== 'once'">
              <v-col cols="12">
                <h3>Recurrence</h3>
                <p>This todo repeats {{ todo.recurrence === 'day' ? 'daily' : todo.recurrence === 'week' ? 'weekly' : 'monthly' }}</p>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <h3>Created</h3>
                <p>{{ formatDate(todo.createdAt) }}</p>
              </v-col>
            </v-row>

            <v-row v-if="todo.updatedAt !== todo.createdAt">
              <v-col cols="12">
                <h3>Last Updated</h3>
                <p>{{ formatDate(todo.updatedAt) }}</p>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" to="/todos">Back to List</v-btn>
            <v-btn color="primary" :to="`/todos/${todo._id}/edit`">Edit</v-btn>
            <v-btn color="error" @click="deleteTodo">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-btn block color="success" @click="markAsDone" :disabled="todo.status === 'already_done'">
                  Mark as Done
                </v-btn>
              </v-col>

              <v-col cols="12">
                <v-btn block color="warning" @click="markAsWaitSubmit" :disabled="todo.status === 'wait_submit'">
                  Mark as Wait Submit
                </v-btn>
              </v-col>

              <v-col cols="12">
                <v-btn block color="error" @click="markAsNotDone" :disabled="todo.status === 'not_done'">
                  Mark as Not Done
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" class="text-center py-4">
        <p>Todo not found</p>
        <v-btn color="primary" to="/todos">Back to List</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTodosStore } from '@/stores/todos';

const router = useRouter();
const route = useRoute();
const todosStore = useTodosStore();

// Todo data
const todo = ref(null);
const loading = ref(false);

// Format date
const formatDate = (dateString) => {
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

// Format category
const formatCategory = (category) => {
  switch (category) {
    case 'study':
      return 'Study';
    case 'work':
      return 'Work';
    case 'life':
      return 'Life';
    case 'default':
    default:
      return 'Default';
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

// Get priority color
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
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

// Mark as done
const markAsDone = async () => {
  try {
    await todosStore.updateTodo(todo.value._id, { status: 'already_done' });
    todo.value.status = 'already_done';
  } catch (error) {
    console.error('Error updating todo:', error);
    alert('Failed to update todo. Please try again.');
  }
};

// Mark as wait submit
const markAsWaitSubmit = async () => {
  try {
    await todosStore.updateTodo(todo.value._id, { status: 'wait_submit' });
    todo.value.status = 'wait_submit';
  } catch (error) {
    console.error('Error updating todo:', error);
    alert('Failed to update todo. Please try again.');
  }
};

// Mark as not done
const markAsNotDone = async () => {
  try {
    await todosStore.updateTodo(todo.value._id, { status: 'not_done' });
    todo.value.status = 'not_done';
  } catch (error) {
    console.error('Error updating todo:', error);
    alert('Failed to update todo. Please try again.');
  }
};

// Delete todo
const deleteTodo = async () => {
  if (confirm('Are you sure you want to delete this todo?')) {
    try {
      await todosStore.deleteTodo(todo.value._id);
      router.push('/todos');
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo. Please try again.');
    }
  }
};

// Load todo on mount
onMounted(async () => {
  loading.value = true;
  try {
    await todosStore.fetchTodo(route.params.id);
    todo.value = todosStore.currentTodo;
  } catch (error) {
    console.error('Error fetching todo:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.todo-detail-header {
  padding: 16px;
  border-radius: 4px;
  color: white;
  margin-bottom: 16px;
}

.todo-detail-header h2 {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
