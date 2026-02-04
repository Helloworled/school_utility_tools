/**
 * 测试通知系统
 * 此脚本用于在数据库中创建测试通知
 * 使用方法: node backend/scripts/testNotifications.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接到MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_utility_tools')
  .then(() => console.log('已连接到MongoDB'))
  .catch(err => {
    console.error('连接MongoDB失败:', err);
    process.exit(1);
  });

// 定义通知模型
const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  related_type: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

// 创建测试通知
async function createTestNotifications(userId) {
  try {
    // 如果没有提供用户ID，使用一个默认的ObjectId
    const testUserId = userId || new mongoose.Types.ObjectId();

    // 创建不同类型的测试通知
    const testNotifications = [
      {
        user_id: testUserId,
        title: '系统通知',
        message: '欢迎使用School Utility Tools通知系统！这是一条测试通知。',
        type: 'info',
        read: false
      },
      {
        user_id: testUserId,
        title: '待办事项提醒',
        message: '您有一个待办事项即将到期，请及时处理。',
        type: 'warning',
        read: false
      },
      {
        user_id: testUserId,
        title: '任务完成',
        message: '恭喜！您已成功完成了一个待办事项。',
        type: 'success',
        read: true
      },
      {
        user_id: testUserId,
        title: '错误提示',
        message: '系统检测到一个错误，请联系管理员。',
        type: 'error',
        read: false
      },
      {
        user_id: testUserId,
        title: '日历提醒',
        message: '您有一个即将到来的日历事件。',
        type: 'info',
        read: false,
        related_type: 'calendar'
      },
      {
        user_id: testUserId,
        title: '新消息',
        message: '您收到了一条新消息。',
        type: 'info',
        read: true,
        related_type: 'message'
      }
    ];

    // 清除现有测试通知
    await Notification.deleteMany({ user_id: testUserId });
    console.log('已清除现有测试通知');

    // 插入测试通知
    const result = await Notification.insertMany(testNotifications);
    console.log(`成功创建 ${result.length} 条测试通知`);

    // 显示创建的通知
    console.log('创建的通知:');
    result.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} (${notification.type}) - 已读: ${notification.read}`);
    });

    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('测试完成，数据库连接已关闭');
  } catch (error) {
    console.error('创建测试通知时出错:', error);
    process.exit(1);
  }
}

// 获取用户ID参数
const userId = process.argv[2];

// 执行测试
createTestNotifications(userId);
