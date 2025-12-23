# 道威管理系统 - 前端

> 基于 Vue 3 的企业管理系统前端，支持 PC 端和移动端双平台

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite 5 |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| UI组件 | Element Plus (PC) / Vant 4 (移动端) |
| HTTP | Axios |
| 工具库 | dayjs, xlsx, pinyin-pro, jszip, html2canvas |

## 项目结构

```
src/
├── pc/                         # PC端代码
│   ├── components/
│   │   ├── layout/             # Header.vue, Menu.vue
│   │   ├── common/             # PaginationBar, ConfirmDialog
│   │   └── view/
│   │       ├── main/           # Home (数据看板)
│   │       ├── management/     # 业务管理模块
│   │       └── tools/          # 工具集
│   ├── router/
│   └── App.vue
├── mp/                         # 移动端代码
│   ├── components/
│   │   ├── layout/             # mainLayout, TabBar
│   │   └── view/
│   │       ├── main/           # Home, Support
│   │       ├── management/     # 业务管理模块
│   │       └── tools/          # 工具集
│   ├── router/
│   └── App.vue
├── core/                       # 共享核心代码
│   ├── api/                    # API封装
│   │   ├── auth.js             # 认证接口
│   │   ├── customer.js         # 客户接口
│   │   ├── employee.js         # 员工接口
│   │   ├── order.js            # 订单接口
│   │   ├── sample.js           # 样品接口
│   │   ├── dashboard.js        # 看板接口
│   │   ├── log.js              # 操作日志接口
│   │   └── user.js             # 用户接口
│   ├── utils/                  # 工具函数
│   │   ├── notification.js     # SSE实时通知
│   │   ├── formDraft.js        # 表单草稿保存
│   │   ├── heartbeat.js        # 心跳检测
│   │   ├── pinyin.js           # 拼音搜索
│   │   ├── request.js          # Axios封装
│   │   ├── ResponseHandler.js  # 响应处理
│   │   ├── authUtils.js        # 认证工具
│   │   ├── common.js           # 通用工具
│   │   ├── device.js           # 设备检测
│   │   └── preferences.js      # 用户偏好
│   ├── tools/                  # 工具类库
│   │   ├── ImageCompressor.js  # 图片压缩
│   │   ├── ImageToText.js      # OCR识别
│   │   ├── CreateZIP.js        # ZIP创建
│   │   ├── ExtractZIP.js       # ZIP解压
│   │   ├── FileToPdfConverter.js # PDF转换
│   │   └── AllAI.js            # AI工具
│   └── router/
│       └── guard.js            # 路由守卫
├── config/
│   └── env.js                  # 环境配置
└── stores/
    └── platformAuth.js         # 认证状态
```

## 功能模块

### 业务管理 (PC + 移动端)

| 模块 | 功能 |
|------|------|
| **样品管理** | 型号/色号/图片/单价/客户关联、批量删除、Excel导出 |
| **订单管理** | 订单创建/编辑/状态流转、批量删除、Excel导出、实时同步 |
| **客户管理** | 客户信息/多地址/多联系人 |
| **员工管理** | 员工通讯录 |
| **用户管理** | 系统用户管理 |
| **操作日志** | 系统操作记录查询 (仅PC) |

### 工具集 (PC + 移动端)

| 工具 | 功能 |
|------|------|
| **图片压缩** | 批量图片压缩、质量调节、格式转换 |
| **图片识别** | OCR文字识别（百度AI） |
| **创建ZIP** | 多文件打包压缩下载 |
| **解压ZIP** | ZIP文件在线解压 |
| **AI工具** | 集成多个AI对话入口 |

### 数据看板

- 总待收款金额
- 近30天订单数量
- 客户/样品总数
- 订单状态分布图表
- 生产进度跟踪

## 特色功能

### SSE实时数据同步
多用户同时操作时，数据变更自动推送：
1. 用户A修改订单 → 后端广播 `order_sync`
2. 用户B页面自动更新数据 + 弹窗提示
3. 无需刷新页面

### 批量操作
- 批量选择删除（翻页后选中状态保持）
- Excel导出（选中项或全部）

### 表单草稿
- 新增表单自动保存到 localStorage
- 24小时过期
- 下次打开自动恢复

### 拼音搜索
- 支持拼音首字母模糊搜索
- 如输入"zs"可匹配"张三"

### 图片处理
- 上传前自动压缩
- 支持缩略图生成
- 拍照/相册选择（移动端）

## 快速开始

### 环境要求
- Node.js 18+
- npm 8+

### 安装运行
```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量模板
cp .env.example .env.development

# 3. 编辑 .env.development，填写后端地址等配置

# 4. 开发模式运行
npm run dev      # 端口662

# 5. 构建生产版本
npm run build
```

### 环境变量说明
```env
VITE_BACKEND_HOST=localhost    # 后端服务器地址
VITE_BACKEND_PORT=661          # 后端服务器端口
VITE_API_BASE_PATH=/api        # API基础路径
```

> ⚠️ **注意**: `.env.development` 和 `.env.production` 包含敏感信息，已加入 `.gitignore`，不会被提交到git

## 多端入口

| 入口 | URL | 说明 |
|------|-----|------|
| PC端 | /pc.html | Element Plus UI |
| 移动端 | /mp.html | Vant UI |
| 主入口 | /index.html | 自动检测设备跳转 |

## 联系方式

- **维护者**: 慕容雪歌
- **邮箱**: 1813197353@qq.com 
