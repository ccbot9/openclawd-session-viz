import type { TimelineItem } from '../types/session';
import { JsonViewer } from './JsonViewer';
import { User, Brain, Wrench, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface MessageCardProps {
  item: TimelineItem;
}

export function MessageCard({ item }: MessageCardProps) {
  const { type, timestamp, content, tokens } = item;

  const getCardStyle = () => {
    switch (type) {
      case 'user':
        return 'border-l-4 border-l-user bg-blue-50';
      case 'toolResult':
        return 'border-l-4 border-l-result bg-green-50';
      case 'assistant':
        return 'border-l-4 border-l-assistant bg-gray-50';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'user':
        return <User size={18} className="text-user" />;
      case 'toolResult':
        return content.status === 'error'
          ? <AlertCircle size={18} className="text-error" />
          : <CheckCircle size={18} className="text-result" />;
      case 'assistant':
        return <MessageSquare size={18} className="text-assistant" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'user':
        return 'User';
      case 'toolResult':
        const toolName = content.toolName ? `: ${content.toolName}` : '';
        return `Tool Result${toolName}${content.status === 'error' ? ' (Error)' : ''}`;
      case 'assistant':
        return 'Assistant';
    }
  };

  const renderContent = () => {
    if (type === 'user') {
      return <p className="text-gray-800 whitespace-pre-wrap">{content}</p>;
    }

    if (type === 'toolResult') {
      const resultContent = content.content;
      const isError = content.status === 'error';
      const details = content.details;

      return (
        <div className="space-y-2">
          {/* Show execution details if available */}
          {details && (
            <div className="flex gap-4 text-xs text-gray-600">
              {details.status && (
                <span>
                  <span className="font-semibold">Status:</span> {details.status}
                </span>
              )}
              {details.exitCode !== undefined && (
                <span>
                  <span className="font-semibold">Exit Code:</span> {details.exitCode}
                </span>
              )}
              {details.durationMs && (
                <span>
                  <span className="font-semibold">Duration:</span> {details.durationMs}ms
                </span>
              )}
            </div>
          )}

          {/* Result content */}
          <div className={`p-3 rounded border ${isError ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            {isError && content.error && (
              <p className="text-red-700 text-sm mb-2">Error: {content.error}</p>
            )}
            <pre className="text-xs text-gray-700 overflow-x-auto max-h-40 overflow-y-auto scrollbar-thin">
              {typeof resultContent === 'string'
                ? resultContent
                : JSON.stringify(resultContent, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    if (type === 'assistant') {
      // content is an array of message content items
      const contentArray = Array.isArray(content) ? content : [];
      const thinkingItems = contentArray.filter((c: any) => c.type === 'thinking');
      const textItems = contentArray.filter((c: any) => c.type === 'text');
      const toolCallItems = contentArray.filter((c: any) => c.type === 'toolCall' || c.type === 'tool_use');

      return (
        <div className="space-y-4">
          {/* Thinking */}
          {thinkingItems.map((thinking: any, idx: number) => (
            <details key={`thinking-${idx}`} className="cursor-pointer">
              <summary className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium">
                <Brain size={14} />
                <span>Thinking (click to expand)</span>
              </summary>
              <div className="mt-2 p-3 bg-purple-50 rounded border border-purple-200">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{thinking.thinking}</p>
              </div>
            </details>
          ))}

          {/* Text content */}
          {textItems.map((text: any, idx: number) => (
            <div key={`text-${idx}`} className="text-gray-800 whitespace-pre-wrap">
              {text.text}
            </div>
          ))}

          {/* Tool Calls - nested cards */}
          {toolCallItems.length > 0 && (
            <div className="space-y-2">
              {toolCallItems.map((toolCall: any, idx: number) => {
                const args = toolCall.arguments || toolCall.input || {};
                const toolName = toolCall.name.toLowerCase();
                const isWriteTool = toolName === 'write';
                const isEditTool = toolName === 'edit';
                const hasContent = args.content || args.file_content;
                const hasEdit = args.old_string || args.oldText;

                return (
                  <div
                    key={`tool-${idx}`}
                    className="ml-4 p-3 border-l-4 border-l-tool bg-orange-50 rounded"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench size={14} className="text-tool" />
                      <span className="font-mono text-sm font-semibold text-orange-900">
                        {toolCall.name}
                      </span>
                    </div>

                    {/* Write tool - Render as Markdown */}
                    {isWriteTool && hasContent ? (
                      <div className="space-y-2">
                        {/* Show file path */}
                        {(args.file_path || args.path) && (
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold">Path:</span>{' '}
                            <code className="bg-white px-1 py-0.5 rounded">{args.file_path || args.path}</code>
                          </div>
                        )}

                        {/* Render content as Markdown */}
                        <div className="bg-white p-3 rounded border border-orange-200 prose prose-sm max-w-none">
                          <ReactMarkdown>{args.content || args.file_content}</ReactMarkdown>
                        </div>
                      </div>
                    ) : isEditTool && hasEdit ? (
                      /* Edit tool - Show diff */
                      <div className="space-y-2">
                        {/* Show file path */}
                        {(args.file_path || args.path) && (
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold">Path:</span>{' '}
                            <code className="bg-white px-1 py-0.5 rounded">{args.file_path || args.path}</code>
                          </div>
                        )}

                        {/* Show diff */}
                        <div className="bg-white rounded border border-orange-200 overflow-hidden">
                          <ReactDiffViewer
                            oldValue={args.old_string || args.oldText || ''}
                            newValue={args.new_string || args.newText || ''}
                            splitView={true}
                            showDiffOnly={false}
                            useDarkTheme={false}
                            styles={{
                              variables: {
                                light: {
                                  diffViewerBackground: '#ffffff',
                                  addedBackground: '#e6ffec',
                                  addedColor: '#24292e',
                                  removedBackground: '#ffebe9',
                                  removedColor: '#24292e',
                                  wordAddedBackground: '#acf2bd',
                                  wordRemovedBackground: '#fdb8c0',
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Regular JSON display for other tools */
                      <div className="bg-white p-2 rounded border border-orange-200">
                        <pre className="text-xs text-gray-700 overflow-x-auto">
                          {JSON.stringify(args, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`card card-hover p-4 ${getCardStyle()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold text-sm">{getTitle()}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {tokens && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {tokens.toLocaleString()} tokens
            </span>
          )}
          <time title={timestamp.toISOString()}>
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </time>
        </div>
      </div>

      <div className="text-sm">
        {renderContent()}
      </div>

      <JsonViewer data={item.raw} />
    </div>
  );
}
