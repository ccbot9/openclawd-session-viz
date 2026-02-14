import type { SessionStats, SessionConfig } from '../types/session';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, MessageCircle, Wrench, Zap, Sparkles, Settings, ChevronRight } from 'lucide-react';
import { groupTools } from '../utils/toolGroups';

interface InspectorProps {
  stats: SessionStats | null;
  config?: SessionConfig | null;
}

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export function Inspector({ stats, config }: InspectorProps) {
  if (!stats) {
    return (
      <div className="p-6 text-gray-400 text-sm">
        Select a session to view statistics
      </div>
    );
  }

  const { totalMessages, totalTokens, inputTokens, outputTokens, toolCalls, duration, toolUsage } = stats;

  // Prepare data for pie chart
  const toolData = Object.entries(toolUsage)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Session Configuration */}
      {config && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Sparkles size={16} />
            Session Configuration
          </h3>
          <div className="space-y-3">
            {config.model && (
              <div className="card p-3">
                <div className="text-xs text-gray-500 mb-1">Model</div>
                <div className="font-mono text-sm text-gray-900">
                  {config.model}
                  {config.modelProvider && (
                    <span className="ml-2 text-gray-500">({config.modelProvider})</span>
                  )}
                </div>
              </div>
            )}

            <StatItem
              icon={<Sparkles size={14} />}
              label="Skills"
              value={config.skillCount.toString()}
            />

            <StatItem
              icon={<Settings size={14} />}
              label="Available Tools"
              value={config.toolCount.toString()}
            />

            {config.systemPromptChars && (
              <StatItem
                icon={<MessageCircle size={14} />}
                label="System Prompt"
                value={`${(config.systemPromptChars / 1000).toFixed(1)}K chars`}
              />
            )}
          </div>

          {/* Tools List - Grouped */}
          {config.tools && config.tools.length > 0 && (() => {
            const toolGroups = groupTools(config.tools.map(t => t.name));
            return (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">
                  Available Tools ({config.toolCount})
                </h4>
                <div className="card p-3 space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {toolGroups.map((group) => (
                    <details key={group.name} className="group/tool">
                      <summary className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight size={12} className="text-gray-400 transition-transform group-open/tool:rotate-90" />
                          <span className="text-xs font-semibold text-gray-700">{group.displayName}</span>
                        </div>
                        <span className="text-xs text-gray-400">{group.count} tools</span>
                      </summary>
                      <div className="ml-5 mt-1 space-y-1">
                        {group.tools.map((toolName) => {
                          const toolInfo = config.tools.find(t => t.name === toolName);
                          return (
                            <div key={toolName} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-gray-50 rounded">
                              <span className="font-mono text-gray-600">{toolName}</span>
                              {toolInfo?.propertiesCount !== undefined && (
                                <span className="text-gray-400">{toolInfo.propertiesCount} props</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Skills List */}
          {config.skills && config.skills.length > 0 && (
            <details className="mt-4 group">
              <summary className="text-xs font-semibold text-gray-600 mb-2 cursor-pointer hover:text-gray-800">
                Skills ({config.skillCount}) - Click to expand
              </summary>
              <div className="card p-3 max-h-60 overflow-y-auto scrollbar-thin mt-2">
                <div className="space-y-2">
                  {config.skills.map((skill, index) => (
                    <div key={index} className="text-xs pb-2 border-b border-gray-100 last:border-0">
                      <div className="font-mono text-gray-700 font-semibold">{skill.name}</div>
                      {skill.description && (
                        <div className="text-gray-500 mt-1 line-clamp-2">{skill.description}</div>
                      )}
                      {skill.source && (
                        <div className="text-gray-400 mt-1">
                          <span className="bg-gray-100 px-1 py-0.5 rounded">{skill.source}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Session Stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Zap size={16} />
          Session Statistics
        </h3>
        <div className="space-y-3">
          <StatItem
            icon={<Clock size={14} />}
            label="Duration"
            value={formatDuration(duration)}
          />
          <StatItem
            icon={<MessageCircle size={14} />}
            label="Messages"
            value={totalMessages.toString()}
          />
          <StatItem
            icon={<Wrench size={14} />}
            label="Tool Calls"
            value={toolCalls.toString()}
          />
        </div>
      </div>

      {/* Token Usage */}
      <div className="card p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Token Usage</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total</span>
            <span className="font-mono font-semibold">{totalTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Input</span>
            <span className="font-mono">{inputTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Output</span>
            <span className="font-mono">{outputTokens.toLocaleString()}</span>
          </div>
        </div>

        {/* Token usage bar */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${(inputTokens / totalTokens) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Input: {((inputTokens / totalTokens) * 100).toFixed(1)}%</span>
          <span>Output: {((outputTokens / totalTokens) * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Tool Usage */}
      {toolData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Tool Usage</h4>

          {/* Pie Chart */}
          <div className="card p-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={toolData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {toolData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tool List */}
          <div className="mt-3 space-y-2">
            {toolData.map((tool, index) => (
              <div
                key={tool.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-mono text-xs">{tool.name}</span>
                </div>
                <span className="text-gray-600">× {tool.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
