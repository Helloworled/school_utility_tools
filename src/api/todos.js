import api from './axios';

// Get all todos with optional filters
export const getTodos = async (params = {}) => {
  const response = await api.get('/todos', { params });
  return response.data;
};

// Get a specific todo
export const getTodo = async (id) => {
  const response = await api.get(`/todos/${id}`);
  return response.data;
};

// Create a new todo
export const createTodo = async (todoData) => {
  const response = await api.post('/todos', todoData);
  return response.data;
};

// Update a todo
export const updateTodo = async (id, todoData) => {
  const response = await api.put(`/todos/${id}`, todoData);
  return response.data;
};

// Delete a todo
export const deleteTodo = async (id) => {
  const response = await api.delete(`/todos/${id}`);
  return response.data;
};

// Search todos with advanced filtering
export const searchTodos = async (params = {}) => {
  const response = await api.get('/todos/search', { params });
  return response.data;
};
