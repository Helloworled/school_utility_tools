import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as todosApi from '@/api/todos';
import { useTodosStore } from './todos';

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const events = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const currentView = ref('dayGridMonth');
  const currentDate = ref(new Date());

  // Getters
  const eventsForCalendar = computed(() => {
    const calendarEvents = [];

    for (const event of events.value) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);

      // For FullCalendar, end date is exclusive, so we need to add one day
      const displayEndDate = new Date(endDate);
      displayEndDate.setDate(displayEndDate.getDate() + 1);

      // Base event data
      const baseEventData = {
        title: event.title,
        allDay: true,
        backgroundColor: getEventColor(event),
        borderColor: getEventColor(event),
        textColor: getEventTextColor(event),
        extendedProps: {
          status: event.status,
          category: event.category,
          priority: event.priority,
          description: event.description,
          tag: event.tag,
          originalEventId: event._id,
          recurrence: event.recurrence
        }
      };

      // If it's a recurring event, generate multiple instances
      if (event.recurrence && event.recurrence !== 'once') {
        // Generate instances for the next 12 occurrences
        const maxInstances = 12;
        let instanceStartDate = new Date(startDate);
        let instanceEndDate = new Date(endDate);

        for (let i = 0; i < maxInstances; i += 1) {
          const instance = {
            ...baseEventData,
            id: `${event._id}_instance_${i}`,
            start: instanceStartDate.toISOString().split('T')[0],
            end: instanceEndDate.toISOString().split('T')[0]
          };

          calendarEvents.push(instance);

          // Calculate next occurrence based on recurrence type
          if (event.recurrence === 'day') {
            instanceStartDate.setDate(instanceStartDate.getDate() + 1);
            instanceEndDate.setDate(instanceEndDate.getDate() + 1);
          } else if (event.recurrence === 'week') {
            instanceStartDate.setDate(instanceStartDate.getDate() + 7);
            instanceEndDate.setDate(instanceEndDate.getDate() + 7);
          } else if (event.recurrence === 'month') {
            instanceStartDate.setMonth(instanceStartDate.getMonth() + 1);
            instanceEndDate.setMonth(instanceEndDate.getMonth() + 1);
          }
        }
      } else {
        // Non-recurring event, just add once
        const calendarEvent = {
          ...baseEventData,
          id: event._id,
          start: startDate.toISOString().split('T')[0],
          end: displayEndDate.toISOString().split('T')[0]
        };

        calendarEvents.push(calendarEvent);
      }
    }

    return calendarEvents;
  });

  // Actions
  const fetchEvents = async (start, end) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.getTodos({
        // Convert dates to ISO strings for API
        start_date: start ? start.toISOString() : undefined,
        end_date: end ? end.toISOString() : undefined
      });

      if (response.success) {
        events.value = response.data.todos;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch events';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateEvent = async (id, eventData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.updateTodo(id, eventData);

      if (response.success) {
        // Update event in the list
        const index = events.value.findIndex((event) => event._id === id);
        if (index !== -1) {
          events.value[index] = response.data.todo;
        }
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update event';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createEvent = async (eventData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.createTodo(eventData);

      if (response.success) {
        events.value.push(response.data.todo);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create event';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteEvent = async (id) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await todosApi.deleteTodo(id);

      if (response.success) {
        // Remove event from the list
        events.value = events.value.filter((event) => event._id !== id);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete event';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setCurrentView = (view) => {
    currentView.value = view;
  };

  const setCurrentDate = (date) => {
    currentDate.value = date;
  };

  const syncWithTodos = () => {
    const todosStore = useTodosStore();
    events.value = [...todosStore.todos];
  };

  // Helper function to get event color based on status and theme
  const getEventColor = (event) => {
    // Map theme colors to hex values
    const themeColors = {
      red: '#F44336',
      green: '#4CAF50',
      blue: '#2196F3',
      yellow: '#FFEB3B',
      black: '#000000',
      white: '#FFFFFF',
      grey: '#9E9E9E'
    };

    // Use theme color if available
    if (event.theme && themeColors[event.theme]) {
      return themeColors[event.theme];
    }

    // Default to grey
    return themeColors.grey;
  };

  // Helper function to get text color based on background color
  const getEventTextColor = (event) => {
    // Use black text for white and yellow themes
    if (event.theme === 'white' || event.theme === 'yellow') {
      return '#000000';
    }

    // Use white text for all other themes
    return '#FFFFFF';
  };

  return {
    // State
    events,
    loading,
    error,
    currentView,
    currentDate,

    // Getters
    eventsForCalendar,

    // Actions
    fetchEvents,
    updateEvent,
    createEvent,
    deleteEvent,
    setCurrentView,
    setCurrentDate,
    syncWithTodos
  };
});
