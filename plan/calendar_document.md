# 日历系统文档

## 1. 功能概述

日历系统是一个基于Vue.js的日程管理应用，旨在帮助用户高效地组织和管理日程安排。该系统提供了日历视图、事件创建与编辑、事件分类、事件提醒等核心功能，并支持月视图、周视图和日视图等多种视图模式。

### 1.1 核心功能

- **日历视图**：提供月视图、周视图和日视图三种视图模式，满足不同场景下的日程查看需求。
- **事件创建与编辑**：用户可以创建新事件，设置事件标题、描述、开始时间、结束时间、地点和分类。
- **事件删除**：用户可以删除不再需要的事件。
- **事件分类**：支持将事件分配到不同的分类中，便于组织管理。
- **事件提醒**：支持为事件设置提醒时间，在事件开始前提醒用户。
- **事件搜索与过滤**：支持根据关键词搜索事件，并根据分类、日期范围进行过滤。
- **数据持久化**：事件数据保存在本地存储中，刷新页面后数据不会丢失。
- **拖拽调整**：支持拖拽事件调整时间，提升操作效率。

## 2. 技术架构

### 2.1 技术栈

- **前端框架**：Vue.js 3
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **UI组件库**：Element Plus
- **日历组件**：FullCalendar
- **本地存储**：LocalStorage
- **构建工具**：Vite

### 2.2 目录结构

```
src/
├── views/
│   └── calendar/
│       ├── CalendarView.vue      # 日历主视图组件
│       ├── EventForm.vue         # 事件表单组件
│       └── EventDetail.vue       # 事件详情组件
├── stores/
│   └── eventStore.js             # 事件状态管理
└── router/
    └── index.js                  # 路由配置
```

## 3. 核心组件说明

### 3.1 CalendarView.vue

**功能描述**：日历主视图组件，负责展示日历视图和事件列表。

**主要功能**：
- 展示日历视图（月视图、周视图、日视图）
- 提供视图切换功能
- 展示当前日期和事件
- 提供日期导航功能（上一天/周/月、下一天/周/月、今天）
- 提供添加新事件的入口
- 提供事件搜索和过滤功能

**核心代码片段**：
```javascript
// 日历视图配置
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: currentView.value,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: filteredEvents.value,
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventChange: handleEventChange
}));

// 处理日期选择
const handleDateSelect = (selectInfo) => {
  selectedDate.value = {
    start: selectInfo.startStr,
    end: selectInfo.endStr
  };
  showEventForm.value = true;
};

// 处理事件点击
const handleEventClick = (clickInfo) => {
  selectedEvent.value = {
    id: clickInfo.event.id,
    title: clickInfo.event.title,
    start: clickInfo.event.startStr,
    end: clickInfo.event.endStr,
    allDay: clickInfo.event.allDay,
    extendedProps: clickInfo.event.extendedProps
  };
  showEventDetail.value = true;
};

// 处理事件变更
const handleEventChange = (changeInfo) => {
  const eventData = {
    id: changeInfo.event.id,
    title: changeInfo.event.title,
    start: changeInfo.event.startStr,
    end: changeInfo.event.endStr,
    allDay: changeInfo.event.allDay,
    extendedProps: changeInfo.event.extendedProps
  };
  eventStore.updateEvent(eventData);
};
```

### 3.2 EventForm.vue

**功能描述**：事件表单组件，用于创建和编辑事件。

**主要功能**：
- 提供表单输入，包括标题、描述、开始时间、结束时间、地点、分类和提醒
- 表单验证，确保必填字段已填写
- 提交表单，创建或更新事件
- 取消编辑，返回日历视图

**核心代码片段**：
```javascript
// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      const eventData = {
        id: props.event ? props.event.id : Date.now(),
        title: formData.title,
        description: formData.description,
        start: formData.start,
        end: formData.end,
        allDay: formData.allDay,
        location: formData.location,
        category: formData.category,
        reminder: formData.reminder,
        createdAt: props.event ? props.event.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (props.event) {
        // 编辑模式，更新事件
        eventStore.updateEvent(eventData);
      } else {
        // 创建模式，添加新事件
        eventStore.addEvent(eventData);
      }

      emit('submit');
    }
  });
};
```

### 3.3 EventDetail.vue

**功能描述**：事件详情组件，展示单个事件的详细信息。

**主要功能**：
- 展示事件的标题、描述、开始时间、结束时间、地点、分类和提醒
- 提供编辑和删除按钮
- 展示事件状态

**核心代码片段**：
```javascript
// 编辑事件
const editEvent = () => {
  emit('edit', props.event);
};

// 删除事件
const deleteEvent = () => {
  ElMessageBox.confirm(
    '确定要删除这个事件吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      eventStore.deleteEvent(props.event.id);
      ElMessage({
        type: 'success',
        message: '删除成功!',
      });
      emit('delete');
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

### 4.1 eventStore.js

**功能描述**：使用Pinia进行日历系统的状态管理，管理所有事件的状态和操作。

**主要功能**：
- 存储所有事件
- 提供添加、更新、删除事件的方法
- 提供根据ID获取事件的方法
- 提供根据条件过滤事件的方法
- 将事件数据持久化到本地存储

**核心代码片段**：
```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEventStore = defineStore('event', () => {
  // 状态
  const events = ref([]);

  // 从本地存储加载事件
  const loadEvents = () => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      events.value = JSON.parse(savedEvents);
    }
  };

  // 保存事件到本地存储
  const saveEvents = () => {
    localStorage.setItem('events', JSON.stringify(events.value));
  };

  // 添加事件
  const addEvent = (event) => {
    events.value.push(event);
    saveEvents();
  };

  // 更新事件
  const updateEvent = (updatedEvent) => {
    const index = events.value.findIndex(event => event.id === updatedEvent.id);
    if (index !== -1) {
      events.value[index] = updatedEvent;
      saveEvents();
    }
  };

  // 删除事件
  const deleteEvent = (id) => {
    events.value = events.value.filter(event => event.id !== id);
    saveEvents();
  };

  // 根据ID获取事件
  const getEventById = (id) => {
    return events.value.find(event => event.id === id);
  };

  // 根据日期范围获取事件
  const getEventsByDateRange = (start, end) => {
    return events.value.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= end && eventEnd >= start;
    });
  };

  // 根据分类获取事件
  const getEventsByCategory = (category) => {
    return events.value.filter(event => event.category === category);
  };

  // 获取所有分类
  const categories = computed(() => {
    const categorySet = new Set(events.value.map(event => event.category));
    return Array.from(categorySet);
  });

  // 获取所有事件
  const allEvents = computed(() => events.value);

  // 初始化时从本地存储加载事件
  loadEvents();

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getEventsByDateRange,
    getEventsByCategory,
    categories,
    allEvents,
  };
});
```

## 5. 数据模型

### 5.1 Event数据结构

```javascript
{
  id: number,              // 事件唯一标识
  title: string,           // 事件标题
  description: string,     // 事件描述
  start: string,           // 开始时间（ISO格式）
  end: string,             // 结束时间（ISO格式）
  allDay: boolean,         // 是否为全天事件
  location: string,        // 事件地点
  category: string,        // 分类
  reminder: string,        // 提醒时间（'none', '5min', '15min', '30min', '1hour', '1day'）
  createdAt: string,       // 创建时间（ISO格式）
  updatedAt: string        // 更新时间（ISO格式）
}
```

## 6. 路由配置

```javascript
{
  path: '/calendar',
  name: 'Calendar',
  component: () => import('@/views/calendar/CalendarView.vue'),
  meta: {
    title: '日历',
    icon: 'el-icon-date'
  }
}
```

## 7. 使用说明

### 7.1 创建事件

1. 在日历视图中点击日期或时间段
2. 填写事件标题（必填）
3. 可选填写描述、设置开始时间、结束时间、地点、分类和提醒
4. 点击"保存"按钮创建事件

### 7.2 编辑事件

1. 在日历视图中找到要编辑的事件
2. 点击事件
3. 在事件详情中点击"编辑"按钮
4. 修改事件信息
5. 点击"保存"按钮保存修改

### 7.3 删除事件

1. 在日历视图中找到要删除的事件
2. 点击事件
3. 在事件详情中点击"删除"按钮
4. 确认删除操作

### 7.4 拖拽调整事件时间

1. 在日历视图中找到要调整的事件
2. 按住事件并拖动到新的日期或时间段
3. 松开鼠标，事件时间将被更新

### 7.5 切换视图

1. 在日历视图上方点击"月视图"、"周视图"或"日视图"按钮
2. 日历视图将切换到相应的视图模式

### 7.6 导航日期

1. 点击"上一天/周/月"或"下一天/周/月"按钮
2. 点击"今天"按钮快速返回当前日期

### 7.7 搜索和过滤事件

1. 在搜索框中输入关键词，按回车或点击搜索按钮
2. 使用过滤选项按分类、日期范围过滤事件
3. 可以组合使用搜索和过滤功能

## 8. 未来优化方向

1. **添加重复事件功能**：支持创建每天、每周、每月或每年重复的事件
2. **添加事件分享功能**：支持将事件分享给其他用户
3. **添加事件导入导出功能**：支持将事件数据导出为文件，或从文件导入
4. **添加事件统计功能**：展示事件分布统计图表
5. **优化移动端体验**：优化在移动设备上的使用体验
6. **添加事件模板功能**：支持创建事件模板，快速创建相似事件
7. **添加事件历史记录**：记录事件的修改历史，便于追溯
8. **添加多时区支持**：支持在不同时区下查看和管理事件
9. **添加事件冲突检测**：当事件时间冲突时提示用户
10. **添加事件颜色标记**：支持为不同分类的事件设置不同的颜色
