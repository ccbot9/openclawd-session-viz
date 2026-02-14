interface HighlightTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export function HighlightText({ text, searchQuery, className = '' }: HighlightTextProps) {
  if (!searchQuery || !text) {
    return <span className={className}>{text}</span>;
  }

  const query = searchQuery.toLowerCase();
  const lowerText = text.toLowerCase();
  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;

  // Find all occurrences
  let index = lowerText.indexOf(query);
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push({
        text: text.substring(lastIndex, index),
        highlight: false,
      });
    }

    // Add matched text
    parts.push({
      text: text.substring(index, index + query.length),
      highlight: true,
    });

    lastIndex = index + query.length;
    index = lowerText.indexOf(query, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.substring(lastIndex),
      highlight: false,
    });
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark key={i} className="bg-yellow-300 text-gray-900 font-semibold px-0.5 rounded">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
