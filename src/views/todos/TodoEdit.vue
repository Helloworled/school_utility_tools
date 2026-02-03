<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Edit Todo</h1>
      </v-col>
    </v-row>

    <v-row v-if="errorMessage">
      <v-col cols="12">
        <v-alert
          type="error"
          dismissible
          @click:close="errorMessage = null"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>
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
            <v-form ref="form" v-model="valid">
              <v-text-field
                v-model="todo.title"
                :rules="[rules.required, rules.maxLength(100)]"
                label="Title"
                prepend-icon="mdi-format-title"
                counter="100"
              ></v-text-field>

              <v-textarea
                v-model="todo.description"
                :rules="[rules.required, rules.maxLength(1000)]"
                label="Description"
                prepend-icon="mdi-text"
                counter="1000"
                rows="3"
              ></v-textarea>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="todo.category"
                    :items="categoryOptions"
                    label="Category"
                    prepend-icon="mdi-folder"
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="todo.tag"
                    label="Tag"
                    prepend-icon="mdi-tag"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="todo.status"
                    :items="statusOptions"
                    label="Status"
                    prepend-icon="mdi-checkbox-marked-circle"
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="todo.priority"
                    :items="priorityOptions"
                    label="Priority"
                    prepend-icon="mdi-flag"
                  ></v-select>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="todo.theme"
                    :items="themeOptions"
                    label="Theme"
                    prepend-icon="mdi-palette"
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-select
                    v-model="todo.recurrence"
                    :items="recurrenceOptions"
                    label="Recurrence"
                    prepend-icon="mdi-calendar-repeat"
                  ></v-select>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-menu
                    v-model="startDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-model="formattedStartDate"
                        label="Start Date"
                        prepend-icon="mdi-calendar"
                        readonly
                        v-bind="props"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="todo.start_date"
                      @update:model-value="startDateMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>

                <v-col cols="12" sm="6">
                  <v-menu
                    v-model="endDateMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-model="formattedEndDate"
                        label="End Date"
                        prepend-icon="mdi-calendar"
                        readonly
                        v-bind="props"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="todo.end_date"
                      @update:model-value="endDateMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12">
                  <v-menu
                    v-model="reminderMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-model="formattedReminder"
                        label="Reminder"
                        prepend-icon="mdi-bell"
                        readonly
                        clearable
                        v-bind="props"
                        @click:clear="todo.reminder = null"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="todo.reminder"
                      @update:model-value="reminderMenu = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
              </v-row>

              <v-row v-if="todo.recurrence !== 'once'">
                <v-col cols="12">
                  <v-alert type="info" dense>
                    This todo will be repeated {{ todo.recurrence === 'day' ? 'daily' : todo.recurrence === 'week' ? 'weekly' : 'monthly' }}.
                  </v-alert>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" :to="`/todos/${todo._id}`">Cancel</v-btn>
            <v-btn color="primary" :disabled="!valid || loading" :loading="loading" @click="updateTodo">Update Todo</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Preview</v-card-title>
          <v-card-text>
            <div class="todo-preview" :style="{ backgroundColor: getTodoColor(todo.theme) }">
              <h3>{{ todo.title || 'Todo Title' }}</h3>
              <p>{{ todo.description || 'Todo description' }}</p>
              <div class="todo-meta">
                <v-chip size="small" class="mr-2">{{ todo.category }}</v-chip>
                <v-chip v-if="todo.tag" size="small" class="mr-2">{{ todo.tag }}</v-chip>
                <v-chip size="small" :color="getStatusColor(todo.status)">{{ formatStatus(todo.status) }}</v-chip>
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTodosStore } from '@/stores/todos';

const router = useRouter();
const route = useRoute();
const todosStore = useTodosStore();

// Todo data
const todo = ref(null);

// Form validation
const valid = ref(true);
const loading = ref(false);
const startDateMenu = ref(false);
const endDateMenu = ref(false);
const reminderMenu = ref(false);
const errorMessage = ref(null);

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  maxLength: max => value => value.length <= max || `Must be at most ${max} characters`
};

// Formatted dates for display
const formattedStartDate = computed(() => {
  return formatDate(todo.value?.start_date);
});

const formattedEndDate = computed(() => {
  return formatDate(todo.value?.end_date);
});

const formattedReminder = computed(() => {
  return formatDate(todo.value?.reminder);
});

// Filter options
const categoryOptions = [
  { title: 'Default', value: 'default' },
  { title: 'Study', value: 'study' },
  { title: 'Work', value: 'work' },
  { title: 'Life', value: 'life' }
];

const statusOptions = [
  { title: 'Not Done', value: 'not_done' },
  { title: 'Wait Submit', value: 'wait_submit' },
  { title: 'Already Done', value: 'already_done' }
];

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' }
];

const themeOptions = [
  { title: 'Grey', value: 'grey' },
  { title: 'Red', value: 'red' },
  { title: 'Green', value: 'green' },
  { title: 'Blue', value: 'blue' },
  { title: 'Yellow', value: 'yellow' },
  { title: 'Black', value: 'black' },
  { title: 'White', value: 'white' }
];

const recurrenceOptions = [
  { title: 'Once', value: 'once' },
  { title: 'Daily', value: 'day' },
  { title: 'Weekly', value: 'week' },
  { title: 'Monthly', value: 'month' }
];

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

// Update todo
const updateTodo = async () => {
  if (!valid.value) return;

  loading.value = true;
  errorMessage.value = null;
  try {
    // Convert dates to ISO strings using local timezone
    const startDate = new Date(todo.value.start_date);
    const endDate = new Date(todo.value.end_date);
    // Set time to noon to avoid timezone issues
    startDate.setHours(12, 0, 0, 0);
    endDate.setHours(12, 0, 0, 0);
    
    const todoData = {
      ...todo.value,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };

    // Only include reminder if it's set
    if (todo.value.reminder) {
      todoData.reminder = new Date(todo.value.reminder).toISOString();
    }

    await todosStore.updateTodo(todo.value._id, todoData);

    // Navigate to todo detail
    router.push(`/todos/${todo.value._id}`);
  } catch (error) {
    console.error('Error updating todo:', error);
    // Set error message from store or use default
    errorMessage.value = todosStore.error || 'Failed to update todo. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Load todo on mount
onMounted(async () => {
  loading.value = true;
  try {
    await todosStore.fetchTodo(route.params.id);
    todo.value = { ...todosStore.currentTodo };

    // Convert ISO dates to date strings for v-date-picker
    if (todo.value) {
      const startDate = new Date(todo.value.start_date);
      const endDate = new Date(todo.value.end_date);
      todo.value.start_date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      todo.value.end_date = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      if (todo.value.reminder) {
        const reminderDate = new Date(todo.value.reminder);
        todo.value.reminder = `${reminderDate.getFullYear()}-${String(reminderDate.getMonth() + 1).padStart(2, '0')}-${String(reminderDate.getDate()).padStart(2, '0')}`;
      }
    }
  } catch (error) {
    console.error('Error fetching todo:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.todo-preview {
  padding: 16px;
  border-radius: 4px;
  color: white;
}

.todo-preview h3 {
  margin-top: 0;
}

.todo-meta {
  margin-top: 12px;
}
</style>
