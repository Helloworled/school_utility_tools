import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as todosApi from '@/api/todos';

export const useTodosStore = defineStore('todos', () => {
  // State
  const todos = ref([]);
  const currentTodo = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 1,
    limit: 25,
    total: 0
  });
  const filters = ref({
    category: null,
    status: null,
    tag: null,
    search: ''
  });

  // Getters
  const filteredTodos = computed(() => {
    let result = [...todos.value];

    // Apply filters
    if (filters.value.category) {
      result = result.filter(todo => todo.category === filters.value.category);
    }

    if (filters.value.status) {
      result = result.filter(todo => todo.status === filters.value.status);
    }

    if (filters.value.tag) {
      result = result.filter(todo => todo.tag === filters.value.tag);
    }

    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase();
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(searchLower) || 
        todo.description.toLowerCase().includes(searchLower)
      );
    }

    return result;
  });

  const todosByStatus = computed(() => {
    return {
      not_done: filteredTodos.value.filter(todo => todo.status === 'not_done'),
      wait_submit: filteredTodos.value.filter(todo => todo.status === 'wait_submit'),
      already_done: filteredTodos.value.filter(todo => todo.status === 'already_done')
    };
  });

  const todosByCategory = computed(() => {
    const categories = {};
    filteredTodos.value.forEach(todo => {
      if (!categories[todo.category]) {
        categories[todo.category] = [];
      }
      categories[todo.category].push(todo);
    });
    return categories;
  });

  const todosByPriority = computed(() => {
    return {
      high: filteredTodos.value.filter(todo => todo.priority === 'high'),
      medium: filteredTodos.value.filter(todo => todo.priority === 'medium'),
      low: filteredTodos.value.filter(todo => todo.priority === 'low')
    };
  });

  const upcomingTodos = computed(() => {
    const now = new Date();
    // Get today's date at midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return filteredTodos.value
      .filter(todo => {
        const startDate = new Date(todo.start_date);
        // Compare dates only, ignoring time
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        return start > today && todo.status !== 'already_done';
      })
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  });

  const overdueTodos = computed(() => {
    const now = new Date();
    // Get today's date at midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return filteredTodos.value
      .filter(todo => {
        const endDate = new Date(todo.end_date);
        // Compare dates only, ignoring time
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return end < today && todo.status !== 'already_done';
      })
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  });

  const inProgressTodos = computed(() => {
    const now = new Date();
    // Get today's date at midnight for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return filteredTodos.value
      .filter(todo => {
        const startDate = new Date(todo.start_date);
        const endDate = new Date(todo.end_date);
        // Compare dates only, ignoring time
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return start <= today && end >= today && todo.status !== 'already_done';
      })
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  });

  // Actions
  const fetchTodos = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.getTodos({
        page: pagination.value.page,
        limit: pagination.value.limit,
        category: filters.value.category,
        status: filters.value.status,
        tag: filters.value.tag,
        search: filters.value.search,
        ...params
      });

      if (response.success) {
        // Check if we should append or replace todos
        if (params.append) {
          todos.value = [...todos.value, ...response.data.todos];
        } else {
          todos.value = response.data.todos;
        }
        pagination.value.total = response.data.total;
        pagination.value.page = response.data.page;
        pagination.value.limit = response.data.limit;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch todos';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Search todos with the new search API
  const searchTodos = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.searchTodos({
        query: filters.value.search || params.query || '',
        page: pagination.value.page,
        limit: pagination.value.limit,
        sort: params.sort || 'start_date',
        category: filters.value.category,
        status: filters.value.status,
        tag: filters.value.tag,
        priority: filters.value.priority,
        ...params
      });

      if (response.success) {
        // Check if we should append or replace todos
        if (params.append) {
          todos.value = [...todos.value, ...response.data.todos];
        } else {
          todos.value = response.data.todos;
        }
        pagination.value.total = response.data.total;
        pagination.value.page = response.data.page;
        pagination.value.limit = response.data.limit;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to search todos';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTodo = async (id) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.getTodo(id);

      if (response.success) {
        currentTodo.value = response.data.todo;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch todo';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createTodo = async (todoData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.createTodo(todoData);

      if (response.success) {
        todos.value.unshift(response.data.todo);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create todo';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateTodo = async (id, todoData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.updateTodo(id, todoData);

      if (response.success) {
        // Update todo in the list
        const index = todos.value.findIndex(todo => todo._id === id);
        if (index !== -1) {
          todos.value[index] = response.data.todo;
        }

        // Update current todo if it's the one being edited
        if (currentTodo.value && currentTodo.value._id === id) {
          currentTodo.value = response.data.todo;
        }
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update todo';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteTodo = async (id) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.deleteTodo(id);

      if (response.success) {
        // Remove todo from the list
        todos.value = todos.value.filter(todo => todo._id !== id);

        // Clear current todo if it's the one being deleted
        if (currentTodo.value && currentTodo.value._id === id) {
          currentTodo.value = null;
        }
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete todo';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      category: null,
      status: null,
      tag: null,
      search: ''
    };
  };

  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination };
  };

  const clearCurrentTodo = () => {
    currentTodo.value = null;
  };

  return {
    // State
    todos,
    currentTodo,
    loading,
    error,
    pagination,
    filters,

    // Getters
    filteredTodos,
    todosByStatus,
    todosByCategory,
    todosByPriority,
    upcomingTodos,
    overdueTodos,
    inProgressTodos,

    // Actions
    fetchTodos,
    searchTodos,
    fetchTodo,
    createTodo,
    updateTodo,
    deleteTodo,
    setFilters,
    resetFilters,
    setPagination,
    clearCurrentTodo
  };
});
