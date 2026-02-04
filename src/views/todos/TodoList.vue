<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Todos</h1>
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="searchParams.category"
          :items="categoryOptions"
          label="Category"
          clearable
        ></v-select>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="searchParams.status"
          :items="statusOptions"
          label="Status"
          clearable
        ></v-select>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="searchParams.priority"
          :items="priorityOptions"
          label="Priority"
          clearable
        ></v-select>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="searchParams.theme"
          :items="themeOptions"
          label="Theme"
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-menu
          v-model="startDateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="searchParams.start_date"
              label="Start Date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="props"
              clearable
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="searchParams.start_date"
            @input="startDateMenu = false"
          ></v-date-picker>
        </v-menu>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-menu
          v-model="endDateMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ props }">
            <v-text-field
              v-model="searchParams.end_date"
              label="End Date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="props"
              clearable
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="searchParams.end_date"
            @input="endDateMenu = false"
          ></v-date-picker>
        </v-menu>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="searchParams.tag"
          label="Tag"
          prepend-icon="mdi-tag"
          clearable
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="searchParams.query"
          label="Search"
          prepend-icon="mdi-magnify"
          clearable
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
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

    <!-- Sort options -->
    <v-row>
      <v-col cols="12">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Sort by"
          @update:model-value="sortByChanged"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Todo List -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="sortedTodos.length === 0" class="text-center py-4">
              <p>No todos found. Create your first todo to get started!</p>
              <v-btn color="primary" to="/todos/create">Create Todo</v-btn>
            </div>

            <div v-else>
              <v-list>
                <v-list-item
                  v-for="todo in sortedTodos"
                  :key="todo._id"
                  @click="viewTodo(todo._id)"
                  class="todo-item"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="getTodoColor(todo.theme)">
                      <span class="white--text">{{ todo.title.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ todo.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(todo.start_date) }} - {{ formatDate(todo.end_date) }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-chip
                      :color="getStatusColor(todo.status)"
                      size="small"
                      class="mr-2"
                    >
                      {{ formatStatus(todo.status) }}
                    </v-chip>

                    <v-chip
                      v-if="todo.priority"
                      :color="getPriorityColor(todo.priority)"
                      size="small"
                      class="mr-2"
                    >
                      {{ todo.priority }}
                    </v-chip>

                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon="mdi-dots-vertical"
                          v-bind="props"
                          variant="text"
                          @click.stop
                        ></v-btn>
                      </template>

                      <v-list>
                        <v-list-item @click.stop="editTodo(todo._id)">
                          <v-list-item-title>Edit</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click.stop="deleteTodo(todo._id)">
                          <v-list-item-title>Delete</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" to="/todos/create">Create Todo</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pagination -->
    <v-row v-if="todosStore.pagination.total > todosStore.pagination.limit">
      <v-col cols="12" class="text-center">
        <v-pagination
          v-model="todosStore.pagination.page"
          :length="Math.ceil(todosStore.pagination.total / todosStore.pagination.limit)"
          @update:model-value="changePage"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- Load More Button -->
    <v-row v-if="todosStore.todos.length < todosStore.pagination.total">
      <v-col cols="12" class="text-center">
        <v-btn
          color="primary"
          @click="loadMore"
          :loading="loading"
          variant="outlined"
        >
          Load More
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTodosStore } from '@/stores/todos';

const router = useRouter();
const todosStore = useTodosStore();

// Search parameters
const searchParams = ref({
  category: null,
  status: null,
  priority: null,
  theme: null,
  start_date: null,
  end_date: null,
  tag: null,
  query: ''
});

// Date picker menus
const startDateMenu = ref(false);
const endDateMenu = ref(false);

// Sort
const sortBy = ref('date');

// Track if we're using search API
const useSearchApi = ref(false);

// Loading state
const loading = ref(false);

// Filter options
const categoryOptions = [
  { title: 'Study', value: 'study' },
  { title: 'Work', value: 'work' },
  { title: 'Life', value: 'life' },
  { title: 'Default', value: 'default' }
];

const statusOptions = [
  { title: 'Not Done', value: 'not_done' },
  { title: 'Wait Submit', value: 'wait_submit' },
  { title: 'Already Done', value: 'already_done' }
];

const priorityOptions = [
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
];

const themeOptions = [
  { title: 'Red', value: 'red' },
  { title: 'Green', value: 'green' },
  { title: 'Blue', value: 'blue' },
  { title: 'Yellow', value: 'yellow' },
  { title: 'Black', value: 'black' },
  { title: 'White', value: 'white' },
  { title: 'Grey', value: 'grey' }
];

const sortOptions = [
  { title: 'Date', value: 'date' },
  { title: 'Priority', value: 'priority' },
  { title: 'Status', value: 'status' }
];

// Get filtered and sorted todos
const sortedTodos = computed(() => {
  // Always use the todos from the store, regardless of whether we're using the search API

  
  let todos = [...todosStore.todos];

  // Apply sorting
  switch (sortBy.value) {
    case 'date':
      todos.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      break;
    case 'priority': {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      todos.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 0;
        const priorityB = priorityOrder[b.priority] || 0;
        return priorityB - priorityA;
      });
      break;
    }
    case 'status': {
      const statusOrder = { not_done: 3, wait_submit: 2, already_done: 1 };
      todos.sort((a, b) => {
        const statusA = statusOrder[a.status] || 0;
        const statusB = statusOrder[b.status] || 0;
        return statusB - statusA;
      });
      break;
    }
  }

  return todos;
});

// Handle sort by change
const sortByChanged = () => {
  // Sorting is handled by the sortedTodos computed property
  // This function is just a placeholder for the event handler
};


// Apply filters
const applyFilters = async () => {
  loading.value = true;
  try {
    // Apply filters - this is now just a placeholder for initial load
    useSearchApi.value = false;
    
    // Use search API if there's a search query
    if (searchParams.value.query && searchParams.value.query.trim()) {
      useSearchApi.value = true;
      await todosStore.searchTodos({
        page: todosStore.pagination.page,
        limit: todosStore.pagination.limit,
        sort: getSortParam()
      });
    } else {
      useSearchApi.value = false;
      await todosStore.fetchTodos({
        page: todosStore.pagination.page,
        limit: todosStore.pagination.limit
      });
    }
  } catch (error) {
    console.error('Error fetching todos:', error);
  } finally {
    loading.value = false;
  }
};

// Perform search with the search API
const performSearch = async () => {
  loading.value = true;
  try {
    // Always use the search API when performSearch is called
    useSearchApi.value = true;
    
    // Prepare search parameters
    const params = {
      page: 1, // Always start from page 1 when searching
      limit: todosStore.pagination.limit,
      sort: getSortParam()
    };
    
    // Add non-null search parameters
    if (searchParams.value.category) params.category = searchParams.value.category;
    if (searchParams.value.status) params.status = searchParams.value.status;
    if (searchParams.value.priority) params.priority = searchParams.value.priority;
    if (searchParams.value.theme) params.theme = searchParams.value.theme;
    if (searchParams.value.tag) params.tag = searchParams.value.tag;
    if (searchParams.value.query) params.query = searchParams.value.query;
    if (searchParams.value.start_date) params.start_date = searchParams.value.start_date;
    if (searchParams.value.end_date) params.end_date = searchParams.value.end_date;
    
    await todosStore.searchTodos(params);
  } catch (error) {
    console.error('Error searching todos:', error);
  } finally {
    loading.value = false;
  }
};

// Get sort parameter for API
const getSortParam = () => {
  switch (sortBy.value) {
    case 'date':
      return 'start_date';
    case 'priority':
      return 'priority';
    case 'status':
      return 'status';
    default:
      return 'start_date';
  }
};

// Change page
const changePage = async (page) => {
  todosStore.pagination.page = page;
  await applyFilters();
};

// Load more todos for lazy loading
const loadMore = async () => {
  if (loading.value) return;
  
  loading.value = true;
  try {
    // Increment the page number
    todosStore.pagination.page += 1;
    
    // Fetch the next page of todos with append flag
    if (useSearchApi.value) {
      await todosStore.searchTodos({
        page: todosStore.pagination.page,
        limit: todosStore.pagination.limit,
        sort: getSortParam(),
        append: true
      });
    } else {
      await todosStore.fetchTodos({
        page: todosStore.pagination.page,
        limit: todosStore.pagination.limit,
        append: true
      });
    }
  } catch (error) {
    console.error('Error loading more todos:', error);
    // Revert the page number if there was an error
    todosStore.pagination.page -= 1;
  } finally {
    loading.value = false;
  }
};

// View todo
const viewTodo = (id) => {
  router.push({ name: 'todo-detail', params: { id } });
};

// Edit todo
const editTodo = (id) => {
  router.push({ name: 'todo-edit', params: { id } });
};

// Delete todo
const deleteTodo = async (id) => {
  if (confirm('Are you sure you want to delete this todo?')) {
    try {
      await todosStore.deleteTodo(id);
      await applyFilters();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo. Please try again.');
    }
  }
};

// Format date
const formatDate = (dateString) => {
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

// Initialize on mount
onMounted(async () => {
  await applyFilters();
});
</script>

<style scoped>
.todo-item {
  cursor: pointer;
}

.todo-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
