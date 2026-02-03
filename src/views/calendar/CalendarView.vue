<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Calendar</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <FullCalendar
              :options="calendarOptions"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendarStore } from '@/stores/calendar';
import { useTodosStore } from '@/stores/todos';

const router = useRouter();
const calendarStore = useCalendarStore();
const todosStore = useTodosStore();

// Handle date select
const handleDateSelect = (selectInfo) => {
  const start = new Date(selectInfo.startStr);
  const end = new Date(selectInfo.endStr);
  // FullCalendar's end date is exclusive, so subtract one day
  end.setDate(end.getDate() - 1);

  // Navigate to todo create page with pre-filled dates
  router.push({
    name: 'todo-create',
    query: {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  });
};

// Handle event click
const handleEventClick = (clickInfo) => {
  // Navigate to todo detail page
  // If this is a recurring event instance, use the original event ID
  const eventId = clickInfo.event.extendedProps?.originalEventId || clickInfo.event.id;
  router.push({
    name: 'todo-detail',
    params: { id: eventId }
  });
};

// Handle event drop
const handleEventDrop = async (dropInfo) => {
  const eventId = dropInfo.event.id;
  const newStart = new Date(dropInfo.event.start);
  const newEnd = new Date(dropInfo.event.end || dropInfo.event.start);
  // FullCalendar's end date is exclusive, so subtract one day
  newEnd.setDate(newEnd.getDate() - 1);
  // Set time to noon to avoid timezone issues
  newStart.setHours(12, 0, 0, 0);
  newEnd.setHours(12, 0, 0, 0);

  try {
    // Check if this is a recurring event instance
    const extendedProps = dropInfo.event.extendedProps;
    if (extendedProps && extendedProps.originalEventId && extendedProps.recurrence && extendedProps.recurrence !== 'once') {
      // For recurring events, we need to update the original event
      const originalEventId = extendedProps.originalEventId;

      // Get the original event from the store
      const originalEvent = calendarStore.events.find((e) => e._id === originalEventId);
      if (!originalEvent) {
        throw new Error('Original event not found');
      }

      // Calculate the duration of the original event
      const originalStartDate = new Date(originalEvent.start_date);
      const originalEndDate = new Date(originalEvent.end_date);
      const duration = originalEndDate.getTime() - originalStartDate.getTime();

      // Calculate the new original start date by subtracting the instance offset
      const instanceIndex = parseInt(eventId.split('_instance_')[1], 10);
      let offsetDays = 0;
      if (extendedProps.recurrence === 'day') {
        offsetDays = instanceIndex * 1;
      } else if (extendedProps.recurrence === 'week') {
        offsetDays = instanceIndex * 7;
      } else if (extendedProps.recurrence === 'month') {
        // For months, calculate the month offset
        const originalDate = new Date(originalEvent.start_date);
        const newDate = new Date(newStart);
        const monthDiff = (newDate.getFullYear() - originalDate.getFullYear()) * 12 + (newDate.getMonth() - originalDate.getMonth());
        offsetDays = monthDiff * 30; // Approximate
      }

      // For monthly recurring events, we need to handle the date calculation differently
      // Instead of calculating offsets, we'll directly set the new original start date
      // based on the instance index and the new position
      
      if (extendedProps.recurrence === 'month') {
        // Calculate the new original start date by moving back the instance index months
        const newOriginalStart = new Date(newStart);
        newOriginalStart.setMonth(newOriginalStart.getMonth() - instanceIndex);
        const newOriginalEnd = new Date(newOriginalStart.getTime() + duration);

        await calendarStore.updateEvent(originalEventId, {
          start_date: newOriginalStart,
          end_date: newOriginalEnd
        });
      } else {
        // For daily and weekly recurring events, use the original logic
        const newOriginalStart = new Date(newStart);
        newOriginalStart.setDate(newOriginalStart.getDate() - offsetDays);
        const newOriginalEnd = new Date(newOriginalStart.getTime() + duration);

        await calendarStore.updateEvent(originalEventId, {
          start_date: newOriginalStart,
          end_date: newOriginalEnd
        });
      }
    } else {
      // For non-recurring events, update normally
      await calendarStore.updateEvent(eventId, {
        start_date: newStart,
        end_date: newEnd
      });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    // Revert the change if there was an error
    dropInfo.revert();
  }
};

// Handle event resize
const handleEventResize = async (resizeInfo) => {
  const eventId = resizeInfo.event.id;
  const newEnd = new Date(resizeInfo.event.end);
  // FullCalendar's end date is exclusive, so subtract one day
  newEnd.setDate(newEnd.getDate() - 1);
  // Set time to noon to avoid timezone issues
  newEnd.setHours(12, 0, 0, 0);

  try {
    // Check if this is a recurring event instance
    const extendedProps = resizeInfo.event.extendedProps;
    if (extendedProps && extendedProps.originalEventId && extendedProps.recurrence && extendedProps.recurrence !== 'once') {
      // For recurring events, we need to update the original event
      const originalEventId = extendedProps.originalEventId;

      // Get the original event from the store
      const originalEvent = calendarStore.events.find((e) => e._id === originalEventId);
      if (!originalEvent) {
        throw new Error('Original event not found');
      }

      // Calculate the new duration based on the resized instance
      const instanceStart = new Date(resizeInfo.event.start);
      const instanceEnd = new Date(newEnd);
      const newDuration = instanceEnd.getTime() - instanceStart.getTime();

      // Calculate the new original end date using the new duration
      const originalStartDate = new Date(originalEvent.start_date);
      const newOriginalEnd = new Date(originalStartDate.getTime() + newDuration);

      await calendarStore.updateEvent(originalEventId, {
        end_date: newOriginalEnd
      });
    } else {
      // For non-recurring events, update normally
      await calendarStore.updateEvent(eventId, {
        end_date: newEnd
      });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    // Revert the change if there was an error
    resizeInfo.revert();
  }
};

// Handle dates set (when user navigates to different time period)
const handleDatesSet = async (dateInfo) => {
  try {
    await calendarStore.fetchEvents(
      new Date(dateInfo.start),
      new Date(dateInfo.end)
    );
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};

// Calendar options
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  editable: true,
  //durationEditable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: false,
  weekends: true,
  allDayMaintainDuration: true,
  eventMaxStack: 3,
  eventMinHeight: 20,
  //eventLimit: 5,
  eventOverlap: true,
  eventResizableFromStart: true,
  eventStartEditable: true,
  eventDurationEditable: true,
  events: calendarStore.eventsForCalendar,
  select: handleDateSelect,
  eventClick: handleEventClick,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  datesSet: handleDatesSet
});

// Watch for changes in calendar store events
watch(() => calendarStore.eventsForCalendar, (newEvents) => {
  calendarOptions.value.events = newEvents;
}, { deep: true });

// Watch for changes in todos store to sync with calendar
watch(() => todosStore.todos, () => {
  calendarStore.syncWithTodos();
}, { deep: true });

// Initialize calendar on mount
onMounted(async () => {
  try {
    // Fetch initial events
    await calendarStore.fetchEvents();
  } catch (error) {
    console.error('Error fetching events:', error);
  }
});
</script>

<style>
/* FullCalendar styles */
.fc {
  font-family: 'Roboto', sans-serif;
}
.fc .fc-toolbar-title {
  font-size: 1.5rem;
}
.fc .fc-button {
  background-color: #1976D2;
  color: white;
  border: none;
}
.fc .fc-button:hover {
  background-color: #1565C0;
}
.fc .fc-button:active {
  background-color: #0D47A1;
}
.fc .fc-daygrid-day-number {
  color: #1976D2;
}
</style>
