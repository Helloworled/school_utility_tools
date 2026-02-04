# Todo系统文档

## 1. 功能概述

Todo系统是一个基于Vue.js的任务管理应用，旨在帮助用户高效地组织和管理日常任务。该系统提供了任务的创建、编辑、删除、标记完成等核心功能，并支持任务的分类、优先级设置和搜索过滤。

### 1.1 核心功能

- **任务创建与编辑**：用户可以创建新任务，设置任务标题、描述、截止日期、优先级和分类。
- **任务状态管理**：用户可以将任务标记为完成或未完成。
- **任务删除**：用户可以删除不再需要的任务。
- **任务分类**：支持将任务分配到不同的分类中，便于组织管理。
- **优先级设置**：支持为任务设置高、中、低三种优先级。
- **任务搜索与过滤**：支持根据关键词搜索任务，并根据状态、分类、优先级进行过滤。
- **数据持久化**：任务数据保存在本地存储中，刷新页面后数据不会丢失。

## 2. 技术架构

### 2.1 技术栈

- **前端框架**：Vue.js 3
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **UI组件库**：Element Plus
- **本地存储**：LocalStorage
- **构建工具**：Vite

### 2.2 目录结构

```
src/
├── views/
│   └── todos/
│       ├── TodoList.vue       # 待办事项列表组件
│       ├── TodoForm.vue       # 待办事项表单组件
│       └── TodoItem.vue       # 待办事项单项组件
├── stores/
│   └── todoStore.js           # Todo状态管理
└── router/
    └── index.js               # 路由配置
```

## 3. 核心组件说明

### 3.1 TodoList.vue

**功能描述**：待办事项列表主组件，负责展示所有待办事项，并提供搜索、过滤等功能。

**主要功能**：
- 展示待办事项列表
- 提供搜索框，支持根据关键词搜索任务
- 提供过滤选项，支持按状态、分类、优先级过滤
- 提供添加新任务的入口
- 提供批量操作功能（如全部标记为完成、删除已完成任务等）

**核心代码片段**：
```javascript
// 计算属性，根据搜索词和过滤条件筛选任务
const filteredTodos = computed(() => {
  let result = todos.value;

  // 根据搜索词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(todo => 
      todo.title.toLowerCase().includes(query) || 
      todo.description.toLowerCase().includes(query)
    );
  }

  // 根据状态过滤
  if (filterStatus.value !== 'all') {
    result = result.filter(todo => todo.completed === (filterStatus.value === 'completed'));
  }

  // 根据分类过滤
  if (filterCategory.value !== 'all') {
    result = result.filter(todo => todo.category === filterCategory.value);
  }

  // 根据优先级过滤
  if (filterPriority.value !== 'all') {
    result = result.filter(todo => todo.priority === filterPriority.value);
  }

  return result;
});
```

### 3.2 TodoForm.vue

**功能描述**：待办事项表单组件，用于创建和编辑待办事项。

**主要功能**：
- 提供表单输入，包括标题、描述、截止日期、优先级和分类
- 表单验证，确保必填字段已填写
- 提交表单，创建或更新待办事项
- 取消编辑，返回列表视图

**核心代码片段**：
```javascript
// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      const todoData = {
        id: props.todo ? props.todo.id : Date.now(),
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        category: formData.category,
        completed: props.todo ? props.todo.completed : false,
        createdAt: props.todo ? props.todo.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (props.todo) {
        // 编辑模式，更新待办事项
        todoStore.updateTodo(todoData);
      } else {
        // 创建模式，添加新待办事项
        todoStore.addTodo(todoData);
      }

      emit('submit');
    }
  });
};
```

### 3.3 TodoItem.vue

**功能描述**：待办事项单项组件，展示单个待办事项的详细信息。

**主要功能**：
- 展示待办事项的标题、描述、截止日期、优先级和分类
- 提供标记完成/未完成的按钮
- 提供编辑和删除按钮
- 展示任务状态（已完成/未完成）

**核心代码片段**：
```javascript
// 切换任务完成状态
const toggleComplete = () => {
  todoStore.toggleTodoComplete(props.todo.id);
};

// 编辑任务
const editTodo = () => {
  emit('edit', props.todo);
};

// 删除任务
const deleteTodo = () => {
  ElMessageBox.confirm(
    '确定要删除这个待办事项吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      todoStore.deleteTodo(props.todo.id);
      ElMessage({
        type: 'success',
        message: '删除成功!',
      });
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消删除',
      });
    });
};
```

## 4. 状态管理

### 4.1 todoStore.js

**功能描述**：使用Pinia进行Todo系统的状态管理，管理所有待办事项的状态和操作。

**主要功能**：
- 存储所有待办事项
- 提供添加、更新、删除待办事项的方法
- 提供切换待办事项完成状态的方法
- 提供根据ID获取待办事项的方法
- 提供根据条件过滤待办事项的方法
- 将待办事项数据持久化到本地存储

**核心代码片段**：
```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useTodoStore = defineStore('todo', () => {
  // 状态
  const todos = ref([]);

  // 从本地存储加载待办事项
  const loadTodos = () => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      todos.value = JSON.parse(savedTodos);
    }
  };

  // 保存待办事项到本地存储
  const saveTodos = () => {
    localStorage.setItem('todos', JSON.stringify(todos.value));
  };

  // 添加待办事项
  const addTodo = (todo) => {
    todos.value.push(todo);
    saveTodos();
  };

  // 更新待办事项
  const updateTodo = (updatedTodo) => {
    const index = todos.value.findIndex(todo => todo.id === updatedTodo.id);
    if (index !== -1) {
      todos.value[index] = updatedTodo;
      saveTodos();
    }
  };

  // 删除待办事项
  const deleteTodo = (id) => {
    todos.value = todos.value.filter(todo => todo.id !== id);
    saveTodos();
  };

  // 切换待办事项完成状态
  const toggleTodoComplete = (id) => {
    const todo = todos.value.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      saveTodos();
    }
  };

  // 根据ID获取待办事项
  const getTodoById = (id) => {
    return todos.value.find(todo => todo.id === id);
  };

  // 根据状态获取待办事项
  const getTodosByStatus = (completed) => {
    return todos.value.filter(todo => todo.completed === completed);
  };

  // 根据分类获取待办事项
  const getTodosByCategory = (category) => {
    return todos.value.filter(todo => todo.category === category);
  };

  // 根据优先级获取待办事项
  const getTodosByPriority = (priority) => {
    return todos.value.filter(todo => todo.priority === priority);
  };

  // 获取所有分类
  const categories = computed(() => {
    const categorySet = new Set(todos.value.map(todo => todo.category));
    return Array.from(categorySet);
  });

  // 获取所有待办事项
  const allTodos = computed(() => todos.value);

  // 获取已完成的待办事项
  const completedTodos = computed(() => todos.value.filter(todo => todo.completed));

  // 获取未完成的待办事项
  const incompleteTodos = computed(() => todos.value.filter(todo => !todo.completed));

  // 初始化时从本地存储加载待办事项
  loadTodos();

  return {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getTodoById,
    getTodosByStatus,
    getTodosByCategory,
    getTodosByPriority,
    categories,
    allTodos,
    completedTodos,
    incompleteTodos,
  };
});
```

## 5. 数据模型

### 5.1 Todo数据结构

```javascript
{
  id: number,              // 待办事项唯一标识
  title: string,           // 待办事项标题
  description: string,     // 待办事项描述
  dueDate: string,         // 截止日期（ISO格式）
  priority: string,        // 优先级（'high', 'medium', 'low'）
  category: string,        // 分类
  completed: boolean,      // 是否已完成
  createdAt: string,       // 创建时间（ISO格式）
  updatedAt: string        // 更新时间（ISO格式）
}
```

## 6. 路由配置

```javascript
{
  path: '/todos',
  name: 'Todos',
  component: () => import('@/views/todos/TodoList.vue'),
  meta: {
    title: '待办事项',
    icon: 'el-icon-document'
  }
}
```

## 7. 使用说明

### 7.1 创建待办事项

1. 点击"添加待办事项"按钮
2. 填写待办事项标题（必填）
3. 可选填写描述、设置截止日期、优先级和分类
4. 点击"保存"按钮创建待办事项

### 7.2 编辑待办事项

1. 在待办事项列表中找到要编辑的待办事项
2. 点击待办事项的"编辑"按钮
3. 修改待办事项信息
4. 点击"保存"按钮保存修改

### 7.3 标记待办事项为完成

1. 在待办事项列表中找到要标记的待办事项
2. 点击待办事项的复选框或"完成"按钮
3. 待办事项将被标记为完成，并显示在已完成列表中

### 7.4 删除待办事项

1. 在待办事项列表中找到要删除的待办事项
2. 点击待办事项的"删除"按钮
3. 确认删除操作

### 7.5 搜索和过滤待办事项

1. 在搜索框中输入关键词，按回车或点击搜索按钮
2. 使用过滤选项按状态、分类、优先级过滤待办事项
3. 可以组合使用搜索和过滤功能

## 8. 未来优化方向

1. **添加任务提醒功能**：在任务截止日期前发送提醒通知
2. **添加子任务功能**：支持将大任务分解为多个子任务
3. **添加任务标签功能**：支持为任务添加多个标签，便于分类管理
4. **添加任务排序功能**：支持按创建日期、截止日期、优先级等排序
5. **添加任务统计功能**：展示任务完成情况统计图表
6. **添加任务导入导出功能**：支持将任务数据导出为文件，或从文件导入
7. **添加任务协作功能**：支持多人协作管理任务
8. **优化移动端体验**：优化在移动设备上的使用体验
9. **添加任务模板功能**：支持创建任务模板，快速创建相似任务
10. **添加任务历史记录**：记录任务的修改历史，便于追溯
