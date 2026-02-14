import React, { useState, useEffect } from 'react';
import type { SessionMetadata, TimelineItem } from './types/session';
import { createSessionMetadata, buildTimeline } from './utils/sessionParser';
import { SessionList } from './components/SessionList';
import { Timeline } from './components/Timeline';
import { Inspector } from './components/Inspector';
import { FolderOpen, Search, RefreshCw, Upload, ChevronUp, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:3001';

function App() {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionDir, setSessionDir] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(10);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [allSessionsInfo, setAllSessionsInfo] = useState<any[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Load sessions from API
  const loadSessionsFromAPI = async (resetCount = true) => {
    setLoading(true);
    setError('');
    try {
      // Get directory info
      const infoRes = await fetch(`${API_URL}/api/info`);
      const info = await infoRes.json();
      setSessionDir(info.sessionDir);

      if (!info.exists) {
        setError(`Session directory not found: ${info.sessionDir}`);
        setLoading(false);
        return;
      }

      // Get session list
      const sessionsRes = await fetch(`${API_URL}/api/sessions`);
      const data = await sessionsRes.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Store all session info
      setAllSessionsInfo(data.sessions);
      setTotalAvailable(data.total || data.sessions.length);

      // Reset display count on reload
      if (resetCount) {
        setDisplayCount(10);
      }

      // Load first displayCount sessions (sorted by modifiedAt on server)
      const count = resetCount ? 10 : displayCount;
      const sessionsToLoad = data.sessions.slice(0, count);
      const loadedSessions: SessionMetadata[] = [];

      for (const sessionInfo of sessionsToLoad) {
        try {
          const contentRes = await fetch(`${API_URL}/api/sessions/${sessionInfo.id}`);
          const { content } = await contentRes.json();

          // Use full path instead of just filename
          const metadata = createSessionMetadata(sessionInfo.id, sessionInfo.path, content);

          // Try to load config
          try {
            const configRes = await fetch(`${API_URL}/api/sessions/${sessionInfo.id}/config`);
            if (configRes.ok) {
              const config = await configRes.json();
              metadata.config = config;
            }
          } catch (configErr) {
            console.warn(`Failed to load config for ${sessionInfo.id}:`, configErr);
          }

          loadedSessions.push(metadata);
        } catch (err) {
          console.error(`Failed to load session ${sessionInfo.id}:`, err);
        }
      }

      // Sort by modifiedAt (descending) to match server order
      loadedSessions.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
      setSessions(loadedSessions);

      // Auto-select first session
      if (loadedSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(loadedSessions[0].id);
      }
    } catch (err: any) {
      setError(`Failed to connect to API: ${err.message}. Make sure the API server is running on port 3001.`);
    } finally {
      setLoading(false);
    }
  };

  // Load more sessions
  const loadMoreSessions = async () => {
    if (loading || sessions.length >= totalAvailable) return;

    setLoading(true);
    try {
      const newCount = displayCount + 10;
      const sessionsToLoad = allSessionsInfo.slice(sessions.length, newCount);
      const newSessions: SessionMetadata[] = [];

      for (const sessionInfo of sessionsToLoad) {
        try {
          const contentRes = await fetch(`${API_URL}/api/sessions/${sessionInfo.id}`);
          const { content } = await contentRes.json();
          const metadata = createSessionMetadata(sessionInfo.id, sessionInfo.path, content);

          // Try to load config
          try {
            const configRes = await fetch(`${API_URL}/api/sessions/${sessionInfo.id}/config`);
            if (configRes.ok) {
              const config = await configRes.json();
              metadata.config = config;
            }
          } catch (configErr) {
            console.warn(`Failed to load config for ${sessionInfo.id}:`, configErr);
          }

          newSessions.push(metadata);
        } catch (err) {
          console.error(`Failed to load session ${sessionInfo.id}:`, err);
        }
      }

      // Append and re-sort by modifiedAt
      const allLoaded = [...sessions, ...newSessions];
      allLoaded.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
      setSessions(allLoaded);
      setDisplayCount(newCount);
    } catch (err: any) {
      setError(`Failed to load more sessions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load sessions on mount
  useEffect(() => {
    loadSessionsFromAPI();
  }, []);

  // Handle manual file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    const newSessions: SessionMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith('.jsonl')) continue;

      try {
        const content = await file.text();
        const sessionId = file.name.replace('.jsonl', '');
        const metadata = createSessionMetadata(sessionId, file.name, content);
        newSessions.push(metadata);
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
      }
    }

    setSessions(prev => [...prev, ...newSessions]);
    setLoading(false);

    // Auto-select first session if none selected
    if (!selectedSessionId && newSessions.length > 0) {
      setSelectedSessionId(newSessions[0].id);
    }
  };

  // Update timeline when session is selected
  useEffect(() => {
    if (selectedSession) {
      const items = buildTimeline(selectedSession.records);
      setTimelineItems(items);
    } else {
      setTimelineItems([]);
    }
  }, [selectedSession]);

  // Search logic - find all matching items
  const searchMatches = React.useMemo(() => {
    if (!searchQuery) {
      setMatchedIndices([]);
      setCurrentMatchIndex(-1);
      return timelineItems;
    }

    const query = searchQuery.toLowerCase();
    const matches: number[] = [];

    timelineItems.forEach((item, index) => {
      // Search in multiple fields
      const searchableText = [
        item.type,
        typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        item.id,
      ].join(' ').toLowerCase();

      if (searchableText.includes(query)) {
        matches.push(index);
      }
    });

    return matches;
  }, [timelineItems, searchQuery]);

  // Update matched indices when search results change
  React.useEffect(() => {
    if (searchMatches.length > 0) {
      setMatchedIndices(searchMatches);
      // Default to last match
      setCurrentMatchIndex(searchMatches.length - 1);
    } else {
      setMatchedIndices([]);
      setCurrentMatchIndex(-1);
    }
  }, [searchMatches]);

  // Navigate to previous match
  const goToPrevMatch = () => {
    if (matchedIndices.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const newIndex = prev <= 0 ? matchedIndices.length - 1 : prev - 1;
      return newIndex;
    });
  };

  // Navigate to next match
  const goToNextMatch = () => {
    if (matchedIndices.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const newIndex = prev >= matchedIndices.length - 1 ? 0 : prev + 1;
      return newIndex;
    });
  };

  // Trigger search
  const executeSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  // Handle Enter key in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      setSearchInput('');
      setSearchQuery('');
    }
  };

  const filteredItems = timelineItems;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OpenClaw Session Visualizer</h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedSession ? (
                <span>📄 <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{selectedSession.path}</code></span>
              ) : sessionDir ? (
                <span>📂 <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{sessionDir}</code></span>
              ) : (
                'Loading session directory...'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadSessionsFromAPI(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>Reload</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              <Upload size={18} />
              <span>Upload</span>
              <input
                type="file"
                multiple
                accept=".jsonl"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Session List */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Sessions</h2>
            <div className="text-xs text-gray-500">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} loaded
            </div>
          </div>

          <SessionList
            sessions={sessions}
            selectedId={selectedSessionId}
            onSelect={setSelectedSessionId}
            onLoadMore={loadMoreSessions}
            hasMore={sessions.length < totalAvailable}
            loading={loading}
          />
        </aside>

        {/* Center - Timeline */}
        <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
          {selectedSession && (
            <>
              {/* Search Bar */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search in timeline... (Press Enter to search)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchInput && (
                      <button
                        onClick={() => {
                          setSearchInput('');
                          setSearchQuery('');
                        }}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Clear (Esc)"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    onClick={executeSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Search
                  </button>

                  {matchedIndices.length > 0 && (
                    <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {currentMatchIndex + 1} / {matchedIndices.length}
                      </span>
                      <button
                        onClick={goToPrevMatch}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Previous match"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={goToNextMatch}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Next match"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <Timeline
                  items={filteredItems}
                  highlightIndex={matchedIndices.length > 0 ? matchedIndices[currentMatchIndex] : -1}
                />
              </div>
            </>
          )}

          {!selectedSession && !loading && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No session selected</p>
                <p className="text-sm mt-2">
                  {sessions.length > 0 ? 'Select a session from the list' : 'Click "Reload" to load sessions'}
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading sessions...</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Inspector */}
        <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Inspector</h2>
          </div>
          <Inspector stats={selectedSession?.stats || null} config={selectedSession?.config || null} />
        </aside>
      </div>
    </div>
  );
}

export default App;
