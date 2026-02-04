# Message Notification System

## Overview

A message notification system that allows the application to send and display notifications to users. The system will support viewing notifications and marking them as read, while creation and deletion of notifications will be handled automatically by the backend services.

## Core Features

### 1. Notification Management

- **View Notifications**: Users can view their notification list and individual notification details
- **Mark as Read/Unread**: Users can toggle the read status of notifications
- **Edit Read Status**: API endpoint to modify the read status of a notification
- **Auto-creation**: Notifications are created automatically by backend services (not by users)
- **Auto-deletion**: A backend service will periodically clean up old read notifications

### 2. Read Status Tracking

- Each notification has a `read` field (boolean) that tracks whether the notification has been read
- This field can be edited via API (true/false)
- Backend service runs at regular intervals (e.g., daily) to clean out read notifications
- Unread notifications are preserved until marked as read

### 3. Push Notification System

- Real-time push notifications to frontend using WebSocket or Server-Sent Events (SSE)
- Eliminates need for frontend polling for new messages
- Backend pushes new notifications to connected clients immediately when created
- Frontend maintains persistent connection to receive push notifications

## API Endpoints

### 1. GET /api/notifications

- **Description**: Get list of notifications for the authenticated user
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `read`: Filter by read status (optional, values: true/false)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "notifications": [...],
      "total": 100,
      "page": 1,
      "limit": 10
    }
  }
  ```

### 2. GET /api/notifications/:id

- **Description**: Get details of a specific notification
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "notification": {
        "_id": "notification_id",
        "user_id": "user_id",
        "title": "Notification title",
        "message": "Notification message",
        "type": "info|warning|error|success",
        "read": false,
        "created_at": "ISO-8601 timestamp"
      }
    }
  }
  ```

### 3. PUT /api/notifications/:id/read

- **Description**: Mark a notification as read or unread
- **Request Body**:
  ```json
  {
    "read": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "notification": {
        "_id": "notification_id",
        "read": true,
        ...
      }
    }
  }
  ```

### 4. POST /api/notifications (Internal Use Only)

- **Description**: Create a new notification (used by backend services, not directly by users)
- **Request Body**:
  ```json
  {
    "user_id": "user_id",
    "title": "Notification title",
    "message": "Notification message",
    "type": "info|warning|error|success",
    "related_id": "optional_id_of_related_entity",
    "related_type": "optional_type_of_related_entity"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "notification": {
        "_id": "notification_id",
        ...
      }
    }
  }
  ```

### 5. GET /api/notifications/search

- **Description**: Search and filter notifications with multiple criteria
- **Query Parameters**:
  - `query`: Search in title and message fields (optional, default: all)
  - `read`: Filter by read status (optional, values: true/false, default: all)
  - `type`: Filter by notification type (optional, values: info|warning|error|success, default: all)
  - `related_type`: Filter by related entity type (optional, default: all)
  - `created_after`: Filter notifications created after this date (ISO-8601 format, optional)
  - `created_before`: Filter notifications created before this date (ISO-8601 format, optional)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort field (default: created_at)
  - `order`: Sort order (default: desc)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "notifications": [...],
      "total": 50,
      "page": 1,
      "limit": 10
    }
  }
  ```

## Data Model

### Notification Schema

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: 'User'),
  title: String (required),
  message: String (required),
  type: String (enum: ['info', 'warning', 'error', 'success']),
  read: Boolean (default: false),
  related_id: ObjectId (optional),
  related_type: String (optional),
  created_at: Date (default: Date.now),
  updated_at: Date (default: Date.now)
}
```

## Frontend Components

### 1. NotificationList.vue

- Displays list of notifications
- Shows visual indicator for unread notifications
- Supports filtering by read status
- Implements infinite scroll or pagination
- Provides search functionality with filters for:
  - Text search in title and message
  - Read status filter
  - Notification type filter
  - Related type filter
  - Date range filter (created_after, created_before)
- All filters default to "null" (all) when not specified

### 2. NotificationItem.vue

- Displays individual notification
- Shows read/unread status visually
- Provides action to mark as read/unread
- Links to related entity if applicable

### 3. NotificationBadge.vue

- Shows count of unread notifications
- Displays in navigation bar
- Updates in real-time when new notifications arrive

## Backend Services

### 1. Notification Service

- Handles creation of notifications for various events
- Provides methods for different notification types:
  - `createTodoReminder(userId, todoId)`
  - `createTodoOverdue(userId, todoId)`
  - `createSystemMessage(userId, title, message)`
  - etc.

### 2. Cleanup Service

- Runs at regular intervals (e.g., using node-cron)
- Deletes read notifications older than a specified period (e.g., 30 days)
- Preserves unread notifications regardless of age

### 3. Push Notification Service

- Manages WebSocket/SSE connections
- Broadcasts new notifications to connected users
- Handles connection/disconnection events
- Maintains user-to-socket mapping

## Implementation Considerations

1. **Real-time Updates**: Use WebSocket libraries like Socket.io or native SSE for push notifications
2. **Database Indexes**: Create indexes on user_id and read status for efficient querying
3. **Error Handling**: Implement retry logic for failed push notifications
4. **Rate Limiting**: Limit the number of notifications created per time period to prevent spam
5. **User Preferences**: Allow users to configure notification types they want to receive
6. **Mobile Support**: Consider integrating with native mobile push notifications (FCM, APNs) for mobile apps

---

**Original:**

a message notification system.

have some edit and view abilities (no need for create and delete(automatic)).

a lable for each notification, stores wether or not this message was read, a service in backend will run at regular intervals and clean out read notifications. this lable can be edited (true/false).

a push system that can push new messages to frontend instead of frontend asking for new messages repeatedlly. (push notifications)

API:

edit lable, create (used by other services, not human.), view list, view detail.
