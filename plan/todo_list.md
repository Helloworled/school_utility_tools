1. Todo_list:

   1. integrate with calendar
   2. has independent create, edit, see and list pages apart from the calendar
   3. data:

      1. title: string, required, max length: 100
      2. description: string, required, max length: 1000
      3. tag: string, optional, default: "default"
      4. category: string, enum: required, default: "default" (e.g., "study", "work", "life")
      5. status: string, enum: ["not_done", "wait_submit", "already_done"], required, default on create: "not_done"
      6. theme: string, enum: ["red", "green", "blue", "yellow", "black", "white", "grey"], required, default: "grey"
      7. priority: string, enum: ["low", "medium", "high"], optional, default: "low"
      8. reminder: datetime, optional
      9. recurrence: string, enum: ["once", "day", "week", "month"], required, default: "once"
      10. start_date: datetime, auto fill on create
      11. end_date: datetime, auto fill on create
      12. created_at: datetime, auto fill on create
      13. updated_at: datetime, auto update on change
   4. pages:

      1. TodoCreate: form with validation, support for recurrence
         1. form fields: title, description, tag, category, status, theme, priority, reminder, recurrence, start_date, end_date
         2. validation rules using Vuelidate or VeeValidate
         3. recurrence options: once, day, week, month
         4. submit button creates todo via API
         5. cancel button navigates back to TodoList
      2. TodoList: with sorting (default by start_date and current date), filtering, search
         1. display todos as cards or list items
         2. sort controls: by date, priority, status
         3. filter controls: by category, status, tag
         4. search input for title and description
         5. pagination for large lists
         6. click on todo to navigate to TodoDetail
         7. buttons to create new todo and edit/delete existing todos
      3. TodoEdit: form with validation, support for recurrence
         1. pre-fill form with existing todo data
         2. form fields same as TodoCreate
         3. save button updates todo via API
         4. cancel button navigates back to TodoDetail
      4. TodoDetail: display full details
         1. display all todo fields
         2. buttons to edit and delete todo
         3. button to navigate back to TodoList
   5. features:

      1. sort by date, priority, status
      2. filter by category, status, tags
      3. search functionality
      4. recurring todos (create new instances based on recurrence setting)
   6. technical implementation:

      1. Backend API:
         1. create RESTful API endpoints:
            1. GET /api/todos - get all todos with optional filters
            2. GET /api/todos/:id - get a specific todo
            3. POST /api/todos - create a new todo
            4. PUT /api/todos/:id - update a todo
            5. DELETE /api/todos/:id - delete a todo
         2. request/response formats:
            1. GET /api/todos:
               1. query parameters: page, limit, sort, filter
               2. response: { success: true, data: { todos: [], total: 0, page: 1, limit: 10 } }
            2. GET /api/todos/🆔
               1. response: { success: true, data: { todo: {} } }
            3. POST /api/todos:
               1. request body: { title, description, tag, category, status, theme, priority, reminder, recurrence, start_date, end_date }
               2. response: { success: true, data: { todo: {} } }
            4. PUT /api/todos/🆔
               1. request body: { title, description, tag, category, status, theme, priority, reminder, recurrence, start_date, end_date }
               2. response: { success: true, data: { todo: {} } }
            5. DELETE /api/todos/🆔
               1. response: { success: true, message: "Todo deleted successfully" }
         3. authentication:
            1. use JWT for authentication
            2. include JWT in Authorization header
            3. verify JWT on all protected routes
         4. error handling:
            1. return appropriate HTTP status codes
            2. include error messages in response
            3. log errors for debugging
      2. Database:
         1. create Mongoose model for Todo:
            1. define schema with all fields and validation
            2. create indexes for frequently queried fields
            3. define methods for recurring todos
         2. create methods for CRUD operations:
            1. findTodos(filters, sort, pagination)
            2. findTodoById(id)
            3. createTodo(data)
            4. updateTodo(id, data)
            5. deleteTodo(id)
         3. implement recurring todos:
            1. create a function to generate recurring instances
            2. schedule a job to create new instances based on recurrence setting
            3. use node-cron or similar library for scheduling
      3. Frontend components:
         1. create Vue components for each page:
            1. CalendarView.vue
            2. TodoCreate.vue
            3. TodoList.vue
            4. TodoEdit.vue
            5. TodoDetail.vue
         2. use Vuetify components for UI:
            1. v-card for todo items
            2. v-form for forms with validation
            3. v-select for dropdowns
            4. v-date-picker for date selection
            5. v-btn for actions
         3. implement form validation:
            1. use Vuelidate or VeeValidate
            2. define validation rules for each field
            3. display error messages for invalid fields
         4. implement state management:
            1. create Pinia stores for todos and calendar
            2. define actions for CRUD operations
            3. define getters for filtered and sorted todos
         5. implement API integration:
            1. create Axios instance with base URL and interceptors
            2. create API functions for each endpoint
            3. handle errors and loading states
      4. Real-time sync:
         1. use Vue's watch to monitor todoStore changes
         2. update calendar events when todos change
         3. use EventBus or Pinia for cross-component communication
         4. implement optimistic updates for better UX
