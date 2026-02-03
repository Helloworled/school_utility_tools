
1. calendar:

   1. use fullcalendar (js library)
   2. support multiple views: month, week, day
   3. display todos with color coding based on status and theme
   4. can edit some data of todo: start_date, end_date, category, theme
   5. features:

      1. view switching (month/week/day)
      2. event preview on hover (show title, time, status)
      3. drag and drop to change dates
      4. click to create new todo (goto TodoCreate page)
      5. filter by category, status, tag
      6. search functionality
   6. real-time sync with TodoList (changes in one view reflect in the other)
   7. technical implementation:

      1. FullCalendar component integration:
         1. use @fullcalendar/vue3 package
         2. configure initialView to 'dayGridMonth'
         3. enable headerToolbar with view switching buttons
         4. set editable to true for drag and drop
         5. set selectable to true for click to create
         6. set eventClick to navigate to TodoDetail page
         7. set eventDrop to update todo start_date and end_date
         8. set eventResize to update todo end_date
         9. set eventDidMount for custom event styling based on status and theme
      2. State management:
         1. use Pinia for state management
         2. create calendarStore with todos array and filter criteria
         3. create todoStore with CRUD operations
         4. use actions to fetch todos from API
         5. use getters to filter and sort todos for calendar display
      3. API integration:
         1. use Axios for HTTP requests
         2. create api/calendar.js module with functions:
            1. getTodos(startDate, endDate, filters)
            2. updateTodo(id, data)
            3. createTodo(data)
            4. deleteTodo(id)
         3. handle errors with try-catch and display error messages
         4. use interceptors for authentication headers
      4. Real-time sync:
         1. use Vue's watch to monitor todoStore changes
         2. update calendar events when todos change
         3. use EventBus or Pinia for cross-component communication
      5. Routing:
         1. create routes for CalendarView, TodoCreate, TodoList, TodoEdit, TodoDetail
         2. use route parameters for todo IDs
         3. use route query parameters for filters and search
