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
        // Support both formats: input/output and input_tokens/output_tokens
        const inputCount = usage.input || usage.input_tokens || 0;
        const outputCount = usage.output || usage.output_tokens || 0;
        const total = usage.totalTokens || (inputCount + outputCount);

        inputTokens += inputCount;
        outputTokens += outputCount;
        totalTokens += total;
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
        // Calculate total tokens (support both formats)
        let totalTokensForMessage: number | undefined;
        if (usage) {
          if (usage.totalTokens) {
            totalTokensForMessage = usage.totalTokens;
          } else {
            const inputCount = usage.input || usage.input_tokens || 0;
            const outputCount = usage.output || usage.output_tokens || 0;
            totalTokensForMessage = inputCount + outputCount;
          }
        }

        items.push({
          id: record.id,
          type: 'assistant',
          timestamp,
          content: content, // Keep all content (thinking, text, toolCalls)
          tokens: totalTokensForMessage,
          raw: record._raw,
        });
      } else if (role === 'toolResult') {
        // Tool result message (OpenClaw format)
        const textContent = content.find((c: any) => c.type === 'text');
        const resultText = textContent ? (textContent as any).text : '';

        items.push({
          id: record.id,
          type: 'toolResult',
          timestamp,
          content: {
            tool_use_id: (record.message as any).toolCallId,
            toolName: (record.message as any).toolName,
            content: resultText,
            status: (record.message as any).isError ? 'error' : 'success',
            details: (record.message as any).details,
          },
          parentId: (record.message as any).toolCallId,
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
  const modifiedAt = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : new Date();

  return {
    id,
    path,
    name: id.slice(0, 8),
    createdAt,
    modifiedAt,
    records,
    stats,
  };
}
