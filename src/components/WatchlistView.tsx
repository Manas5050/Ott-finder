import React, { useState } from 'react';
import { WatchlistItem } from '../utils/storage';
import { PlatformBadge } from './PlatformBadge';
import {
  Bookmark,
  Play,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Circle,
  Star,
  Film,
  Tv,
  Filter,
} from 'lucide-react';

interface WatchlistViewProps {
  watchlist: WatchlistItem[];
  onRemoveItem: (id: string) => void;
  onToggleWatched: (id: string) => void;
  onSelectMovieForSearch: (title: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  onRemoveItem,
  onToggleWatched,
  onSelectMovieForSearch,
}) => {
  const [filter, setFilter] = useState<'all' | 'to-watch' | 'watched'>('all');

  const filteredItems = watchlist.filter((item) => {
    if (filter === 'to-watch') return !item.isWatched;
    if (filter === 'watched') return item.isWatched;
    return true;
  });

  return (
    <div id="watchlist-container" className="w-full max-w-5xl mx-auto mt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Bookmark className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              My Watchlist ({watchlist.length})
            </h2>
          </div>
          <p className="text-sm text-neutral-400">
            Keep track of movies and shows with direct links to play them anytime.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({watchlist.length})
          </button>
          <button
            onClick={() => setFilter('to-watch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'to-watch'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            To Watch ({watchlist.filter((i) => !i.isWatched).length})
          </button>
          <button
            onClick={() => setFilter('watched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'watched'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Watched ({watchlist.filter((i) => i.isWatched).length})
          </button>
        </div>
      </div>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center mx-auto text-neutral-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Your watchlist is empty</h3>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto">
            Search for any movie or explore weekly releases to save titles you want to stream.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                item.isWatched
                  ? 'bg-neutral-900/50 border-neutral-800/60 opacity-75'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-md'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <PlatformBadge platform={item.platformKey || item.platform} size="sm" />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleWatched(item.id)}
                      className="p-1 text-neutral-400 hover:text-emerald-400 transition-colors"
                      title={item.isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                    >
                      {item.isWatched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4
                  onClick={() => onSelectMovieForSearch(item.title)}
                  className={`text-lg font-bold text-white hover:text-amber-400 cursor-pointer transition-colors leading-snug line-clamp-2 ${
                    item.isWatched ? 'line-through text-neutral-400' : ''
                  }`}
                >
                  {item.title}
                </h4>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-neutral-400">
                  {item.year && <span>{item.year}</span>}
                  {item.imdbRating && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {item.imdbRating}
                    </span>
                  )}
                  {item.genres && item.genres.length > 0 && (
                    <span className="text-neutral-400">• {item.genres.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              </div>

              {/* Direct Link */}
              <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center gap-2">
                <a
                  href={item.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-neutral-950" />
                  <span>Watch on {item.platform}</span>
                  <ExternalLink className="w-3 h-3 text-neutral-600" />
                </a>

                <button
                  onClick={() => onSelectMovieForSearch(item.title)}
                  className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                  title="Search streaming options"
                >
                  Search
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
