// Tool groups mapping based on OpenClaw documentation
// Reference: knowhow/openclaw-detail/tool-management-logic.md

export const TOOL_GROUPS: Record<string, string[]> = {
  runtime: ['exec', 'bash', 'process'],
  fs: ['read', 'write', 'edit', 'apply_patch'],
  sessions: ['sessions_list', 'sessions_history', 'sessions_send', 'sessions_spawn', 'session_status'],
  memory: ['memory_search', 'memory_get'],
  ui: ['browser', 'canvas'],
  automation: ['cron', 'gateway'],
  messaging: ['message'],
  nodes: ['nodes'],
  web: ['web_search', 'web_fetch'],
  media: ['image', 'tts'],
  agents: ['agents_list'],
};

export interface ToolGroup {
  name: string;
  displayName: string;
  tools: string[];
  count: number;
}

/**
 * Group tools by their category
 */
export function groupTools(toolNames: string[]): ToolGroup[] {
  const groups: Map<string, Set<string>> = new Map();
  const ungrouped: Set<string> = new Set();

  // Categorize each tool
  for (const toolName of toolNames) {
    let foundGroup = false;

    for (const [groupName, groupTools] of Object.entries(TOOL_GROUPS)) {
      if (groupTools.includes(toolName)) {
        if (!groups.has(groupName)) {
          groups.set(groupName, new Set());
        }
        groups.get(groupName)!.add(toolName);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      ungrouped.add(toolName);
    }
  }

  // Convert to array of ToolGroup
  const result: ToolGroup[] = [];

  // Add recognized groups
  for (const [groupName, tools] of groups.entries()) {
    result.push({
      name: groupName,
      displayName: formatGroupName(groupName),
      tools: Array.from(tools).sort(),
      count: tools.size,
    });
  }

  // Add ungrouped tools as "other" group if any
  if (ungrouped.size > 0) {
    result.push({
      name: 'other',
      displayName: 'Other',
      tools: Array.from(ungrouped).sort(),
      count: ungrouped.size,
    });
  }

  // Sort groups by name
  return result.sort((a, b) => {
    // Put 'other' at the end
    if (a.name === 'other') return 1;
    if (b.name === 'other') return -1;
    return a.name.localeCompare(b.name);
  });
}

function formatGroupName(groupName: string): string {
  const names: Record<string, string> = {
    runtime: 'Runtime',
    fs: 'File System',
    sessions: 'Sessions',
    memory: 'Memory',
    ui: 'UI',
    automation: 'Automation',
    messaging: 'Messaging',
    nodes: 'Nodes',
    web: 'Web',
    media: 'Media',
    agents: 'Agents',
    other: 'Other',
  };
  return names[groupName] || groupName;
}
