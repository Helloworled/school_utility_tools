# **Specific:**

# 文件存储系统重构计划

## 一、项目概述

本计划旨在重构现有的文件存储系统，将数据库驱动的文件系统结构转变为文件系统驱动的架构，提高系统的可维护性、可扩展性和性能。

## 二、核心设计原则

1. 文件系统作为真相源(Single Source of Truth)
2. 数据库仅作为索引和元数据存储
3. 实现高效的目录访问和缓存机制
4. 确保数据一致性和安全性

## 三、技术栈

- 后端：Node.js + Express + MongoDB
- 缓存：Redis（可选，后期可添加）（由于进度压力，第一版不使用，如果需要可以使用其他方案。）
- 文件系统操作：Node.js fs模块
- 前端：Vue.js + Vuetify

## 四、实施阶段

### ~~第一阶段：准备工作（预计1-2天）~~

#### ~~任务1.1：环境准备~~

- ~~ 创建新的分支 `feature/filesystem-redesign`~~
- ~~ 备份现有数据~~
- ~~ 准备开发环境~~

#### ~~任务1.2：数据迁移准备~~

- ~~ 编写数据迁移脚本~~
- ~~ 设计新的数据库模型~~
- ~~ 准备文件系统结构转换脚本~~

#### ~~任务1.3：测试环境搭建~~

- ~~ 设置测试文件系统~~
- ~~ 准备测试数据~~
- ~~ 配置测试环境~~

### 第一阶段：准备工作已完成。

### 第二阶段：核心服务实现（预计3-4天）

#### 任务2.1：文件系统服务实现

- [ ] 创建 `services/fileSystemService.js`
- [ ] 实现基础文件系统操作（创建、读取、更新、删除）
- [ ] 实现目录遍历功能
- [ ] 实现路径构建和验证功能

#### 任务2.2：缓存机制实现

- [ ] 实现内存缓存（Map）
- [ ] 实现缓存失效策略
- [ ] 实现缓存清理机制
- [ ] 添加缓存统计功能

#### 任务2.3：数据库模型更新

- 更新File模型
- 更新Folder模型
- 创建新的FileIndex模型
- 添加必要的索引

#### 任务2.4：数据迁移

- [ ] 实现从旧结构到新结构的迁移
- [ ] 验证数据完整性
- [ ] 测试迁移脚本
- [ ] 执行数据迁移

### 第三阶段：API层重构（预计3-4天）

#### 任务3.1：文件操作API

- [ ] 重构文件上传API
- [ ] 重构文件下载API
- [ ] 重构文件删除API
- [ ] 重构文件移动API
- [ ] 重构文件重命名API

#### 任务3.2：文件夹操作API

- [ ] 重构文件夹创建API
- [ ] 重构文件夹删除API
- [ ] 重构文件夹移动API
- [ ] 重构文件夹重命名API
- [ ] 实现目录遍历API

#### 任务3.3：目录浏览API

- [ ] 实现获取目录内容API
- [ ] 实现路径解析API
- [ ] 实现搜索功能API
- [ ] 实现批量操作API

### 第四阶段：前端适配（预计2-3天）

#### 任务4.1：状态管理更新

- [ ] 更新files store
- [ ] 适配新的API响应格式
- [ ] 更新错误处理逻辑

#### 任务4.2：UI组件更新

- [ ] 更新文件列表组件
- [ ] 更新文件夹导航组件
- [ ] 更新文件操作组件
- [ ] 更新上传组件

#### 任务4.3：功能适配

- [ ] 适配新的文件操作流程
- [ ] 适配新的文件夹操作流程
- [ ] 更新拖放功能
- [ ] 更新搜索功能

### 第五阶段：测试与优化（预计2-3天）

#### 任务5.1：功能测试

- [ ] 单元测试（文件系统服务）
- [ ] 单元测试（API层）
- [ ] 集成测试
- [ ] 端到端测试

#### 任务5.2：性能测试

- [ ] 目录访问性能测试
- [ ] 缓存效果测试
- [ ] 并发操作测试
- [ ] 大文件处理测试

#### 任务5.3：优化调整

- [ ] 根据测试结果优化
- [ ] 调整缓存策略
- [ ] 优化数据库查询
- [ ] 优化文件系统操作

### 第六阶段：部署与监控（预计1-2天）

#### 任务6.1：部署准备

- [ ] 准备部署脚本
- [ ] 配置生产环境
- [ ] 设置监控指标

#### 任务6.2：灰度发布

- [ ] 小范围测试
- [ ] 监控系统表现
- [ ] 收集反馈
- [ ] 逐步扩大范围

#### 任务6.3：全面上线

- [ ] 切换到新系统
- [ ] 监控系统运行
- [ ] 处理问题
- [ ] 文档更新

## 五、风险评估与应对

### 风险1：数据迁移失败

- 影响：数据丢失
- 概率：中
- 应对：完整备份、分步迁移、回滚方案

### 风险2：性能不达预期

- 影响：用户体验下降
- 概率：中
- 应对：性能测试、缓存优化、降级方案

### 预期3：并发问题

- 影响：数据不一致
- 概率：高
- 应对：实现锁机制、事务处理

### 风险4：缓存一致性问题

- 影响：数据展示错误
- 概率：中
- 应对：合理的缓存过期策略、主动失效

## 六、成功标准

1. 所有现有功能在新架构下正常工作
2. 等待目录访问时间小于100ms
3. 文件上传速度不低于现有系统
4. 数据一致性得到保证
5. 系统可扩展到更多用户

## 七、后续优化方向

1. 引入Redis作为分布式缓存
2. 实现文件版本控制
3. 添加文件分享功能
4. 实现文件预览优化
5. 添加文件协作功能

## 八、时间表

| 阶段      | 任务         | 预计时间 | 负责人 |
| --------- | ------------ | -------- | ------ |
| 第一阶段  | 准备工作     | 1-2天    | 待定   |
| 第二阶段  | 核心服务实现 | 3-4天    | 待定   |
| 第三阶段  | API层重构    | 3-4天    | 待定   |
| debug阶段 | 前端适配     | 2-3天    | 待定   |
| 第五阶段  | 测试与优化   | 2-3天    | 待定   |
| 第六阶段  | 部署与监控   | 1-2天    | 待定   |

总计：12-18天

## 九、沟通计划

1. 每日站会：同步进度、讨论问题
2. 周报：总结本周进展、规划下周任务
3. 里程碑评审：每个阶段结束后的评审会议
4. 问题升级：重大问题及时沟通

## 十、文档计划

1. 技术设计文档
2. API文档
3. 数据迁移文档
4. 运维手册
5. 用户指南

这个计划提供了从现有系统到新系统的完整路径，包括所有必要的步骤、时间估算和风险控制。实施过程中可以根据实际情况进行调整。`</think>`# 文件存储系统重构具体计划

## 一、项目概述

本计划旨在重构现有的文件存储系统，将数据库驱动的文件系统结构转变为文件系统驱动的架构，提高系统的可维护性、可扩展性和性能。

## 二、核心设计原则

1. **文件系统作为真相源(Single Source of Truth)**

   - 文件和文件夹的实际结构由文件系统维护
   - 数据库仅作为索引和元数据存储
   - 不在数据库中维护文件系统结构
2. **分层存储结构**

   ```
   uploads/
   ├── private/
   │   └── [userId]/
   │       ├── [folderId]/
   │       │   └── [subFolderId]/
   │       │       └── [fileId]
   │       └── [fileId]
   ├── public/
   │   └── [userId]/
   │       └── [folderId]/
   │           └── [fileId]
   └── shared/
       └── [sharedFolderId]/
           └── [fileId]
   ```
3. **数据库角色转变**

   - 存储文件元数据（名称、大小、类型等）
   - 提供快速查询和索引
   - 不维护文件系统结构
4. **高效缓存机制**

   - 使用内存缓存（Map）加速目录访问
   - 实现合理的缓存失效策略
   - ~~后期可升级到Redis~~

## 三、技术栈

- 后端：Node.js + Express + MongoDB
- 缓存：内存Map~~（初期）→ Redis（后期）~~
- 文件系统操作：Node.js fs模块
- 前端：Vue.js + Vuetify

## 四、实施阶段

### 第一阶段：~~准备工作（预计1-2天）~~已完成

#### ~~任务1.1：环境准备~~

- ~~ 创建新的分支 `feature/filesystem-redesign`~~
- ~~ 备份现有数据~~
- ~~ 准备开发环境（Redis等）~~

#### ~~任务1.2：数据迁移准备~~

- ~~ 编写数据迁移脚本~~
- ~~ 设计新的数据库模型~~
- ~~ 准备文件系统结构转换脚本~~

#### ~~任务1.3：测试环境搭建~~

- ~~ 设置测试文件系统~~
- ~~ 准备测试数据~~
- ~~ 配置测试环境~~

### 第二阶段：核心服务实现

#### 任务2.1：文件系统服务实现

- [ ] 创建 `services/fileSystemService.js`
- [ ] 实现基础文件系统操作（创建、读取、更新、删除）
- [ ] 实现目录遍历功能
- [ ] 实现路径构建和验证功能

#### 任务2.2：缓存机制实现

- [ ] 实现内存缓存（Map）
- [ ] 实现缓存失效策略
- [ ] 实现缓存清理机制
- [ ] 添加缓存统计功能

#### 任务2.3：数据库模型更新

- [ ] 更新File模型
- [ ] 更新Folder模型
- [ ] 创建新的FileIndex模型
- [ ] 添加必要的索引

#### 任务2.4：数据迁移

- [ ] 实现从旧结构到新结构的迁移
- [ ] 验证数据完整性
- [ ] 测试迁移脚本
- [ ] 执行数据迁移

### 第三阶段：API层重构

#### 任务3.1：文件操作API

- [ ] 重构文件上传API
- [ ] 重构文件下载API
- [ ] 重构文件删除API
- [ ] 重构文件移动API
- [ ] 重构文件重命名API

#### 任务3.2：文件夹操作API

- [ ] 重构文件夹创建API
- [ ] 重构文件夹删除API
- [ ] 重构文件夹移动API
- [ ] 重构文件夹重命名API
- [ ] 实现目录遍历API

#### 任务3.3：目录浏览API

- [ ] 实现获取目录内容API
- [ ] 实现路径解析API
- [ ] 实现搜索功能API
- [ ] 实现批量操作API

### 第四阶段：前端适配

#### 任务4.1：状态管理更新

- [ ] 更新files store
- [ ] 适配新的API响应格式
- [ ] 更新错误处理逻辑

#### 任务4.2：UI组件更新

- [ ] 更新文件列表组件
- [ ] 更新文件夹导航组件
- [ ] 更新文件操作组件
- [ ] 更新上传组件

#### 任务4.3：功能适配

- [ ] 适配新的文件操作流程
- [ ] 适配新的文件夹操作流程
- [ ] 更新拖放功能
- [ ] 更新搜索功能

### ~~第五阶段：测试与优化（预计2-3天）~~

#### ~~任务5.1：功能测试~~

- ~~ 单元测试（文件系统服务）~~
- ~~ 单元测试（API层）~~
- ~~ 集成测试~~
- ~~ 端到端测试~~

#### ~~任务5.2：性能测试~~

- ~~ 目录访问性能测试~~
- ~~ 缓存效果测试~~
- ~~ 并发操作测试~~
- ~~ 大文件处理测试~~

#### ~~任务5.3：优化调整~~

- ~~ 根据测试结果优化~~
- ~~ 调整缓存策略~~
- ~~ 优化数据库查询~~
- ~~ 优化文件系统操作~~

### ~~第六阶段：部署与监控（预计1-2天）~~

#### ~~任务6.1：部署准备~~

- ~~ 准备部署脚本~~
- ~~ 配置生产环境~~
- ~~ 设置监控指标~~

#### ~~任务6.2：灰度发布~~

- ~~ 小范围测试~~
- ~~ 监控系统表现~~
- ~~ 收集反馈~~
- ~~ 逐步扩大范围~~

#### ~~任务6.3：全面上线~~

- ~~ 切换到新系统~~
- ~~ 监控系统运行~~
- ~~ 处理问题~~
- ~~ 文档更新~~

## ~~五、风险评估与应对~~

### ~~风险1：数据迁移失败~~

- ~~影响：数据丢失~~
- ~~概率：中~~
- ~~应对：完整备份、分步迁移、回滚方案~~

### ~~风险2：性能不达预期~~

- ~~影响：用户体验下降~~
- ~~概率：中~~
- ~~应对：性能测试、缓存优化、降级方案~~

### ~~风险3：并发问题~~

- ~~影响：数据不一致~~
- ~~概率：高~~
- ~~应对：实现锁机制、事务处理~~

### ~~风险4：缓存一致性问题~~

- ~~影响：数据展示错误~~
- ~~概率：中~~
- ~~应对：合理的缓存过期策略、主动失效~~

## ~~六、成功标准~~

1. ~~所有现有功能在新架构下正常工作~~
2. ~~目录访问时间小于100ms~~
3. ~~文件上传速度不低于现有系统~~
4. ~~数据一致性得到保证~~
5. ~~系统可扩展到更多用户~~

## ~~七、后续优化方向~~

1. ~~引入Redis作为分布式缓存~~
2. ~~实现文件版本控制~~
3. ~~添加文件分享功能~~
4. ~~实现文件预览优化~~
5. ~~添加文件协作功能~~

## ~~八、时间表~~

| ~~阶段~~     | ~~任务~~         | ~~预计时间~~ | ~~负责人~~ |
| ------------- | ----------------- | ------------- | ----------- |
| ~~第一阶段~~ | ~~准备工作~~     | ~~1-2天~~    | ~~待定~~   |
| ~~第二阶段~~ | ~~核心服务实现~~ | ~~3-4天~~    | ~~待定~~   |
| ~~第三阶段~~ | ~~API层重构~~    | ~~3-4天~~    | ~~待定~~   |
| ~~第四阶段~~ | ~~前端适配~~     | ~~2-3天~~    | ~~待定~~   |
| ~~第五阶段~~ | ~~测试与优化~~   | ~~2-3天~~    | ~~待定~~   |
| ~~第六阶段~~ | ~~部署与监控~~   | ~~1-2天~~    | ~~待定~~   |

~~总计：12-18天~~

## ~~九、沟通计划~~

1. ~~每日站会：同步进度、讨论问题~~
2. ~~周报：总结本周进展、规划下周任务~~
3. ~~里程碑评审：每个阶段结束后的评审会议~~
4. ~~问题升级：重大问题及时沟通~~

## 十、文档计划

1. 技术设计文档
2. API文档
3. 数据迁移文档
4. 运维手册
5. 用户指南

这个计划提供了从现有系统到新系统的完整路径，包括所有必要的步骤、时间估算和风险控制。实施过程中可以根据实际情况进行调整。

---


## 技术实现细节

### 1. 文件系统服务层 (FileSystemService)

#### 1.1 核心功能

**目录内容获取**

- 功能：获取指定目录下的所有文件和文件夹
- 实现方法：使用fs.readdir读取目录内容，结合fs.stat判断文件类型
- 返回数据：包含文件ID、类型（文件/文件夹）、大小、修改时间等元数据
- 缓存策略：首次读取后缓存结果，后续请求直接返回缓存数据

**目录创建**

- 功能：在指定路径创建新目录
- 实现方法：使用fs.mkdir创建目录，支持递归创建
- 权限控制：验证用户对父目录的写入权限
- 缓存处理：创建成功后清除父目录的缓存

**文件/文件夹移动**

- 功能：将文件或文件夹移动到目标位置
- 实现方法：使用fs.rename移动文件或目录
- 路径验证：确保目标路径在用户可访问范围内
- 缓存处理：清除源目录和目标目录的缓存

**文件/文件夹删除**

- 功能：删除文件或文件夹（软删除）
- 实现方法：将文件移动到deleted目录，更新数据库isDeleted标记
- 恢复机制：保留原始路径信息，支持从deleted目录恢复
- 缓存处理：清除相关目录的缓存

#### 1.2 路径管理

**路径构建**

- 功能：根据用户ID、文件类型和文件ID构建完整路径
- 实现方法：使用path.join组合路径，确保跨平台兼容性
- 路径结构：uploads/{type}/{userId}/{folderId}/{fileId}
- 安全验证：防止路径遍历攻击

**路径验证**

- 功能：验证路径是否在允许的范围内
- 实现方法：使用path.resolve解析路径，检查是否在基础目录下
- 安全检查：防止../等路径遍历攻击
- 错误处理：路径无效时抛出明确错误

### 2. 缓存机制

#### 2.1 内存缓存实现

**缓存结构**

- 使用Map存储目录内容
- 键：目录路径
- 值：包含目录内容和时间戳的对象
- 缓存时间：5分钟（可配置）

**缓存操作**

- get：从缓存中获取目录内容
- set：将目录内容存入缓存
- delete：删除指定目录的缓存
- clear：清除所有缓存或指定前缀的缓存

**缓存失效策略**

- 主动失效：文件系统操作后清除相关缓存
- 被动失效：缓存超时后自动失效
- 级联失效：父目录变化时清除子目录缓存

#### 2.2 缓存统计

- 记录缓存命中次数
- 记录缓存未命中次数
- 计算缓存命中率
- 监控缓存大小

### 3. 数据库模型设计

#### 3.1 FileIndex模型

**字段设计**

- itemId：文件或文件夹的唯一ID（UUID）
- itemType：类型（file/folder）
- userId：所有者用户ID
- parentId：父文件夹ID
- name：原始名称
- type：文件类型（private/public/shared）
- size：文件大小（字节）
- mimeType：MIME类型
- path：相对路径
- isDeleted：是否已删除
- createdAt：创建时间
- updatedAt：更新时间

**索引设计**

- 单字段索引：itemId, userId, parentId, isDeleted
- 复合索引：{userId: 1, type: 1, isDeleted: 1}
- 复合索引：{parentId: 1, isDeleted: 1}

#### 3.2 备份机制

**备份内容**

- 所有文件和文件夹的元数据
- 文件系统结构信息
- 备份时间戳

**备份存储**

- 存储位置：uploads/files/backup/
- 文件格式：JSON
- 文件命名：backup_YYYYMMDDHHMMSS.json
- 保留策略：无限保留，手动删除。

### 4. API实现

#### 4.1 文件操作API

**文件上传**

- 端点：POST /api/files/upload
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 验证文件类型和大小
  3. 生成文件ID
  4. 存储文件到文件系统
  5. 创建数据库索引
  6. 清除相关缓存
  7. 更新备份

**文件下载**

- 端点：GET /api/files/:id/download
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 从数据库获取文件元数据
  3. 构建文件路径
  4. 验证文件存在
  5. 设置响应头
  6. 发送文件流

**文件删除**

- 端点：DELETE /api/files/:id
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 获取文件元数据
  3. 移动文件到deleted目录
  4. 更新数据库isDeleted标记
  5. 清除相关缓存
  6. 更新备份

**文件移动**

- 端点：PUT /api/files/:id/move
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 验证目标文件夹权限
  3. 检查循环引用
  4. 移动文件
  5. 更新数据库parentId
  6. 清除相关缓存
  7. 更新备份

#### 4.2 文件夹操作API

**创建文件夹**

- 端点：POST /api/folders
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 验证文件夹名称
  3. 生成文件夹ID
  4. 创建目录
  5. 创建数据库索引
  6. 清除相关缓存
  7. 更新备份

**删除文件夹**

- 端点：DELETE /api/folders/:id
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 递归删除文件夹内容
  3. 移动文件夹到deleted目录
  4. 更新数据库isDeleted标记
  5. 清除相关缓存
  6. 更新备份

**移动文件夹**

- 端点：PUT /api/folders/:id/move
- 认证：JWT
- 实现：
  1. 验证用户权限
  2. 验证目标文件夹权限
  3. 检查循环引用
  4. 递归移动文件夹内容
  5. 更新数据库parentId
  6. 清除相关缓存
  7. 更新备份

#### 4.3 目录浏览API

**获取目录内容**

- 端点：GET /api/directory/:parentId?
- 认证：JWT
- 实现：
  1. 构建目录路径
  2. 从缓存获取内容
  3. 缓存未命中时从文件系统读取
  4. 从数据库获取元数据
  5. 合并数据返回

**路径解析**

- 端点：GET /api/path/:itemId
- 认证：JWT
- 实现：
  1. 从数据库获取项目信息
  2. 递归构建完整路径
  3. 返回路径数组

### 5. 前端实现

#### 5.1 状态管理

**Files Store**

- 状态：
  - currentDirectory：当前目录ID
  - directoryContents：目录内容
  - selectedItems：选中的项目
  - viewMode：视图模式（列表/网格）
- 操作：
  - navigateTo：导航到指定目录
  - navigateUp：返回上级目录
  - refreshDirectory：刷新当前目录
  - selectItem：选择/取消选择项目

#### 5.2 UI组件

**文件列表组件**

- 功能：
  - 显示目录内容
  - 支持列表和网格视图
  - 支持多选
  - 支持拖放
- 实现：
  - 使用v-data-table显示列表
  - 使用v-card显示网格
  - 实现拖放事件处理

**面包屑导航**

- 功能：
  - 显示当前路径
  - 支持快速跳转
- 实现：
  - 根据当前目录ID构建路径
  - 点击跳转到对应目录

**上传组件**

- 功能：
  - 支持拖放上传
  - 支持点击上传
  - 显示上传进度
- 实现：
  - 使用v-file-input选择文件
  - 实现拖放区域
  - 显示进度条

### 6. 安全措施

#### 6.1 路径安全

- 验证所有路径在允许的范围内
- 防止路径遍历攻击
- 使用path.normalize规范化路径

#### 6.2 权限控制

- 验证用户对文件/文件夹的访问权限
- 验证用户对目标目录的操作权限
- 检查循环引用

#### 6.3 文件类型验证

- 验证上传文件的MIME类型
- 验证文件扩展名
- 使用白名单机制

### 7. 性能优化

#### 7.1 缓存优化

- 合理设置缓存过期时间
- 实现缓存预热
- 监控缓存命中率

#### 7.2 文件系统操作优化

- 批量操作使用Promise.all
- 大文件使用流式处理
- 减少不必要的文件系统操作

#### 7.3 数据库查询优化

- 使用索引优化查询
- 避免N+1查询问题
- 使用投影减少返回数据量

---

# **General:**

Private CRUD sevice:

1. files will be upload to backend/uploads/file/ and to /private[userId] or public[userId] or shared depended on file type
2. FileView page:
   1. can see list of files, changable between private, public, shared
   2. can upload files: drag&drop, regular upload.
   3. can manage files:
      1. create folders
      2. create certain kind of files.
      3. move files
      4. "delete" files (not real delete, just make them invisible by editing db index and moving file to /file/deleted~~, also rename file to its original name before performing all of the above actions(1: rename 2:del db index 3:move file)~~)
3. FileDetail:
   1. can live preview certain sort of file (eg. PDF, docx, xlsx, pptx, txt, zip(use some kind of frontend zip library), etc.)
   2. can toggle file type (private/public/share).

Public file service:

1. a small authentication system (use sessions only):
   1. when first login, input a username.
   2. send a verification code to that private user via notification system (create notification).
   3. after login, use sessions to ensure login status.
   4. if possible, can create some mecanism to check is the user has closed the tab/page (either ping or websocket(if possible.)), if tab closed, delete session token
   5. will login to the private user's "public" folder
2. public view file page can only access /backend/upload/file/public[userid] files with type being: "public", and can only download file with "downloadable=true".

Shared file service:

same with private, except with no delete or move file (can only download and)

File system:

1. all files/created-folders will be renamed to a unique file id and moved to its designated folder (depended on its type).(file: File_[id], folder: Folder_[id])
2. only one share folder, but private folders will be named: private_[userId]. (to prevent putting all user's file in the same place5)
3. file db index:

   1. id
   2. user id: the user who uploaded the file.
   3. file id: the file id
   4. name: the original file name
   5. path: "/"for files directly in: public/private/share, this value stores excess file path (used for downloading file)
   6. type: "private/public/share"
   7. parentId: 父文件夹ID (null表示根目录)
   8. createdAt: 创建时间
   9. updatedAt: 最后修改时间
   10. isDeleted: 是否已删除 (布尔值)
4. folder db index:

   1. id: 唯一标识符 (UUID)
   2. userId: 创建该文件夹的用户ID
   3. folderId: 文件夹的唯一ID (UUID)
   4. name: 文件夹原始名称
   5. path: 文件夹路径 (如: "/documents/work") (used for downloading file.)
   6. type: "private/public/share"
   7. parentId: 父文件夹ID (null表示根目录)
   8. createdAt: 创建时间
   9. updatedAt: 最后修改时间
   10. isDeleted: 是否已删除 (布尔值)

backup:

there will be a json file in /uploads/file to keep track of all file/folder id and their names (the file system tree), this is to ensure if anything happening to the db, i can restore the file names to a more sensical state.

**Redesign:**

I want sth. like google drive or baidu drive, instead of my design now.

Chat:

目前问题：所有文件夹都是靠数据库方式储存的，但是这样无法处理大量数据，区分主次目录也有困难。请问能否实现：所有文件夹和文件都会被正常创建在文件系统中，名字都是对应的id (eg. uploads/ file/ public/ [userid]/ [fileid]/ [fileid])，数据库只是做索引用，用于加载文件名，不存储具体文件系统结构。当需要访问某一目录时，使用类似dir的命令列出所有文件（预计用户只有1-10，所以不会有性能问题），并使用类似mem buffer的东西对数据进行缓存，加速同一目录访问。请问这个系统是否现实，会遇到什么潜在问题

**Steps:**

1.重写后端逻辑
