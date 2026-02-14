import type { SessionMetadata } from '../types/session';
import { format, formatDistanceToNow } from 'date-fns';
import { FileText, Calendar } from 'lucide-react';

interface SessionListProps {
  sessions: SessionMetadata[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SessionList({ sessions, selectedId, onSelect }: SessionListProps) {
  // Group sessions by date (using modifiedAt instead of createdAt)
  const groupedSessions = sessions.reduce((acc, session) => {
    const dateKey = format(session.modifiedAt, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, SessionMetadata[]>);

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        <FileText size={32} className="mx-auto mb-2 opacity-50" />
        <p>No sessions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto scrollbar-thin">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="mb-4">
          <div className="px-4 py-2 bg-gray-100 sticky top-0 z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <Calendar size={12} />
              <span>{getDateLabel(dateKey)}</span>
            </div>
          </div>

          <div className="space-y-1 px-2 py-1">
            {groupedSessions[dateKey].map((session) => (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedId === session.id
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-gray-500 truncate">
                      {session.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(session.modifiedAt, { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-700">
                      {session.stats.totalMessages} msg
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.stats.toolCalls} tools
                    </div>
                  </div>
                </div>

                {/* Token usage mini bar */}
                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400"
                    style={{
                      width: `${Math.min((session.stats.totalTokens / 100000) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {(session.stats.totalTokens / 1000).toFixed(1)}K tokens
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
