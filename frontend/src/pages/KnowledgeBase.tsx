import React, { useState } from 'react';
import { BookOpen, Search, Upload, Plus, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { addonService } from '../services/api';

export const KnowledgeBase: React.FC = () => {
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;
    setIndexing(true);
    setStatusMessage('');
    try {
      const res = await addonService.indexKnowledge(docName, docContent);
      setStatusMessage(`Indexed ${res.chunks_count} chunks for "${docName}" successfully.`);
      setDocName('');
      setDocContent('');
    } catch (e) {
      console.error('Indexing failed', e);
      setStatusMessage('Failed indexing document.');
    } finally {
      setIndexing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await addonService.searchKnowledge(searchQuery);
      setSearchResults(res.matches || []);
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-black px-6 sm:px-8 py-5 sm:py-6 space-y-6 w-full font-sans transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <span>Knowledge Base &amp; Vector RAG</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
              pgvector / Semantic Index
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Index FAQ documents and policies to enable semantic retrieval during voice conversations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Document Indexing Form (Span 6) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
            <Upload size={16} className="text-purple-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Index Knowledge Document
            </h3>
          </div>

          <form onSubmit={handleIndex} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Document Title</label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Return Policy & Warranty Terms"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Content / FAQ Body</label>
              <textarea
                rows={6}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Paste customer policies, pricing tables, or troubleshooting instructions..."
                className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={indexing}
              className="w-full py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 text-xs font-semibold transition"
            >
              {indexing ? 'Splitting & Indexing...' : 'Index Document Chunks'}
            </button>
          </form>
        </div>

        {/* Semantic Search Test Bench (Span 6) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
              <Search size={16} className="text-blue-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                RAG Retrieval Sandbox
              </h3>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Test query: What is the refund policy?"
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                Search
              </button>
            </form>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-xs">
                  Enter a question above to test RAG semantic search results.
                </div>
              ) : (
                searchResults.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                      <span>{m.document_name}</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">Score: {m.score}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{m.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-400 font-mono">
            RAG context is automatically injected during active voice calls.
          </div>
        </div>
      </div>
    </div>
  );
};
