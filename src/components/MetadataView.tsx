import type { SessionConfig } from '../types/session';
import { formatDistanceToNow } from 'date-fns';
import { Info, Settings, Database, Zap, FileText, User, Globe } from 'lucide-react';

interface MetadataViewProps {
  config: SessionConfig | null;
  rawMetadata?: any;
}

export function MetadataView({ config, rawMetadata }: MetadataViewProps) {
  if (!config && !rawMetadata) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p>No metadata available</p>
        </div>
      </div>
    );
  }

  const metadata = rawMetadata || {};

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 space-y-6">
      {/* Session Info */}
      <section className="card p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info size={20} />
          Session Information
        </h2>
        <div className="space-y-3 text-sm">
          <MetadataRow label="Session ID" value={metadata.sessionId || config?.sessionId} mono />
          <MetadataRow label="Session File" value={metadata.sessionFile} mono small />
          {metadata.label && <MetadataRow label="Label" value={metadata.label} />}
          {metadata.updatedAt && (
            <MetadataRow
              label="Last Updated"
              value={`${formatDistanceToNow(new Date(metadata.updatedAt), { addSuffix: true })} (${new Date(metadata.updatedAt).toLocaleString()})`}
            />
          )}
          {metadata.chatType && <MetadataRow label="Chat Type" value={metadata.chatType} />}
          {metadata.verboseLevel && <MetadataRow label="Verbose Level" value={metadata.verboseLevel} />}
        </div>
      </section>

      {/* Model Configuration */}
      <section className="card p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap size={20} />
          Model Configuration
        </h2>
        <div className="space-y-3 text-sm">
          <MetadataRow label="Model" value={metadata.model || config?.model} />
          <MetadataRow label="Provider" value={metadata.modelProvider || config?.modelProvider} />
          <MetadataRow label="Context Tokens" value={metadata.contextTokens?.toLocaleString()} />
          {metadata.authProfileOverride && (
            <>
              <MetadataRow label="Auth Profile" value={metadata.authProfileOverride} />
              <MetadataRow label="Auth Source" value={metadata.authProfileOverrideSource} />
            </>
          )}
        </div>
      </section>

      {/* Token Usage */}
      {(metadata.inputTokens || metadata.outputTokens || metadata.totalTokens) && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database size={20} />
            Token Usage
          </h2>
          <div className="space-y-3 text-sm">
            {metadata.inputTokens !== undefined && (
              <MetadataRow label="Input Tokens" value={metadata.inputTokens.toLocaleString()} />
            )}
            {metadata.outputTokens !== undefined && (
              <MetadataRow label="Output Tokens" value={metadata.outputTokens.toLocaleString()} />
            )}
            {metadata.totalTokens !== undefined && (
              <MetadataRow label="Total Tokens" value={metadata.totalTokens.toLocaleString()} />
            )}
          </div>
        </section>
      )}

      {/* Delivery Context */}
      {metadata.deliveryContext && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe size={20} />
            Delivery Context
          </h2>
          <div className="space-y-3 text-sm">
            <MetadataRow label="Channel" value={metadata.deliveryContext.channel || metadata.channel} />
            <MetadataRow label="To" value={metadata.deliveryContext.to || metadata.lastTo} mono small />
            <MetadataRow label="Account ID" value={metadata.deliveryContext.accountId || metadata.lastAccountId} />
          </div>
        </section>
      )}

      {/* Origin */}
      {metadata.origin && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User size={20} />
            Origin
          </h2>
          <div className="space-y-3 text-sm">
            <MetadataRow label="Label" value={metadata.origin.label} />
            <MetadataRow label="Provider" value={metadata.origin.provider} />
            <MetadataRow label="From" value={metadata.origin.from} mono small />
            <MetadataRow label="To" value={metadata.origin.to} mono small />
            <MetadataRow label="Surface" value={metadata.origin.surface} />
            <MetadataRow label="Chat Type" value={metadata.origin.chatType} />
          </div>
        </section>
      )}

      {/* System Prompt Report */}
      {metadata.systemPromptReport && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} />
            System Prompt Report
          </h2>
          <div className="space-y-3 text-sm">
            <MetadataRow label="Generated At" value={new Date(metadata.systemPromptReport.generatedAt).toLocaleString()} />
            <MetadataRow label="Source" value={metadata.systemPromptReport.source} />
            <MetadataRow label="Workspace Dir" value={metadata.systemPromptReport.workspaceDir} mono small />
            <MetadataRow label="Bootstrap Max Chars" value={metadata.systemPromptReport.bootstrapMaxChars?.toLocaleString()} />

            {metadata.systemPromptReport.systemPrompt && (
              <>
                <div className="border-t pt-3 mt-3">
                  <div className="font-semibold text-gray-700 mb-2">System Prompt Stats</div>
                  <div className="ml-4 space-y-2">
                    <MetadataRow label="Total Chars" value={metadata.systemPromptReport.systemPrompt.chars?.toLocaleString()} />
                    <MetadataRow label="Project Context" value={metadata.systemPromptReport.systemPrompt.projectContextChars?.toLocaleString()} />
                    <MetadataRow label="Non-Project Context" value={metadata.systemPromptReport.systemPrompt.nonProjectContextChars?.toLocaleString()} />
                  </div>
                </div>
              </>
            )}

            {metadata.systemPromptReport.sandbox && (
              <>
                <div className="border-t pt-3 mt-3">
                  <div className="font-semibold text-gray-700 mb-2">Sandbox</div>
                  <div className="ml-4 space-y-2">
                    <MetadataRow label="Mode" value={metadata.systemPromptReport.sandbox.mode} />
                    <MetadataRow label="Sandboxed" value={metadata.systemPromptReport.sandbox.sandboxed ? 'Yes' : 'No'} />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Injected Workspace Files */}
      {metadata.systemPromptReport?.injectedWorkspaceFiles && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} />
            Injected Workspace Files ({metadata.systemPromptReport.injectedWorkspaceFiles.length})
          </h2>
          <div className="space-y-2">
            {metadata.systemPromptReport.injectedWorkspaceFiles.map((file: any, index: number) => (
              <details key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                <summary className="cursor-pointer font-mono text-sm font-semibold">
                  {file.name} {file.missing && <span className="text-red-500">(missing)</span>}
                </summary>
                <div className="mt-2 ml-4 space-y-1 text-xs text-gray-600">
                  <div>Path: <code className="bg-gray-100 px-1 py-0.5 rounded">{file.path}</code></div>
                  <div>Raw Chars: {file.rawChars.toLocaleString()}</div>
                  <div>Injected Chars: {file.injectedChars.toLocaleString()}</div>
                  <div>Truncated: {file.truncated ? 'Yes' : 'No'}</div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Skills Report */}
      {metadata.systemPromptReport?.skills && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={20} />
            Skills Report ({metadata.systemPromptReport.skills.entries?.length || 0})
          </h2>
          <div className="space-y-3 text-sm mb-3">
            <MetadataRow label="Prompt Chars" value={metadata.systemPromptReport.skills.promptChars?.toLocaleString()} />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {metadata.systemPromptReport.skills.entries?.map((skill: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 border rounded hover:bg-gray-50">
                <span className="font-mono font-semibold">{skill.name}</span>
                <span className="text-gray-500">{skill.blockChars} chars</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Raw JSON */}
      <details className="card p-4">
        <summary className="text-lg font-semibold cursor-pointer hover:text-gray-600">
          Raw Metadata (Click to expand)
        </summary>
        <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function MetadataRow({ label, value, mono = false, small = false }: { label: string; value?: string | number; mono?: boolean; small?: boolean }) {
  if (!value && value !== 0) return null;

  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-600 font-medium min-w-[140px]">{label}:</span>
      <span className={`text-gray-900 text-right flex-1 ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : ''} break-all`}>
        {value}
      </span>
    </div>
  );
}
