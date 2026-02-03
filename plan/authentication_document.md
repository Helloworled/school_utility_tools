# Authentication System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Token Strategy](#token-strategy)
4. [Authentication Flow](#authentication-flow)
5. [API Endpoints](#api-endpoints)
6. [Frontend Implementation](#frontend-implementation)
7. [Backend Implementation](#backend-implementation)
8. [Security Considerations](#security-considerations)
9. [Error Handling](#error-handling)
10. [Known Issues and Solutions](#known-issues-and-solutions)

## Overview

The authentication system implements a hybrid approach combining JWT (JSON Web Tokens) and session-based authentication to provide secure and efficient user authentication.

### Key Features
- JWT-based access tokens for API authentication
- Refresh token mechanism for seamless token renewal
- Token rotation for enhanced security
- Account lockout after failed login attempts
- Password reset functionality
- Email-based login with verification codes
- Protected routes with automatic token refresh
- Session management with logout functionality

## Architecture

### Components

#### Frontend
- **Auth Store (Pinia)**: Manages authentication state and user data
- **Axios Interceptors**: Handles automatic token injection and refresh
- **Auth API**: Provides methods for authentication-related API calls
- **Route Guards**: Protects authenticated routes

#### Backend
- **Auth Routes**: Express routes for authentication endpoints
- **JWT Utils**: Token generation and verification
- **User Model**: User data and authentication methods
- **Token Model**: Token storage and management
- **Middleware**: Authentication verification for protected routes

### Data Flow
```
Client → Axios Interceptor → API Request → Backend Middleware → Route Handler → Response
         ↓ (401 error)           ↓
    Token Refresh ← Auth Store ← Auth API ← Refresh Endpoint
```

## Token Strategy

### Access Token
- **Type**: JWT (JSON Web Token)
- **Expiration**: 15 minutes (configurable via JWT_ACCESS_EXPIRATION)
- **Storage**: Client-side (localStorage) only
- **Usage**: API request authentication
- **Verification**: Signature verification only (no database query)

### Refresh Token
- **Type**: JWT (JSON Web Token)
- **Expiration**: 7-30 days (configurable via JWT_REFRESH_EXPIRATION)
- **Storage**: Client-side (localStorage) + Database (Token collection)
- **Usage**: Access token renewal
- **Verification**: Database query required
- **Rotation**: New token generated on each refresh

### Token Rotation Strategy
The system implements token rotation for enhanced security:
1. Each refresh generates a new access token AND refresh token
2. Old refresh token is replaced atomically in the database
3. This limits the impact of token theft

## Authentication Flow

### 1. User Registration
```
Client → POST /api/auth/register
  ↓
Server validates input
  ↓
Server creates user account
  ↓
Server generates access token and refresh token
  ↓
Server saves refresh token to database
  ↓
Server returns user data and tokens to client
  ↓
Client stores tokens in localStorage and updates auth store
```

### 2. User Login
```
Client → POST /api/auth/login
  ↓
Server validates credentials
  ↓
Server checks account lockout status
  ↓
Server verifies password
  ↓
Server generates access token and refresh token
  ↓
Server saves refresh token to database (replaces any existing)
  ↓
Server returns user data and tokens to client
  ↓
Client stores tokens in localStorage and updates auth store
```

### 3. API Request with Token
```
Client → API Request (with access token in header)
  ↓
Axios interceptor adds access token to Authorization header
  ↓
Backend middleware verifies token signature
  ↓
Request proceeds to route handler
  ↓
Response returned to client
```

### 4. Token Refresh
```
Client → API Request (with expired access token)
  ↓
Backend returns 401 Unauthorized
  ↓
Axios interceptor detects 401 and triggers refresh
  ↓
Client → POST /api/auth/refresh (with refresh token)
  ↓
Server verifies refresh token in database
  ↓
Server generates new access token and refresh token
  ↓
Server atomically updates refresh token in database
  ↓
Server returns new tokens to client
  ↓
Client updates tokens in localStorage and auth store
  ↓
Original request is retried with new access token
```

### 5. User Logout
```
Client → POST /api/auth/logout (with refresh token)
  ↓
Server deletes refresh token from database
  ↓
Server returns success response
  ↓
Client clears tokens from localStorage and auth store
  ↓
Access token expires naturally (15 minutes)
```

### 6. Password Change
```
Client → PUT /api/auth/password
  ↓
Server verifies current password
  ↓
Server updates password
  ↓
Server deletes all refresh tokens for the user
  ↓
Server returns success response
  ↓
Client clears tokens and redirects to login
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "user_name": "string (3-20 characters, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (min 8 characters)",
  "rememberMe": "boolean (optional, default false)"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "user_name": "string",
      "email": "string",
      "avatar": "string (URL, optional)"
    },
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  }
}
```

**Response (Error - 400/429/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/login
Authenticate a user with username and password.

**Request Body:**
```json
{
  "user_name": "string",
  "password": "string",
  "rememberMe": "boolean (optional, default false)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "user_name": "string",
      "email": "string",
      "avatar": "string (URL, optional)"
    },
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  }
}
```

**Response (Error - 401/429/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/logout
Log out the current user.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/refresh
Refresh the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  }
}
```

**Response (Error - 401/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### GET /api/auth/me
Get the current authenticated user's information.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "user_name": "string",
      "email": "string",
      "avatar": "string (URL, optional)"
    }
  }
}
```

**Response (Error - 401/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### PUT /api/auth/profile
Update the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "user_name": "string (optional)",
  "avatar": "string (URL, optional)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "user_name": "string",
      "email": "string",
      "avatar": "string (URL, optional)"
    }
  }
}
```

**Response (Error - 400/401/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### PUT /api/auth/password
Change the current authenticated user's password.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 characters)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error - 400/401/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/forgot-password
Request a password reset email.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Response (Error - 400/404/429/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/reset-password
Reset password using a verification code.

**Request Body:**
```json
{
  "email": "string",
  "code": "string (6-digit)",
  "password": "string (min 8 characters)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (Error - 400/404/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/send-verification-code
Send a verification code for email login or password reset.

**Request Body:**
```json
{
  "email": "string",
  "type": "string (enum: 'login', 'password_reset')"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Verification code sent to email"
}
```

**Response (Error - 400/404/429/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

#### POST /api/auth/email-login
Authenticate a user with email and verification code.

**Request Body:**
```json
{
  "email": "string",
  "code": "string (6-digit)",
  "rememberMe": "boolean (optional, default false)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "user_name": "string",
      "email": "string",
      "avatar": "string (URL, optional)"
    },
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  }
}
```

**Response (Error - 400/401/500):**
```json
{
  "success": false,
  "message": "string (error description)",
  "error": "string (detailed error, optional)"
}
```

## Frontend Implementation

### Auth Store (Pinia)

Location: `src/stores/auth.js`

#### State
- `user`: Current user object
- `accessToken`: JWT access token
- `refreshToken`: JWT refresh token
- `loading`: Loading state indicator
- `error`: Error message

#### Getters
- `isAuthenticated`: Boolean indicating if user is authenticated

#### Actions
- `login(credentials)`: Authenticate user with username and password
- `register(userData)`: Register a new user account
- `logout()`: Log out the current user
- `refreshTokens()`: Refresh access and refresh tokens
- `getCurrentUser()`: Fetch current user information
- `updateProfile(profileData)`: Update user profile
- `changePassword(passwordData)`: Change user password
- `forgotPassword(email)`: Request password reset email
- `resetPassword(email, code, password)`: Reset password with verification code
- `sendVerificationCode(email, type)`: Send verification code for email login or password reset
- `emailLogin(email, code, rememberMe)`: Authenticate with email and verification code
- `initializeAuth()`: Initialize authentication state from localStorage

### Axios Interceptors

Location: `src/api/axios.js`

#### Request Interceptor
Automatically adds the access token to the Authorization header for all API requests.

```javascript
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

#### Response Interceptor
Handles automatic token refresh when receiving 401 errors.

Key features:
- Refresh lock mechanism to prevent concurrent refresh requests
- Request queue to hold requests during refresh
- Automatic retry of queued requests after successful refresh
- Automatic logout on refresh failure

```javascript
// Track ongoing token refresh to prevent race conditions
let isRefreshing = false;
let refreshSubscribers = [];

// Add a request to the queue
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all queued requests with the new token
const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authStore = useAuthStore();

      // Only try to refresh if we have a refresh token
      if (!authStore.refreshToken) {
        // Clear tokens and redirect to login
        authStore.user = null;
        authStore.accessToken = null;
        authStore.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      // Start the refresh process
      isRefreshing = true;

      try {
        await authStore.refreshTokens();

        // Retry original request with new token
        if (authStore.accessToken) {
          onRefreshed(authStore.accessToken);
          originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        authStore.user = null;
        authStore.accessToken = null;
        authStore.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### Auth API

Location: `src/api/auth.js`

Provides methods for all authentication-related API calls.

## Backend Implementation

### JWT Utils

Location: `backend/utils/jwt.js`

#### Functions
- `generateAccessToken(userId)`: Generate a new access token
- `generateRefreshToken(userId)`: Generate a new refresh token
- `generateResetToken(userId)`: Generate a password reset token
- `verifyAccessToken(token)`: Verify an access token
- `verifyRefreshToken(token)`: Verify a refresh token
- `verifyResetToken(token)`: Verify a password reset token

### Token Model

Location: `backend/models/Token.js`

#### Schema
```javascript
{
  user_id: ObjectId (ref: 'User', required),
  token: String (required, unique),
  type: String (enum: ['access', 'refresh', 'reset'], required),
  expires_at: Date (required),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

#### Methods
- `isExpired()`: Check if the token has expired

#### Indexes
- `user_id`: For querying tokens by user
- `token`: For token lookup (unique)
- `expires_at`: For token expiration queries

### Auth Routes

Location: `backend/routes/authRoutes.js`

#### Endpoints
- `POST /register`: Register a new user
- `POST /login`: Authenticate a user
- `POST /logout`: Log out the current user
- `POST /refresh`: Refresh access and refresh tokens
- `GET /me`: Get current user information
- `PUT /profile`: Update user profile
- `PUT /password`: Change user password
- `POST /forgot-password`: Request password reset email
- `POST /reset-password`: Reset password with verification code
- `POST /send-verification-code`: Send verification code
- `POST /email-login`: Authenticate with email and verification code

#### Key Implementation Details

1. **Token Refresh with Atomic Operations**
   - Uses `findOneAndUpdate` for atomic token replacement
   - Prevents race conditions during concurrent refresh requests
   - Returns clear error messages when token conflicts occur

2. **Account Lockout**
   - Locks account after 5 failed login attempts
   - Lock duration: 5 minutes
   - Resets on successful login

3. **Token Management**
   - Deletes all existing refresh tokens on new login
   - Only refresh tokens are stored in the database
   - Access tokens are stateless (not stored)

## Security Considerations

### Token Security
1. **Access Token**
   - Short expiration time (15 minutes)
   - Stateless (not stored in database)
   - Verified by signature only

2. **Refresh Token**
   - Longer expiration time (7-30 days)
   - Stored in database for revocation
   - Rotated on each refresh for security

3. **Token Storage**
   - Tokens stored in localStorage (client-side)
   - Note: In production, consider using httpOnly cookies for enhanced security

### Password Security
1. **Password Hashing**
   - Uses bcrypt for password hashing
   - Never stores plain text passwords

2. **Password Requirements**
   - Minimum 8 characters
   - Enforced on registration and password change

3. **Password Reset**
   - Uses time-limited verification codes
   - Invalidates all refresh tokens after password change

### Account Security
1. **Failed Login Attempts**
   - Tracks failed login attempts
   - Locks account after 5 failed attempts
   - Lock duration: 5 minutes

2. **Session Management**
   - Supports "Remember Me" functionality
   - Logout invalidates refresh token
   - Password change invalidates all refresh tokens

### API Security
1. **Rate Limiting**
   - Limits registration attempts from same IP
   - Prevents brute force attacks

2. **Input Validation**
   - Validates all user inputs
   - Sanitizes data to prevent injection attacks

3. **Error Handling**
   - Returns appropriate HTTP status codes
   - Provides clear error messages
   - Logs errors for debugging

## Error Handling

### Common Error Codes
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials or expired token
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Token Refresh Errors
- `11000 Duplicate Key Error`: Token refresh conflict (handled gracefully)
- Token already used or expired: Returns 401 with clear message

### Client-Side Error Handling
- Automatic token refresh on 401 errors
- Automatic logout on refresh failure
- User-friendly error messages

## Known Issues and Solutions

### Issue: Duplicate Key Error on Token Refresh
**Problem**: When using refresh token to refresh access token for the second time, backend reported "MongoServerError: E11000 duplicate key error" and forced user to logout.

**Root Cause**: Race conditions when multiple requests simultaneously triggered token refresh:
1. Multiple requests received 401 errors at the same time
2. Each request independently called the refresh endpoint
3. The first request deleted the old refresh token and created a new one
4. Subsequent requests tried to use the already-deleted old token
5. This led to duplicate key errors in the database due to the unique constraint on the token field

**Solution**: Fixed the bug while maintaining the existing token refresh logic (generating new refresh token on each refresh):

1. **Frontend (axios.js)**:
   - Added a refresh lock mechanism (`isRefreshing` flag) to prevent multiple concurrent refresh requests
   - Implemented a request queue (`refreshSubscribers`) to hold requests that arrive while a refresh is in progress
   - When refresh completes, all queued requests are automatically retried with the new tokens
   - This ensures only one refresh request is processed at a time, eliminating race conditions

2. **Backend (authRoutes.js)**:
   - Replaced the delete-then-create pattern with atomic `findOneAndUpdate` operation
   - This ensures the token update is atomic and thread-safe
   - Added specific error handling for duplicate key errors (error code 11000)
   - Returns a clear error message when token refresh conflicts occur

**Benefits**:
- Eliminates race conditions during token refresh
- No more duplicate key errors in database
- Maintains the security benefits of rotating refresh tokens
- Better error handling and user experience
- Atomic database operations ensure data consistency

## Future Enhancements

### Security Improvements
1. Implement httpOnly cookies for token storage
2. Add CSRF protection
3. Implement IP-based rate limiting
4. Add two-factor authentication (2FA)
5. Implement device fingerprinting for enhanced security

### Feature Enhancements
1. Social login (Google, Facebook, etc.)
2. OAuth 2.0 support
3. Session management UI (view and revoke active sessions)
4. Login history and security alerts
5. Biometric authentication support

### Performance Improvements
1. Implement token caching
2. Add Redis for session management
3. Optimize database queries with proper indexing
4. Implement request batching

## Conclusion

This authentication system provides a secure and efficient solution for user authentication in web applications. It combines the benefits of JWT and session-based authentication while addressing common security concerns such as token theft, brute force attacks, and session management.

The system is designed to be:
- **Secure**: Implements industry best practices for authentication
- **Scalable**: Stateless access tokens allow for horizontal scaling
- **User-Friendly**: Automatic token refresh provides seamless user experience
- **Maintainable**: Clear separation of concerns and well-documented code
- **Extensible**: Easy to add new authentication methods and security features

For questions or issues, please refer to the project's bug tracking system or contact the development team.
