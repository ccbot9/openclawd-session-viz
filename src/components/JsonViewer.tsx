import { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
}

export function JsonViewer({ data, title = 'Raw JSON' }: JsonViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-gray-200 mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 w-full"
      >
        <Code size={14} />
        <span>{title}</span>
        <span className="text-xs text-gray-400">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white"
            title="Copy JSON"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto scrollbar-thin max-h-96 overflow-y-auto">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
}
