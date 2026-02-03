## Token Strategy (方案 B: Access Token + Refresh Token)

### Overview

本系统采用混合认证方案，结合了 JWT 和 Session-based 认证的优点：

1. **Access Token (JWT)**：

   - 短期有效（15分钟）
   - 不存储到数据库
   - 用于 API 请求认证
   - 直接验证签名，无需查询数据库
2. **Refresh Token**：

   - 长期有效（7-30天）
   - 存储到数据库
   - 用于刷新 access token
   - 可以主动撤销

### Token Flow

1. **用户登录/注册**：

   - 服务器验证用户凭证
   - 生成 access token (JWT) 和 refresh token
   - 只将 refresh token 保存到数据库
   - 将两个 token 都返回给客户端
2. **API 请求**：

   - 客户端在请求头中携带 access token
   - 服务器验证 access token 的签名和过期时间
   - 不需要查询数据库
3. **Token 刷新**：

   - Access token 过期后，客户端使用 refresh token 请求刷新
   - 服务器验证 refresh token（需要查询数据库）
   - 生成新的 access token 和 refresh token
   - 删除旧的 refresh token，保存新的 refresh token
4. **用户登出**：

   - 客户端请求登出
   - 服务器删除数据库中的 refresh token
   - Access token 自然过期
5. **修改密码**：

   - 用户修改密码后
   - 服务器删除该用户的所有 refresh token
   - 强制用户重新登录

### Security Benefits

1. **性能优化**：Access token 验证不需要查询数据库
2. **主动撤销**：可以通过删除 refresh token 实现立即登出
3. **安全控制**：可以限制并发登录数、强制登出等
4. **扩展性强**：Access token 验证不依赖数据库

---

***THE FOLLOWING TEXT IS NOT USED, PLEASE STOP READING HERE.***

---

1. ~~authentication:~~
   1. ~~features:~~

      1. ~~user registration with user_name, email and password~~
      2. ~~user login with user_name and password~~
      3. ~~password reset via email~~
      4. ~~JWT-based authentication~~
      5. ~~protected routes for authenticated users~~
   2. ~~data:~~

      1. ~~User:~~

         1. ~~_id: ObjectId, auto-generated~~
         2. ~~user_name: string, required, unique, max length: 50~~
         3. ~~email: string, required, unique, max length: 255~~
         4. ~~password: string, required, hashed with bcrypt~~
         5. ~~avatar: string, optional, URL to user avatar image~~
         6. ~~created_at: datetime, auto fill on create~~
         7. ~~updated_at: datetime, auto update on change~~
      2. ~~VerificationCode:~~

         1. ~~_id: ObjectId, auto-generated~~
         2. ~~email: string, required~~
         3. ~~code: string, required, 6-digit numeric code~~
         4. ~~type: string, enum: ["login", "password_reset"], required~~
         5. ~~expires_at: datetime, required (e.g., 15 minutes)~~
         6. ~~created_at: datetime, auto fill on create~~
   3. ~~pages:~~

      1. ~~Login: form with user_name and password fields~~
         1. ~~user_name input with validation~~
         2. ~~password input with show/hide toggle~~
         3. ~~remember me checkbox~~
         4. ~~login button~~
         5. ~~forgot password link~~
         6. ~~registration link~~
      2. ~~Register: form with user_name, email, password fields~~
         1. ~~user_name input with validation~~
         2. ~~email input with validation~~
         3. ~~password input with strength indicator~~
         4. ~~confirm password input~~
         5. ~~register button~~
         6. ~~login link~~
      3. ~~ForgotPassword: form with email field~~
         1. ~~email input with validation~~
         2. ~~send verification code button~~
         3. ~~back to login link~~
         4. ~~after sending code, redirect to EmailLogin page~~
      4. ~~EmailLogin: form with email~~
         1. ~~email input (pre-filled from ForgotPassword)~~
         2. ~~verification code input (6 digits)~~
         3. ~~login button~~
      5. ~~ResetPassword: form with email, verification code, and new password fields (this page is usually not used)~~
         1. ~~email input (pre-filled from ForgotPassword)~~
         2. ~~verification code input (6 digits)~~
         3. ~~new password input with strength indicator~~
         4. ~~confirm new password input~~
         5. ~~reset password button~~
         6. ~~resend verification code link~~
      6. ~~Profile: display and edit user information~~
         1. ~~display user information~~
         2. ~~edit user_name, avatar~~
         3. ~~change password form~~
         4. ~~logout button~~
   4. ~~technical implementation:~~

      1. ~~Backend API:~~

         1. ~~create RESTful API endpoints:~~
            1. ~~POST /api/auth/register - register a new user~~
            2. ~~POST /api/auth/login - login with user_name and password~~
            3. ~~POST /api/auth/email-login - login with email and verification code~~
            4. ~~POST /api/auth/logout - logout user (client-side token removal)~~
            5. ~~POST /api/auth/send-verification-code - send verification code for login or password reset~~
            6. ~~POST /api/auth/reset-password - reset password with verification code~~
            7. ~~GET /api/auth/me - get current user information~~
            8. ~~PUT /api/auth/profile - update user profile~~
            9. ~~PUT /api/auth/password - change user password~~
      2. ~~request/response formats:~~

         1. ~~POST /api/auth/register:~~
            1. ~~request body: { user_name, email, password }~~
            2. ~~response: { success: true, data: { user: {}, accessToken: "" } }~~
         2. ~~POST /api/auth/login:~~
            1. ~~request body: { user_name, password, rememberMe }~~
            2. ~~response: { success: true, data: { user: {}, accessToken: "" } }~~
         3. ~~POST /api/auth/email-login:~~
            1. ~~request body: { email, code, rememberMe }~~
            2. ~~response: { success: true, data: { user: {}, accessToken: "" } }~~
         4. ~~POST /api/auth/logout:~~
            1. ~~request body: {}~~
            2. ~~response: { success: true, message: "Logged out successfully" }~~
         5. ~~POST /api/auth/send-verification-code:~~
            1. ~~request body: { email, type } (type can be "login" or "password_reset")~~
            2. ~~response: { success: true, message: "Verification code sent to email" }~~
         6. ~~POST /api/auth/reset-password:~~
            1. ~~request body: { email, code, password }~~
            2. ~~response: { success: true, message: "Password reset successfully" }~~
         7. ~~GET /api/auth/me:~~
            1. ~~response: { success: true, data: { user: {} } }~~
         8. ~~PUT /api/auth/profile:~~
            1. ~~request body: { user_name, avatar }~~
            2. ~~response: { success: true, data: { user: {} } }~~
         9. ~~PUT /api/auth/password:~~
            1. ~~request body: { currentPassword, newPassword }~~
            2. ~~response: { success: true, message: "Password changed successfully" }~~
      3. ~~authentication:~~

         1. ~~use JWT for authentication~~
         2. ~~generate access tokens with short expiration (e.g., 15 minutes)~~
         3. ~~generate refresh tokens with longer expiration (e.g., 7 days)~~
         4. ~~store refresh tokens in database for revocation~~
         5. ~~verify JWT on all protected routes~~
         6. ~~use bcrypt for password hashing~~
      4. ~~error handling:~~

         1. ~~return appropriate HTTP status codes~~
         2. ~~include error messages in response~~
         3. ~~log errors for debugging~~
      5. ~~Database:~~

         1. ~~create Mongoose models:~~
            1. ~~User model with schema and validation~~
            2. ~~Token model with schema and validation~~
         2. ~~create methods for CRUD operations:~~
            1. ~~findUserByUserName(user_name)~~
            2. ~~findUserByEmail(email)~~
            3. ~~findUserById(id)~~
            4. ~~createUser(data)~~
            5. ~~updateUser(id, data)~~
            6. ~~changePassword(id, newPassword)~~
            7. ~~createToken(userId, type, expiresIn)~~
            8. ~~findToken(token)~~
            9. ~~deleteToken(token)~~
            10. ~~deleteAllTokens(userId)~~
         3. ~~create indexes for frequently queried fields:~~
            1. ~~user_name field in User model~~
            2. ~~email field in User model~~
            3. ~~user_id field in Token model~~
      6. ~~Frontend components:~~

         1. ~~create Vue components for each page:~~

            1. ~~Login.vue~~
            2. ~~Register.vue~~
            3. ~~ForgotPassword.vue~~
            4. ~~ResetPassword.vue~~
            5. ~~Profile.vue~~
         2. ~~use Vuetify components for UI:~~

            1. ~~v-card for form containers~~
            2. ~~v-form for forms with validation~~
            3. ~~v-text-field for text inputs~~
            4. ~~v-btn for actions~~
            5. ~~v-avatar for user avatar~~
         3. ~~implement form validation:~~

            1. ~~use Vuelidate or VeeValidate~~
            2. ~~define validation rules for each field~~
            3. ~~display error messages for invalid fields~~
         4. ~~implement state management:~~

            1. ~~create Pinia authStore with:~~
               1. ~~user state~~
               2. ~~accessToken state~~
               3. ~~isAuthenticated getter~~
               4. ~~login action~~
               5. ~~logout action~~
               6. ~~updateProfile action~~
               7. ~~changePassword action~~
         5. ~~implement API integration:~~

            1. ~~create Axios instance with base URL and interceptors~~
            2. ~~create API functions for each endpoint~~
            3. ~~handle errors and loading states~~
            4. ~~add JWT to Authorization header for all requests~~
            5. ~~implement token refresh logic~~
         6. ~~implement route guards:~~

            1. ~~create beforeEach navigation guard~~
            2. ~~check authentication status~~
            3. ~~redirect to login if not authenticated~~
            4. ~~redirect to dashboard if already authenticated~~
      7. ~~Security considerations:~~

         1. ~~store tokens in httpOnly cookies or secure storage~~
         2. ~~implement CSRF protection~~
         3. ~~use HTTPS in production~~
         4. ~~implement rate limiting for authentication endpoints~~
         5. ~~sanitize user inputs to prevent XSS attacks~~
         6. ~~implement password strength requirements~~
         7. ~~use environment variables for sensitive data~~
         8. ~~validate user_name uniqueness on registration and profile update~~
         9. ~~implement JWT expiration handling~~
   5. ~~technical implementation:~~

      1. ~~Backend API:~~
         1. ~~create RESTful API endpoints:~~
            1. ~~POST /api/auth/register - register a new user~~
            2. ~~POST /api/auth/login - login with user_name and password~~
            3. ~~POST /api/auth/logout - logout user (client-side token removal)~~
            4. ~~POST /api/auth/send-verification-code - send verification code for password reset~~
            5. ~~POST /api/auth/reset-password - reset password with verification code~~
            6. ~~GET /api/auth/me - get current user information~~
            7. ~~PUT /api/auth/profile - update user profile~~
            8. ~~PUT /api/auth/password - change user password~~
         2. ~~request/response formats:~~
            1. ~~POST /api/auth/register:~~
               1. ~~request body: { user_name, email, password }~~
               2. ~~response: { success: true, data: { user: {}, accessToken: "" } }~~
            2. ~~POST /api/auth/login:~~
               1. ~~request body: { user_name, password, rememberMe }~~
               2. ~~response: { success: true, data: { user: {}, accessToken: "" } }~~
            3. ~~POST /api/auth/logout:~~
               1. ~~request body: {}~~
               2. ~~response: { success: true, message: "Logged out successfully" }~~
            4. ~~POST /api/auth/send-verification-code:~~
               1. ~~request body: { email }~~
               2. ~~response: { success: true, message: "Verification code sent to email" }~~
            5. ~~POST /api/auth/reset-password:~~
               1. ~~request body: { email, code, password }~~
               2. ~~response: { success: true, message: "Password reset successfully" }~~
            6. ~~GET /api/auth/me:~~
               1. ~~response: { success: true, data: { user: {} } }~~
            7. ~~PUT /api/auth/profile:~~
               1. ~~request body: { user_name, avatar }~~
               2. ~~response: { success: true, data: { user: {} } }~~
            8. ~~PUT /api/auth/password:~~
               1. ~~request body: { currentPassword, newPassword }~~
               2. ~~response: { success: true, message: "Password changed successfully" }~~
         3. ~~authentication:~~
            1. ~~use JWT for authentication~~
            2. ~~generate access tokens with short expiration (e.g., 15 minutes)~~
            3. ~~generate refresh tokens with longer expiration (e.g., 7 days)~~
            4. ~~store refresh tokens in database for revocation~~
            5. ~~verify JWT on all protected routes~~
            6. ~~use bcrypt for password hashing~~
         4. ~~error handling:~~
            1. ~~return appropriate HTTP status codes~~
            2. ~~include error messages in response~~
            3. ~~log errors for debugging~~
      2. ~~Database:~~
         1. ~~create Mongoose models:~~
            1. ~~User model with schema and validation~~
            2. ~~Token model with schema and validation~~
            3. ~~VerificationCode model with schema and validation~~
         2. ~~create methods for CRUD operations:~~
            1. ~~findUserByUserName(user_name)~~
            2. ~~findUserByEmail(email)~~
            3. ~~findUserById(id)~~
            4. ~~createUser(data)~~
            5. ~~updateUser(id, data)~~
            6. ~~changePassword(id, newPassword)~~
            7. ~~createToken(userId, type, expiresIn)~~
            8. ~~findToken(token)~~
            9. ~~deleteToken(token)~~
            10. ~~deleteAllTokens(userId)~~
            11. ~~createVerificationCode(email, type, expiresIn)~~
            12. ~~findVerificationCode(email, code)~~
            13. ~~deleteVerificationCode(id)~~
         3. ~~create indexes for frequently queried fields:~~
            1. ~~user_name field in User model~~
            2. ~~email field in User model~~
            3. ~~user_id field in Token model~~
            4. ~~email and code fields in VerificationCode model~~
      3. ~~Frontend components:~~
         1. ~~create Vue components for each page:~~
            1. ~~Login.vue~~
            2. ~~Register.vue~~
            3. ~~ForgotPassword.vue~~
            4. ~~EmailLogin.vue~~
            5. ~~ResetPassword.vue~~
            6. ~~Profile.vue~~
         2. ~~use Vuetify components for UI:~~
            1. ~~v-card for form containers~~
            2. ~~v-form for forms with validation~~
            3. ~~v-text-field for text inputs~~
            4. ~~v-btn for actions~~
            5. ~~v-avatar for user avatar~~
         3. ~~implement form validation:~~
            1. ~~use Vuelidate or VeeValidate~~
            2. ~~define validation rules for each field~~
            3. ~~display error messages for invalid fields~~
         4. ~~implement state management:~~
            1. ~~create Pinia authStore with:~~
               1. ~~user state~~
               2. ~~accessToken state~~
               3. ~~refreshToken state~~
               4. ~~isAuthenticated getter~~
               5. ~~login action~~
               6. ~~emailLogin action~~
               7. ~~logout action~~
               8. ~~refreshTokens action~~
               9. ~~updateProfile action~~
               10. ~~changePassword action~~
         5. ~~implement API integration:~~
            1. ~~create Axios instance with base URL and interceptors~~
            2. ~~create API functions for each endpoint~~
            3. ~~handle errors and loading states~~
            4. ~~add JWT to Authorization header for all requests~~
            5. ~~implement token refresh logic~~
         6. ~~implement route guards:~~
            1. ~~create beforeEach navigation guard~~
            2. ~~check authentication status~~
            3. ~~redirect to login if not authenticated~~
            4. ~~redirect to dashboard if already authenticated~~
      4. ~~Security considerations:~~
         1. ~~store tokens in httpOnly cookies or secure storage~~
         2. ~~implement CSRF protection~~
         3. ~~use HTTPS in production~~
         4. ~~implement rate limiting for authentication endpoints~~
         5. ~~sanitize user inputs to prevent XSS attacks~~
         6. ~~implement password strength requirements~~
         7. ~~use environment variables for sensitive data~~
         8. ~~validate user_name uniqueness on registration and profile update~~
         9. ~~implement JWT expiration handling~~
         10. ~~limit verification code attempts to prevent brute force attacks~~
         11. ~~expire verification codes after a short period (e.g., 15 minutes)~~
         12. ~~use secure random number generator for verification codes~~

---
