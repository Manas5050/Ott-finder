import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Sparkles, Clock } from 'lucide-react';
import { getSearchHistory, addSearchToHistory } from '../utils/storage';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

const POPULAR_SUGGESTIONS = [
  'Stree 2',
  'Kalki 2898 AD',
  'Maharaja',
  'Manjummel Boys',
  'Dune: Part Two',
  'Amar Singh Chamkila',
  'Panchayat S3',
  'Sector 36',
  'Aavesham',
  'Kill',
  '12th Fail',
  'Oppenheimer',
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    const trimmed = query.trim();
    const updated = addSearchToHistory(trimmed);
    setHistory(updated);
    onSearch(trimmed);
  };

  const handleSuggestionClick = (title: string) => {
    setQuery(title);
    const updated = addSearchToHistory(title);
    setHistory(updated);
    onSearch(title);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div id="search-section" className="w-full max-w-3xl mx-auto">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-amber-400 transition-colors">
          <Search className="w-5 h-5" />
        </div>

        <input
          id="movie-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any movie or web series (e.g., Stree 2, Dune 2, Maharaja, Panchayat)..."
          className="w-full pl-12 pr-28 py-4 bg-neutral-900/90 hover:bg-neutral-900 text-white placeholder-neutral-400 text-base sm:text-lg rounded-2xl border border-neutral-700/80 focus:border-amber-500/70 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-xl shadow-black/40 transition-all duration-200"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            id="search-submit-btn"
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl shadow-md transition-all duration-150 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Searching...</span>
              </>
            ) : (
              <>
                <span>Find OTT</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Popular Trending Suggestions */}
      <div id="popular-suggestions" className="mt-3 flex items-center gap-2 flex-wrap text-xs text-neutral-400">
        <span className="flex items-center gap-1 text-neutral-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Trending in India:
        </span>
        {POPULAR_SUGGESTIONS.slice(0, 7).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleSuggestionClick(item)}
            className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Recent Searches */}
      {history.length > 0 && (
        <div id="search-history" className="mt-2 flex items-center gap-1.5 flex-wrap text-xs text-neutral-400">
          <span className="flex items-center gap-1 text-neutral-400">
            <Clock className="w-3 h-3" />
            Recent:
          </span>
          {history.slice(0, 5).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSuggestionClick(item)}
              className="px-2 py-0.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
