// Session types based on openclawd JSONL format

export type MessageRole = 'user' | 'assistant';

export type ContentType = 'text' | 'thinking' | 'toolCall' | 'tool_use' | 'tool_result';

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ThinkingContent {
  type: 'thinking';
  thinking: string;
  thinkingSignature?: string;
}

export interface ToolCallContent {
  type: 'toolCall' | 'tool_use';
  id: string;
  name: string;
  arguments?: Record<string, any>;
  input?: Record<string, any>;
}

export type MessageContent = TextContent | ThinkingContent | ToolCallContent;

export interface TokenUsage {
  // Old format (Anthropic API)
  input_tokens?: number;
  output_tokens?: number;
  // New format (OpenClaw)
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  totalTokens?: number;
  cost?: {
    input?: number;
    output?: number;
    cacheRead?: number;
    cacheWrite?: number;
    total?: number;
  };
}

export interface Message {
  role: MessageRole;
  content: MessageContent[];
  api?: string;
  provider?: string;
  model?: string;
  usage?: TokenUsage;
}

export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: any;
  status?: 'success' | 'error';
  error?: string;
}

export interface SessionRecord {
  type: 'message' | 'tool_result';
  id: string;
  parentId?: string;
  timestamp: string;
  message?: Message;
  result?: ToolResult;
  // Keep raw JSON for inspection
  _raw?: any;
}

export interface SessionStats {
  totalMessages: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  toolCalls: number;
  duration: number;
  toolUsage: Record<string, number>;
}

export interface SessionMetadata {
  id: string;
  path: string;
  name: string;
  createdAt: Date;
  modifiedAt: Date;
  records: SessionRecord[];
  stats: SessionStats;
}

export interface TimelineItem {
  id: string;
  type: 'user' | 'assistant' | 'thinking' | 'toolCall' | 'toolResult';
  timestamp: Date;
  content: any;
  tokens?: number;
  parentId?: string;
  raw: any;
}
