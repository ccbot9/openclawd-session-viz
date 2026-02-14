# OpenClaw Session Visualizer

[中文](./README.zh-CN.md) | English

A modern web application for visualizing and analyzing OpenClaw AI agent sessions with interactive timelines, thinking processes, and comprehensive statistics.

![OpenClaw Session Visualizer](https://img.shields.io/badge/OpenClaw-Session%20Visualizer-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🚀 **Auto-load Sessions** - Automatically loads recent sessions from local OpenClaw directory on startup
- 📊 **Interactive Timeline** - Visualize user messages, thinking processes, tool calls, and results
- 🔍 **Search & Filter** - Quickly search through timeline content
- 📈 **Statistics Dashboard** - Token usage analytics, tool call statistics, and pie charts
- 🔬 **Raw JSON Viewer** - Inspect original JSON data for every message
- 🎨 **Modern UI** - Three-panel layout with color-coded message types
- 🎯 **Nested Cards** - Assistant messages aggregate thinking, text, and tool calls in a single card

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenClaw installed locally

### Installation

```bash
# Clone the repository
git clone https://github.com/ccbot9/openclawd-session-viz.git
cd openclawd-session-viz

# Install dependencies
npm install
```

### Method 1: Auto-load (Recommended)

**One-line start (API + Frontend):**
```bash
npm start
```

Or run them separately:

**Terminal 1 - Start API Server:**
```bash
npm run api
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

**Access the app:** http://localhost:5173/

The application will automatically:
- Load the latest 10 sessions from `~/.openclaw/agents/main/sessions/`
- Display the session directory path at the top
- Allow you to reload sessions with the "Reload" button

### Method 2: Manual Upload

1. **Start frontend only:**
   ```bash
   npm run dev
   ```

2. Click the "Upload" button in the top-right corner
3. Select one or more `.jsonl` files

## 📖 Usage Guide

### Interface Layout

- **Left Sidebar**: Browse all loaded sessions, grouped by date
- **Center Panel**: Interactive timeline view with search functionality
- **Right Sidebar**: Statistics and tool usage analytics

### Viewing Raw JSON

Every message card has a "Raw JSON" button at the bottom. Click to expand and view the original JSON data. You can also copy the JSON with one click.

### Search Functionality

Use the search bar at the top of the timeline to filter messages by:
- Message content
- Tool names
- Message types

### Message Types

Different message types are color-coded:
- 🔵 **User** - User messages (blue)
- 🟣 **Thinking** - Agent thinking process (purple, expandable)
- 🟠 **Tool Call** - Tool invocations (orange, nested cards)
- 🟢 **Tool Result** - Tool execution results (green)
- ⚫ **Assistant** - Agent responses (gray)

### Nested Card Design

Assistant messages use a nested card structure:
```
┌─────────────────────────────────────────┐
│ 🤖 Assistant Message                   │
├─────────────────────────────────────────┤
│ 🧠 Thinking (click to expand) ▼         │
│                                         │
│ 📝 Response text content...             │
│                                         │
│   ┌───────────────────────────────┐   │
│   │ 🔧 Tool Call: exec             │   │
│   │ { command: "..." }             │   │
│   └───────────────────────────────┘   │
│                                         │
│ 📄 Raw JSON ▶                           │
└─────────────────────────────────────────┘
```

## 🛠 Tech Stack

- **Frontend Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7.3
- **Styling**: Tailwind CSS 3.4
- **Charts**: Recharts 3.7
- **Icons**: Lucide React
- **Date Handling**: date-fns 4.1
- **Backend API**: Express 5.2

## 📂 Project Structure

```
src/
├── components/
│   ├── JsonViewer.tsx      # Raw JSON viewer with copy functionality
│   ├── MessageCard.tsx     # Message card with nested design
│   ├── Timeline.tsx        # Timeline view component
│   ├── Inspector.tsx       # Statistics panel
│   └── SessionList.tsx     # Session list with grouping
├── types/
│   └── session.ts          # TypeScript type definitions
├── utils/
│   └── sessionParser.ts    # JSONL parser and aggregator
├── App.tsx                 # Main application
└── main.tsx                # Entry point

server.js                   # Express API server for local file access
```

## 🔌 API Endpoints

The API server (port 3001) provides:

- `GET /api/info` - Get session directory information
- `GET /api/sessions` - List all available sessions
- `GET /api/sessions/:id` - Fetch specific session content

## 🎯 Roadmap

Future enhancements:
- [ ] Session comparison mode
- [ ] Export analysis reports
- [ ] Tool call chain visualization
- [ ] Token usage trends over time
- [ ] Save filter preferences
- [ ] Multi-session analysis

## 📝 Examples

List recent sessions:
```bash
ls -lht ~/.openclaw/agents/main/sessions/*.jsonl | head -5
```

Copy a session for analysis:
```bash
cp ~/.openclaw/agents/main/sessions/<session-id>.jsonl ./examples/
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

Built with assistance from Claude Sonnet 4.5 for analyzing and understanding OpenClaw AI agent execution patterns.

---

**Enjoy exploring your OpenClaw sessions! 🚀**
