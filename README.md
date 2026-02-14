# OpenClaw Session Visualizer

一个用于可视化和分析 OpenClaw session 的现代化 Web 应用。

## ✨ 功能特性

- 🚀 **自动加载** - 启动时自动从本地 OpenClaw session 目录加载最近的 sessions
- 📊 **Session Timeline** - 时间线展示用户消息、thinking、工具调用和结果
- 🔍 **搜索过滤** - 快速搜索时间线中的内容
- 📈 **统计分析** - Token 使用、工具调用统计、饼图可视化
- 🔬 **JSON 查看器** - 每条消息都可以查看原始 JSON
- 🎨 **美观的 UI** - 现代化的三栏布局，颜色编码的消息类型

## 🚀 快速开始

### 方法一：自动加载（推荐）

1. **启动 API 服务器** （新终端窗口）
```bash
cd /Users/cc/openclawd-session-viz
npm run api
```

2. **启动前端** （另一个终端窗口）
```bash
npm run dev
```

3. **访问应用**：http://localhost:5173/
   - 应用会自动从 `~/.openclaw/agents/main/sessions/` 加载最近的 10 个 sessions
   - 页面顶部会显示当前的 session 目录路径
   - 点击 "Reload" 按钮刷新 session 列表

### 方法二：手动上传

1. 启动前端（只需要前端）
```bash
npm run dev
```

2. 点击右上角的 "Upload" 按钮
3. 选择一个或多个 `.jsonl` 文件

### 3. 探索 Session

- **左侧边栏**：浏览所有加载的 sessions
- **中间区域**：查看时间线，点击查看详情
- **右侧边栏**：查看统计信息和工具使用分析

## 📖 使用说明

### 查看原始 JSON

每个消息卡片底部都有 "Raw JSON" 按钮，点击展开即可查看原始 JSON 数据。

### 搜索功能

使用顶部搜索框可以过滤时间线中的消息，支持搜索：
- 消息内容
- 工具名称
- 消息类型

### 消息类型

不同类型的消息使用不同颜色标识：
- 🔵 User - 用户消息
- 🟣 Thinking - Agent 思考过程
- 🟠 Tool Call - 工具调用
- 🟢 Tool Result - 工具结果
- ⚫ Assistant - Agent 回复

## 🛠 技术栈

- **React 18** + **TypeScript**
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Recharts** - 图表库
- **Lucide React** - 图标库
- **date-fns** - 日期处理

## 📂 项目结构

```
src/
├── components/
│   ├── JsonViewer.tsx      # JSON 查看器
│   ├── MessageCard.tsx     # 消息卡片
│   ├── Timeline.tsx        # 时间线视图
│   ├── Inspector.tsx       # 统计面板
│   └── SessionList.tsx     # Session 列表
├── types/
│   └── session.ts          # TypeScript 类型定义
├── utils/
│   └── sessionParser.ts    # JSONL 解析器
├── App.tsx                 # 主应用
└── main.tsx                # 入口文件
```

## 🎯 下一步

可以添加的功能：
- [ ] Session 对比模式
- [ ] 导出分析报告
- [ ] 工具调用链可视化
- [ ] Token 使用趋势图
- [ ] 自动从目录加载 sessions
- [ ] 保存过滤条件

## 📝 示例

获取示例 session 文件：

```bash
# 列出最近的 sessions
ls -lht ~/.openclaw/agents/main/sessions/*.jsonl | head -5

# 复制一个 session 到当前目录
cp ~/.openclaw/agents/main/sessions/<session-id>.jsonl ./
```

然后在应用中加载该文件。

---

**Enjoy exploring your OpenClaw sessions! 🚀**
