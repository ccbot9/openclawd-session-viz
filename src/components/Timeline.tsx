import { useEffect, useRef } from 'react';
import type { TimelineItem } from '../types/session';
import { MessageCard } from './MessageCard';

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when items change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items]);

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
      {/* Invisible element at the bottom for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
