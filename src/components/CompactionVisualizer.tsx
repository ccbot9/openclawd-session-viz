import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, FileText, X } from 'lucide-react';

const API_URL = 'http://localhost:3001';

const CONFIG = {
  contextWindow: 200000,
  reserveTokens: 16384,
  keepRecentTokens: 20000,
  softThresholdTokens: 4000,
};

const HARD_THRESHOLD = CONFIG.contextWindow - CONFIG.reserveTokens; // 183616
const SOFT_THRESHOLD = HARD_THRESHOLD - CONFIG.softThresholdTokens; // 179616

interface Message {
  id: number;
  content: string;
  tokens: number;
  timestamp: string;
  compacted: boolean;
  cumulativeTokens: number;
  role?: string;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'message' | 'flush' | 'compact' | 'info';
}

interface CompactionVisualizerProps {
  sessionPath?: string;
  onClose?: () => void;
}

export function CompactionVisualizer({ sessionPath, onClose }: CompactionVisualizerProps) {
  const [sessionInput, setSessionInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tokens, setTokens] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [compactedMessages, setCompactedMessages] = useState<any[]>([]);
  const [compactionCount, setCompactionCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [flushExecuted, setFlushExecuted] = useState(false);
  const [status, setStatus] = useState('待机');
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any[]>([]);

  const messageIdCounter = useRef(0);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const tokensRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);

  const addLog = (message: string, type: 'message' | 'flush' | 'compact' | 'info' = 'message') => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [{ time, message, type }, ...prev]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms / speed));

  // 加载真实的 session 数据
  const loadSessionData = async (sessionId: string) => {
    setLoading(true);
    setStatus('加载中...');
    addLog(`📂 正在加载 Session: ${sessionId}`, 'info');

    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Session not found');
      }

      const data = await response.json();
      const lines = data.content.split('\n').filter((line: string) => line.trim());
      const records = lines.map((line: string) => JSON.parse(line));

      addLog(`✅ 成功加载 ${records.length} 条记录`, 'info');
      setSessionData(records);
      setIsStarted(true);
      setLoading(false);
      setStatus('就绪');

      return records;
    } catch (error) {
      addLog(`❌ 加载失败: ${error}`, 'info');
      setLoading(false);
      setStatus('加载失败');
      alert('加载 Session 失败，请检查 Session ID 是否正确');
      return [];
    }
  };

  const handleStart = async () => {
    const sessionId = sessionInput.trim();
    if (!sessionId) {
      alert('请输入 Session ID');
      return;
    }

    await loadSessionData(sessionId);
  };

  const extractTokensFromMessage = (record: any): number => {
    // 从 message 中提取 tokens
    if (record.message?.usage) {
      const usage = record.message.usage;
      // 计算总 tokens
      const inputTokens = usage.input || usage.input_tokens || 0;
      const outputTokens = usage.output || usage.output_tokens || 0;
      return inputTokens + outputTokens;
    }
    return 0;
  };

  const getMessageContent = (record: any): string => {
    if (record.type === 'message' && record.message) {
      const role = record.message.role;
      const content = record.message.content;

      if (Array.isArray(content)) {
        // 提取文本内容
        const textParts = content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join(' ');
        return `[${role}] ${textParts.substring(0, 50)}...`;
      }

      return `[${role}] ${JSON.stringify(content).substring(0, 50)}...`;
    }

    if (record.type === 'tool_result') {
      return `[tool_result] Tool execution`;
    }

    if (record.type === 'thinking_level_change') {
      return `[system] Thinking level changed`;
    }

    return `[${record.type}] ${JSON.stringify(record).substring(0, 50)}...`;
  };

  const addMessage = (content: string, messageTokens: number, role?: string) => {
    tokensRef.current += messageTokens;

    const message: Message = {
      id: ++messageIdCounter.current,
      content,
      tokens: messageTokens,
      timestamp: new Date().toISOString(),
      compacted: false,
      cumulativeTokens: tokensRef.current,
      role,
    };

    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
    setTokens(tokensRef.current);

    addLog(`📨 消息 #${message.id}：${content.substring(0, 30)}... (+${messageTokens.toLocaleString()} tokens)`);
  };

  const memoryFlush = async () => {
    setStatus('💾 Memory Flush');
    setIsPaused(true);
    isPausedRef.current = true;

    addLog('🧠 触发 Memory Flush（软阈值 179.6k tokens）', 'flush');
    await sleep(1000);
    addLog('💾 执行静默 agent 回合...', 'flush');
    await sleep(1000);
    addLog('📝 写入 memory/*.md', 'flush');
    await sleep(1000);
    addLog('✅ Memory Flush 完成（NO_REPLY - 用户看不到）', 'flush');

    setFlushExecuted(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setStatus('运行中');
  };

  const compact = async () => {
    setIsPaused(true);
    isPausedRef.current = true;

    const newCompactionCount = compactionCount + 1;
    setCompactionCount(newCompactionCount);
    setStatus('🧹 Compaction');

    addLog(`🧹 触发 Compaction（硬阈值 183.6k tokens）- 第 ${newCompactionCount} 次`, 'compact');
    await sleep(1000);
    addLog('📊 分析对话历史...', 'compact');
    await sleep(1000);
    addLog('✨ LLM 生成摘要...', 'compact');
    await sleep(1500);

    // Calculate kept messages
    let keptTokens = 0;
    let keptCount = 0;
    for (let i = messagesRef.current.length - 1; i >= 0; i--) {
      if (keptTokens + messagesRef.current[i].tokens <= CONFIG.keepRecentTokens) {
        keptTokens += messagesRef.current[i].tokens;
        keptCount++;
      } else {
        break;
      }
    }

    const compactedCount = messagesRef.current.length - keptCount;
    const compactedTokens = tokensRef.current - keptTokens;

    // Mark old messages as compacted
    const updatedMessages = messagesRef.current.map((msg, i) => ({
      ...msg,
      compacted: i < compactedCount,
    }));
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);

    // Create summary
    const summary = {
      id: `summary-${newCompactionCount}`,
      type: 'compaction',
      content: `压缩摘要 #${newCompactionCount}\n压缩了 ${compactedCount} 条消息 (${compactedTokens.toLocaleString()} tokens)\n保留最近 ${keptCount} 条消息`,
      tokens: 5000,
    };

    setCompactedMessages(prev => [...prev, summary, ...updatedMessages.slice(compactedCount)]);

    tokensRef.current = keptTokens + summary.tokens;
    setTokens(tokensRef.current);
    setFlushExecuted(false);

    addLog(`✅ Compaction 完成：${compactedCount} 条消息 → 摘要`, 'compact');
    addLog(`📉 Tokens: ${(keptTokens + compactedTokens).toLocaleString()} → ${tokensRef.current.toLocaleString()}`, 'compact');

    await sleep(2000);
    setIsPaused(false);
    isPausedRef.current = false;
    setStatus('运行中');
  };

  const runVisualization = async () => {
    if (sessionData.length === 0) {
      alert('没有可用的 session 数据');
      return;
    }

    isRunningRef.current = true;
    setIsRunning(true);
    setStatus('运行中');
    addLog('🚀 开始可视化...', 'info');

    for (const record of sessionData) {
      if (!isRunningRef.current) break;

      while (isPausedRef.current) {
        await sleep(100);
      }

      const messageTokens = extractTokensFromMessage(record);

      if (messageTokens > 0) {
        const content = getMessageContent(record);
        const role = record.message?.role;

        addMessage(content, messageTokens, role);

        // Check Memory Flush
        if (!flushExecuted && tokensRef.current >= SOFT_THRESHOLD) {
          await memoryFlush();
        }

        // Check Compaction
        if (tokensRef.current >= HARD_THRESHOLD) {
          await compact();
        }

        await sleep(300);
      }
    }

    addLog('✅ 可视化完成', 'info');
    setStatus('已完成');

    // Auto-close after completion
    if (onClose) {
      await sleep(3000);
      onClose();
    }

    isRunningRef.current = false;
    setIsRunning(false);
  };

  const handleReset = () => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    tokensRef.current = 0;
    messagesRef.current = [];
    messageIdCounter.current = 0;

    setIsRunning(false);
    setIsPaused(false);
    setTokens(0);
    setMessages([]);
    setCompactedMessages([]);
    setCompactionCount(0);
    setLogs([]);
    setFlushExecuted(false);
    setStatus('待机');
    setIsStarted(false);
    setSessionInput('');
    setSessionData([]);
  };

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    isPausedRef.current = newPaused;
    setStatus(newPaused ? '已暂停' : '运行中');
  };

  const cycleSpeed = () => {
    const speeds = [1, 2, 4, 8];
    const currentIndex = speeds.indexOf(speed);
    setSpeed(speeds[(currentIndex + 1) % speeds.length]);
  };

  const usagePercent = Math.min(100, (tokens / CONFIG.contextWindow) * 100).toFixed(1);

  if (!isStarted) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-8 max-w-2xl w-full shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-white">
              🦉 OpenClaw Compaction 可视化
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            )}
          </div>
          <p className="text-gray-300 text-center mb-8">
            基于真实 Session 数据的动态可视化
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="例如: df15e9c3-4a26-4e64-9974-d5260f82979d"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-2">
              💡 输入 Session ID，系统将从 ~/.openclaw/agents/main/sessions/ 读取数据
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              {loading ? '加载中...' : '加载 Session'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-y-auto z-50">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🦉 OpenClaw Compaction 可视化</h1>
              <p className="text-purple-100">Session: {sessionInput}</p>
              <p className="text-sm text-purple-200">共 {sessionData.length} 条记录</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={runVisualization}
              disabled={isRunning}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Play size={18} />
              开始可视化
            </button>
            <button
              onClick={togglePause}
              disabled={!isRunning}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Pause size={18} />
              {isPaused ? '继续' : '暂停'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw size={18} />
              重置
            </button>
            <button
              onClick={cycleSpeed}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Zap size={18} />
              速度: {speed}x
            </button>
          </div>

          {/* Status Panel */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="当前 Tokens" value={tokens.toLocaleString()} />
            <StatCard label="上下文窗口" value="200k" />
            <StatCard label="使用率" value={`${usagePercent}%`} />
            <StatCard label="压缩次数" value={compactionCount.toString()} />
            <StatCard label="消息数" value={messages.length.toString()} />
            <StatCard label="当前状态" value={status} highlight />
          </div>

          {/* Token Chart */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📊 Token 累积图</h2>
            <div className="relative h-64 bg-gray-900 rounded-lg p-4">
              <div className="absolute top-[25%] left-0 right-0 h-0.5 border-t-2 border-dashed border-orange-500">
                <span className="absolute right-2 -top-6 text-xs bg-orange-500 text-black px-2 py-1 rounded">
                  软阈值 (179.6k)
                </span>
              </div>
              <div className="absolute top-[15%] left-0 right-0 h-0.5 border-t-2 border-dashed border-red-500">
                <span className="absolute right-2 -top-6 text-xs bg-red-500 text-white px-2 py-1 rounded">
                  硬阈值 (183.6k)
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end gap-1 overflow-x-auto">
                {messages.map((msg, i) => (
                  <div
                    key={msg.id}
                    className="flex-shrink-0 w-2 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-t transition-all"
                    style={{
                      height: `${Math.min(100, (msg.cumulativeTokens / CONFIG.contextWindow) * 100)}%`,
                      opacity: msg.compacted ? 0.3 : 1,
                    }}
                    title={`#${msg.id}: ${msg.cumulativeTokens.toLocaleString()} tokens`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="grid md:grid-cols-2 gap-4">
            <MessageColumn title="原始消息" messages={messages} />
            <MessageColumn title="压缩后" messages={compactedMessages} isCompacted />
          </div>

          {/* Event Log */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📋 事件日志</h2>
            <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="border-b border-gray-800 pb-1">
                  <span className="text-gray-500">[{log.time}]</span>{' '}
                  <span className={
                    log.type === 'flush' ? 'text-orange-400' :
                    log.type === 'compact' ? 'text-red-400' :
                    log.type === 'info' ? 'text-blue-400' :
                    'text-purple-400'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-center">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-purple-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function MessageColumn({ title, messages, isCompacted = false }: { title: string; messages: any[]; isCompacted?: boolean }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-purple-400 mb-4 border-b border-purple-600 pb-2">
        {title}
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`p-3 rounded-lg text-sm ${
              msg.type === 'compaction'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-black font-semibold'
                : msg.compacted
                ? 'bg-gray-700 opacity-40'
                : 'bg-gray-700'
            }`}
          >
            {msg.type === 'compaction' ? (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            ) : (
              <>
                <div className="text-xs text-gray-400 mb-1">
                  #{msg.id} · {msg.tokens?.toLocaleString()} tokens · {msg.role || 'system'}
                </div>
                <div className="text-white">{msg.content}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
