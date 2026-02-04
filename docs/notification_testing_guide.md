# 通知系统测试指南

本文档提供了测试通知系统的详细步骤，包括如何使用测试脚本创建测试通知，以及如何在前端验证通知功能是否正常工作。

## 前提条件

1. 确保后端服务器正在运行（端口5000）
2. 确保前端开发服务器正在运行
3. 确保MongoDB数据库正在运行
4. 确保您已登录到应用程序

## 方法一：使用测试脚本创建通知

### 步骤1：获取用户ID

1. 登录到应用程序
2. 打开浏览器开发者工具（F12）
3. 在控制台中输入以下代码并执行：
   ```javascript
   localStorage.getItem('user_id')
   ```
4. 复制返回的用户ID

### 步骤2：运行测试脚本

在命令行中导航到项目根目录，然后运行以下命令：

```bash
node backend/scripts/testNotifications.js <用户ID>
```

例如：
```bash
node backend/scripts/testNotifications.js 507f1f77bcf86cd799439011
```

如果您不提供用户ID，脚本将创建一个随机的ObjectId作为测试用户ID。

### 步骤3：验证通知创建

脚本将输出创建的通知列表，例如：
```
成功创建 6 条测试通知

创建的通知:
1. 系统通知 (info) - 已读: false
2. 待办事项提醒 (warning) - 已读: false
3. 任务完成 (success) - 已读: true
4. 错误提示 (error) - 已读: false
5. 日历提醒 (info) - 已读: false
6. 新消息 (info) - 已读: true
```

## 方法二：直接使用MongoDB创建通知

### 步骤1：连接到MongoDB

使用MongoDB Compass或命令行连接到您的数据库：
```bash
mongosh mongodb://127.0.0.1:27017/school_utility_tools
```

### 步骤2：切换到数据库并插入通知

在MongoDB命令行中执行以下命令：
```javascript
use school_utility_tools

db.notifications.insertOne({
  user_id: ObjectId("您的用户ID"),
  title: "测试通知",
  message: "这是一条测试通知",
  type: "info",
  read: false,
  created_at: new Date(),
  updated_at: new Date()
})
```

## 方法三：通过前端API创建通知

### 步骤1：获取认证令牌

1. 登录到应用程序
2. 打开浏览器开发者工具（F12）
3. 在控制台中输入以下代码并执行：
   ```javascript
   localStorage.getItem('accessToken')
   ```
4. 复制返回的访问令牌

### 步骤2：使用API创建通知

在浏览器控制台中执行以下代码（替换`YOUR_ACCESS_TOKEN`为您的访问令牌）：

```javascript
fetch('http://localhost:5000/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },
  body: JSON.stringify({
    title: '测试通知',
    message: '这是一条通过API创建的测试通知',
    type: 'info'
  })
})
.then(response => response.json())
.then(data => console.log('通知创建成功:', data))
.catch(error => console.error('创建通知失败:', error));
```

## 验证通知功能

### 1. 检查通知徽章

1. 刷新前端页面
2. 查看导航栏中的通知徽章是否显示未读通知数量

### 2. 检查Dashboard

1. 导航到Dashboard页面
2. 检查"Unread Notifications"卡片是否显示正确的未读通知数量
3. 检查"Recent Notifications"列表是否显示最近的通知

### 3. 检查通知列表

1. 点击导航栏中的"Notifications"按钮
2. 验证通知列表是否显示所有通知
3. 检查通知的标题、消息和类型是否正确显示
4. 验证已读/未读状态是否正确显示

### 4. 检查通知详情

1. 点击列表中的任意通知
2. 验证通知详情页面是否正确显示通知的所有信息
3. 检查通知的标题、消息、类型和创建时间是否正确显示

### 5. 测试标记已读功能

1. 在通知列表中，点击未读通知旁边的复选标记图标
2. 验证通知是否被标记为已读
3. 刷新页面，验证已读状态是否保持

### 6. 测试搜索和过滤功能

1. 在通知列表页面，尝试使用搜索框搜索通知
2. 使用"Read Status"下拉菜单过滤已读/未读通知
3. 使用"Type"下拉菜单按通知类型过滤
4. 验证搜索和过滤结果是否正确

### 7. 测试WebSocket实时通知（可选）

1. 确保后端WebSocket服务器正在运行
2. 打开两个浏览器窗口，都登录到应用程序
3. 在一个窗口中通过API创建新通知（如方法三所示）
4. 在另一个窗口中，验证是否实时收到新通知（通知徽章数量增加）

## 常见问题

### 问题1：通知徽章未显示

**解决方案**：
- 检查是否已登录到应用程序
- 检查通知是否属于当前用户
- 检查浏览器控制台是否有错误

### 问题2：通知列表为空

**解决方案**：
- 确认通知已成功插入数据库
- 检查通知的user_id是否与当前登录用户的ID匹配
- 检查浏览器控制台是否有API错误

### 问题3：无法标记通知为已读

**解决方案**：
- 检查后端服务器是否正在运行
- 检查浏览器控制台是否有API错误
- 确认通知的ID是否正确

### 问题4：WebSocket实时通知不工作

**解决方案**：
- 确保后端WebSocket服务器已初始化
- 检查后端控制台是否有WebSocket连接日志
- 检查前端控制台是否有WebSocket连接错误
- 确认socket.io-client依赖已安装

## 清理测试数据

完成测试后，您可能想要删除测试通知：

### 使用测试脚本清理

修改testNotifications.js脚本，将`createTestNotifications`函数中的以下行：
```javascript
// 清除现有测试通知
await Notification.deleteMany({ user_id: testUserId });
```

改为只执行删除操作，注释掉插入操作：
```javascript
// 清除现有测试通知
await Notification.deleteMany({ user_id: testUserId });
console.log('已清除测试通知');

// 注释掉插入操作
// const result = await Notification.insertMany(testNotifications);
// console.log(`成功创建 ${result.length} 条测试通知`);
```

然后运行脚本：
```bash
node backend/scripts/testNotifications.js <用户ID>
```

### 使用MongoDB清理

在MongoDB命令行中执行：
```javascript
use school_utility_tools
db.notifications.deleteMany({ user_id: ObjectId("您的用户ID") })
```

## 总结

通过以上方法，您可以全面测试通知系统的功能。建议按照以下顺序进行测试：

1. 使用测试脚本创建测试通知
2. 验证通知徽章和Dashboard显示
3. 检查通知列表和详情
4. 测试标记已读功能
5. 测试搜索和过滤功能
6. 可选：测试WebSocket实时通知

如果在测试过程中遇到任何问题，请检查浏览器控制台和后端服务器的日志，以获取更多错误信息。
