import { useEffect, useRef } from 'react';
import type { TimelineItem } from '../types/session';
import { MessageCard } from './MessageCard';

interface TimelineProps {
  items: TimelineItem[];
  highlightIndex?: number;
}

export function Timeline({ items, highlightIndex = -1 }: TimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when items change (only when not searching)
  useEffect(() => {
    if (highlightIndex === -1 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items, highlightIndex]);

  // Scroll to highlighted item when highlightIndex changes
  useEffect(() => {
    if (highlightIndex >= 0 && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightIndex]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No messages to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {items.map((item, index) => {
        const isHighlighted = index === highlightIndex;
        return (
          <div
            key={`${item.id}-${index}`}
            ref={isHighlighted ? highlightRef : null}
            className={`relative transition-all ${
              isHighlighted ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''
            }`}
          >
            {/* Timeline connector */}
            {index < items.length - 1 && (
              <div className="absolute left-6 top-full h-4 w-0.5 bg-gray-200 z-0" />
            )}
            <MessageCard item={item} />
          </div>
        );
      })}
      {/* Invisible element at the bottom for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
