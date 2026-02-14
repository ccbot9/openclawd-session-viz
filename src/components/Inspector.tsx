import type { SessionStats } from '../types/session';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, MessageCircle, Wrench, Zap } from 'lucide-react';

interface InspectorProps {
  stats: SessionStats | null;
}

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export function Inspector({ stats }: InspectorProps) {
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
