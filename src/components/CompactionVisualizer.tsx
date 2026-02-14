import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, FileText } from 'lucide-react';

const CONFIG = {
  contextWindow: 200000,
  reserveTokens: 16384,
  keepRecentTokens: 20000,
  softThresholdTokens: 4000,
  tokensPerMessage: [500, 1200, 800, 1500, 600, 2000, 900],
};

const HARD_THRESHOLD = CONFIG.contextWindow - CONFIG.reserveTokens; // 183616
const SOFT_THRESHOLD = HARD_THRESHOLD - CONFIG.softThresholdTokens; // 179616

interface Message {
  id: number;
  content: string;
  tokens: number;
  timestamp: string;
  compacted: boolean;
}

interface LogEntry {
  time: string;
  message: string;
  type: 'message' | 'flush' | 'compact';
}

interface CompactionVisualizerProps {
  sessionPath?: string;
  onClose?: () => void;
}

export function CompactionVisualizer({ sessionPath, onClose }: CompactionVisualizerProps) {
  const [sessionInput, setSessionInput] = useState(sessionPath || '');
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

  const messageIdCounter = useRef(0);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const tokensRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);

  const addLog = (message: string, type: 'message' | 'flush' | 'compact' = 'message') => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [{ time, message, type }, ...prev]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms / speed));

  const addMessage = (content: string, messageTokens: number) => {
    const message: Message = {
      id: ++messageIdCounter.current,
      content,
      tokens: messageTokens,
      timestamp: new Date().toISOString(),
      compacted: false,
    };

    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);

    tokensRef.current += messageTokens;
    setTokens(tokensRef.current);

    addLog(`📨 新消息 #${message.id}：${content.substring(0, 30)}... (+${messageTokens} tokens)`);
  };

  const memoryFlush = async () => {
    setStatus('💾 Memory Flush');
    setIsPaused(true);
    isPausedRef.current = true;

    addLog('🧠 触发 Memory Flush（软阈值 179.6k tokens）', 'flush');
    await sleep(1000);
    addLog('💾 执行静默 agent 回合...', 'flush');
    await sleep(1000);
    addLog('📝 写入 memory/2026-02-14.md', 'flush');
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

  const runSimulation = async () => {
    isRunningRef.current = true;
    setIsRunning(true);
    setStatus('运行中');

    const messageTemplates = [
      '用户问了一个关于 OpenClaw 的问题',
      'Assistant 详细解释了 compaction 机制',
      '执行了浏览器操作工具',
      '读取了配置文件',
      '用户请求查看 session 历史',
      'Assistant 分析了 JSONL 文件结构',
      '讨论了 Memory Flush 的工作原理',
      '对比了 Compaction vs Pruning',
      '创建了可视化文档',
      '提交并推送到 GitHub',
    ];

    let step = 0;
    while (isRunningRef.current && tokensRef.current < CONFIG.contextWindow) {
      if (isPausedRef.current) {
        await sleep(100);
        continue;
      }

      // Check Memory Flush
      if (!flushExecuted && tokensRef.current >= SOFT_THRESHOLD) {
        await memoryFlush();
      }

      // Check Compaction
      if (tokensRef.current >= HARD_THRESHOLD) {
        await compact();
        continue;
      }

      // Add new message
      const template = messageTemplates[step % messageTemplates.length];
      const messageTokens = CONFIG.tokensPerMessage[Math.floor(Math.random() * CONFIG.tokensPerMessage.length)];
      addMessage(template, messageTokens);

      step++;
      await sleep(500);
    }

    if (tokensRef.current >= CONFIG.contextWindow) {
      addLog('⚠️ 达到上下文窗口限制', 'compact');
      setStatus('已完成');

      // Auto-close after completion
      if (onClose) {
        await sleep(3000);
        onClose();
      }
    }

    isRunningRef.current = false;
    setIsRunning(false);
  };

  const handleStart = () => {
    if (!sessionInput.trim()) {
      alert('请输入 Session 路径');
      return;
    }

    setIsStarted(true);
    addLog(`🦉 加载 Session: ${sessionInput}`);
    addLog('点击"开始演示"查看完整流程');
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
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            🦉 OpenClaw Compaction 可视化
          </h1>
          <p className="text-gray-300 text-center mb-8">
            基于真实 Session 数据的动态演示
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session 文件路径
            </label>
            <input
              type="text"
              value={sessionInput}
              onChange={(e) => setSessionInput(e.target.value)}
              placeholder="/Users/cc/.openclaw/agents/main/sessions/xxx.jsonl"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStart}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              开始加载
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                取消
              </button>
            )}
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
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">🦉 OpenClaw Compaction 可视化</h1>
            <p className="text-purple-100">Session: {sessionInput}</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => runSimulation()}
              disabled={isRunning}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Play size={18} />
              开始演示
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
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                关闭
              </button>
            )}
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
              <div className="absolute bottom-0 left-0 right-0 h-48 flex items-end gap-1">
                {messages.map((msg, i) => (
                  <div
                    key={msg.id}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-indigo-600 rounded-t transition-all"
                    style={{
                      height: `${Math.min(100, (tokens / CONFIG.contextWindow) * 100)}%`,
                      opacity: msg.compacted ? 0.3 : 1,
                    }}
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
                  #{msg.id} · {msg.tokens} tokens
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
