import type { SessionRecord, SessionMetadata, SessionStats, TimelineItem } from '../types/session';

export function parseJsonl(content: string): SessionRecord[] {
  const lines = content.trim().split('\n').filter(line => line.trim());
  const records: SessionRecord[] = [];

  for (const line of lines) {
    try {
      const json = JSON.parse(line);
      records.push({
        ...json,
        _raw: json, // Keep original for JSON viewer
      });
    } catch (error) {
      console.error('Failed to parse line:', line, error);
    }
  }

  return records;
}

export function calculateStats(records: SessionRecord[]): SessionStats {
  let totalTokens = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCalls = 0;
  const toolUsage: Record<string, number> = {};

  for (const record of records) {
    if (record.type === 'message' && record.message) {
      const usage = record.message.usage;
      if (usage) {
        inputTokens += usage.input_tokens || 0;
        outputTokens += usage.output_tokens || 0;
        totalTokens += (usage.input_tokens || 0) + (usage.output_tokens || 0);
      }

      // Count tool calls
      const contents = record.message.content || [];
      for (const content of contents) {
        if (content.type === 'toolCall' || content.type === 'tool_use') {
          toolCalls++;
          const toolName = content.name;
          toolUsage[toolName] = (toolUsage[toolName] || 0) + 1;
        }
      }
    }
  }

  // Calculate duration from first to last record
  const timestamps = records
    .map(r => new Date(r.timestamp).getTime())
    .filter(t => !isNaN(t));

  const duration = timestamps.length > 1
    ? Math.max(...timestamps) - Math.min(...timestamps)
    : 0;

  return {
    totalMessages: records.filter(r => r.type === 'message').length,
    totalTokens,
    inputTokens,
    outputTokens,
    toolCalls,
    duration,
    toolUsage,
  };
}

export function buildTimeline(records: SessionRecord[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const record of records) {
    if (record.type === 'message' && record.message) {
      const { role, content, usage } = record.message;
      const timestamp = new Date(record.timestamp);

      if (role === 'user') {
        // User message
        const textContent = content.find(c => c.type === 'text');
        items.push({
          id: record.id,
          type: 'user',
          timestamp,
          content: textContent ? (textContent as any).text : '',
          raw: record._raw,
        });
      } else if (role === 'assistant') {
        // Assistant message - aggregate all content into one item
        items.push({
          id: record.id,
          type: 'assistant',
          timestamp,
          content: content, // Keep all content (thinking, text, toolCalls)
          tokens: usage ? usage.input_tokens + usage.output_tokens : undefined,
          raw: record._raw,
        });
      }
    } else if (record.type === 'tool_result' && record.result) {
      // Tool result
      items.push({
        id: record.id,
        type: 'toolResult',
        timestamp: new Date(record.timestamp),
        content: record.result,
        parentId: record.result.tool_use_id,
        raw: record._raw,
      });
    }
  }

  return items;
}

export function createSessionMetadata(
  id: string,
  path: string,
  content: string
): SessionMetadata {
  const records = parseJsonl(content);
  const stats = calculateStats(records);

  const timestamps = records.map(r => new Date(r.timestamp)).filter(d => !isNaN(d.getTime()));
  const createdAt = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : new Date();

  return {
    id,
    path,
    name: id.slice(0, 8),
    createdAt,
    records,
    stats,
  };
}
