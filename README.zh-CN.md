# OpenClaw Session Visualizer

中文 | [English](./README.md)

一个用于可视化和分析 OpenClaw AI Agent 会话的现代化 Web 应用，提供交互式时间线、思考过程和全面的统计分析。

![OpenClaw Session Visualizer](https://img.shields.io/badge/OpenClaw-Session%20Visualizer-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能特性

- 🚀 **自动加载** - 启动时自动从本地 OpenClaw session 目录加载最近的会话
- 📊 **交互式时间线** - 可视化展示用户消息、思考过程、工具调用和结果
- 🔍 **搜索过滤** - 快速搜索时间线中的内容
- 📈 **统计仪表盘** - Token 使用分析、工具调用统计、饼图可视化
- 🔬 **原始 JSON 查看器** - 查看每条消息的原始 JSON 数据
- 🎨 **现代化 UI** - 三栏布局，颜色编码的消息类型
- 🎯 **嵌套卡片** - Assistant 消息聚合展示 thinking、文本和工具调用

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- 本地安装 OpenClaw

### 安装

```bash
# 克隆仓库
git clone https://github.com/ccbot9/openclawd-session-viz.git
cd openclawd-session-viz

# 安装依赖
npm install
```

### 方法一：自动加载（推荐）

**一行命令启动（API + 前端）：**
```bash
npm start
```

或者分别运行：

**终端 1 - 启动 API 服务器：**
```bash
npm run api
```

**终端 2 - 启动前端：**
```bash
npm run dev
```

**访问应用：** http://localhost:5173/

应用会自动：
- 从 `~/.openclaw/agents/main/sessions/` 加载最近的 10 个会话
- 在页面顶部显示会话目录路径
- 提供 "Reload" 按钮刷新会话列表

### 方法二：手动上传

1. **仅启动前端：**
   ```bash
   npm run dev
   ```

2. 点击右上角的 "Upload" 按钮
3. 选择一个或多个 `.jsonl` 文件

## 📖 使用指南

### 界面布局

- **左侧边栏**：浏览所有已加载的会话，按日期分组
- **中间面板**：交互式时间线视图，支持搜索功能
- **右侧边栏**：统计信息和工具使用分析

### 查看原始 JSON

每个消息卡片底部都有 "Raw JSON" 按钮。点击展开即可查看原始 JSON 数据，还可以一键复制 JSON 内容。

### 搜索功能

使用时间线顶部的搜索框可以过滤消息，支持搜索：
- 消息内容
- 工具名称
- 消息类型

### 消息类型

不同类型的消息使用不同颜色标识：
- 🔵 **User** - 用户消息（蓝色）
- 🟣 **Thinking** - Agent 思考过程（紫色，可展开）
- 🟠 **Tool Call** - 工具调用（橙色，嵌套卡片）
- 🟢 **Tool Result** - 工具执行结果（绿色）
- ⚫ **Assistant** - Agent 回复（灰色）

### 嵌套卡片设计

Assistant 消息采用嵌套卡片结构：
```
┌─────────────────────────────────────────┐
│ 🤖 Assistant Message                   │
├─────────────────────────────────────────┤
│ 🧠 Thinking (点击展开) ▼                │
│                                         │
│ 📝 回复文本内容...                      │
│                                         │
│   ┌───────────────────────────────┐   │
│   │ 🔧 Tool Call: exec             │   │
│   │ { command: "..." }             │   │
│   └───────────────────────────────┘   │
│                                         │
│ 📄 Raw JSON ▶                           │
└─────────────────────────────────────────┘
```

## 🛠 技术栈

- **前端框架**：React 19 + TypeScript 5.9
- **构建工具**：Vite 7.3
- **样式方案**：Tailwind CSS 3.4
- **图表库**：Recharts 3.7
- **图标库**：Lucide React
- **日期处理**：date-fns 4.1
- **后端 API**：Express 5.2

## 📂 项目结构

```
src/
├── components/
│   ├── JsonViewer.tsx      # 原始 JSON 查看器（支持复制）
│   ├── MessageCard.tsx     # 消息卡片（嵌套设计）
│   ├── Timeline.tsx        # 时间线视图组件
│   ├── Inspector.tsx       # 统计面板
│   └── SessionList.tsx     # 会话列表（支持分组）
├── types/
│   └── session.ts          # TypeScript 类型定义
├── utils/
│   └── sessionParser.ts    # JSONL 解析器和聚合器
├── App.tsx                 # 主应用
└── main.tsx                # 入口文件

server.js                   # Express API 服务器（本地文件访问）
```

## 🔌 API 端点

API 服务器（端口 3001）提供：

- `GET /api/info` - 获取会话目录信息
- `GET /api/sessions` - 列出所有可用会话
- `GET /api/sessions/:id` - 获取特定会话内容

## 🎯 开发路线

未来增强功能：
- [ ] 会话对比模式
- [ ] 导出分析报告
- [ ] 工具调用链可视化
- [ ] Token 使用趋势图
- [ ] 保存过滤条件
- [ ] 多会话分析

## 📝 示例

列出最近的会话：
```bash
ls -lht ~/.openclaw/agents/main/sessions/*.jsonl | head -5
```

复制会话进行分析：
```bash
cp ~/.openclaw/agents/main/sessions/<session-id>.jsonl ./examples/
```

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

MIT License - 可自由使用于个人或商业项目。

## 🙏 致谢

本项目由 Claude Sonnet 4.5 协助构建，用于分析和理解 OpenClaw AI Agent 的执行模式。

---

**尽情探索你的 OpenClaw 会话！🚀**
