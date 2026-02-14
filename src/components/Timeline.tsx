import type { TimelineItem } from '../types/session';
import { MessageCard } from './MessageCard';

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No messages to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="relative">
          {/* Timeline connector */}
          {index < items.length - 1 && (
            <div className="absolute left-6 top-full h-4 w-0.5 bg-gray-200 z-0" />
          )}
          <MessageCard item={item} />
        </div>
      ))}
    </div>
  );
}
