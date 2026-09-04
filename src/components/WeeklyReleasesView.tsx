import React, { useState } from 'react';
import { WeeklyReleasesResponse, WeeklyReleaseItem } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { getPlatformMeta, getWatchUrl } from '../utils/platformHelpers';
import {
  Flame,
  Film,
  Tv,
  Play,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Star,
  Calendar,
  Sparkles,
  Globe,
  Loader2,
} from 'lucide-react';
import { WatchlistItem } from '../utils/storage';

interface WeeklyReleasesViewProps {
  data: WeeklyReleasesResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectMovieForSearch: (title: string) => void;
  onToggleWatchlist: (item: WatchlistItem) => void;
  watchlist: WatchlistItem[];
}

export const WeeklyReleasesView: React.FC<WeeklyReleasesViewProps> = ({
  data,
  isLoading,
  onRefresh,
  onSelectMovieForSearch,
  onToggleWatchlist,
  watchlist,
}) => {
  const [filter, setFilter] = useState<'all' | 'movies' | 'series'>('movies');

  const movies = data?.topMovies || [];
  const series = data?.topWebSeries || [];

  const displayedItems: Array<{ item: WeeklyReleaseItem; rank: number }> =
    filter === 'movies'
      ? movies.map((m, idx) => ({ item: m, rank: idx + 1 }))
      : filter === 'series'
      ? series.map((s, idx) => ({ item: s, rank: idx + 1 }))
      : [
          ...movies.slice(0, 10).map((m, idx) => ({ item: m, rank: idx + 1 })),
          ...series.slice(0, 10).map((s, idx) => ({ item: s, rank: idx + 1 })),
        ];

  const isSaved = (title: string) =>
    watchlist.some((w) => w.title.toLowerCase() === title.toLowerCase());

  return (
    <div id="weekly-releases-container" className="w-full max-w-6xl mx-auto mt-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-neutral-900/80 border border-neutral-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Top Releases This Week on OTT
            </h2>
          </div>
          <p className="text-sm text-neutral-400">
            Freshly dropped movies and web series across Netflix, Prime, Hotstar, JioCinema, SonyLIV & ZEE5 in India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data?.lastUpdated && (
            <span className="text-xs text-neutral-400 font-mono hidden md:inline">
              Updated: {data.lastUpdated}
            </span>
          )}

          <button
            id="btn-refresh-weekly"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Fetch latest releases"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Checking Web...' : 'Refresh Live'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Top 10 Movies vs Top 10 Series */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            id="filter-movies"
            onClick={() => setFilter('movies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === 'movies'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Top 10 Movies ({movies.length})</span>
          </button>

          <button
            id="filter-series"
            onClick={() => setFilter('series')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === 'series'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Top 10 Web Series ({series.length})</span>
          </button>

          <button
            id="filter-all"
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>All ({movies.length + series.length})</span>
          </button>
        </div>

        <span className="text-xs text-neutral-400 flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Click any title to inspect full streaming specs
        </span>
      </div>

      {/* Loading Skeleton or Cards Grid */}
      {isLoading && (!data || displayedItems.length === 0) ? (
        <div className="py-20 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-neutral-300 font-medium">
            Searching the web for this week&apos;s latest OTT releases in India...
          </p>
          <p className="text-xs text-neutral-400">
            Checking Netflix, Prime Video, Hotstar, JioCinema, SonyLIV, ZEE5
          </p>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="py-16 text-center bg-neutral-900/60 rounded-2xl border border-neutral-800 p-6">
          <p className="text-neutral-400">No releases loaded yet. Click &quot;Refresh Live&quot; to fetch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {displayedItems.map(({ item, rank }, idx) => {
            const saved = isSaved(item.title);
            const meta = getPlatformMeta(item.platformKey || item.platform);
            const watchUrl = getWatchUrl(meta.key, item.title, item.watchUrl);

            return (
              <div
                key={`${item.id}-${idx}`}
                id={`release-card-${idx}`}
                className="group relative bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-black/60"
              >
                <div>
                  {/* Top Row: Rank & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          rank === 1
                            ? 'bg-amber-400 text-neutral-950 shadow-sm shadow-amber-400/40'
                            : rank === 2
                            ? 'bg-neutral-300 text-neutral-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        #{rank}
                      </span>

                      <PlatformBadge platform={item.platformKey || item.platform} size="sm" />

                      {item.seasonsCount && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                          {item.seasonsCount}
                        </span>
                      )}
                    </div>

                    {/* Release Date */}
                    {item.releaseDate && (
                      <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {item.releaseDate}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      onClick={() => onSelectMovieForSearch(item.title)}
                      className="text-lg sm:text-xl font-bold text-white hover:text-amber-400 cursor-pointer transition-colors leading-snug"
                    >
                      {item.title}
                    </h3>

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() =>
                        onToggleWatchlist({
                          id: `${item.title}-${item.releaseDate}`,
                          title: item.title,
                          type: item.type,
                          platform: item.platform,
                          platformKey: meta.key,
                          watchUrl: watchUrl,
                          addedAt: new Date().toISOString(),
                          genres: item.genre,
                          imdbRating: item.rating,
                          isWatched: false,
                        })
                      }
                      className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                        saved
                          ? 'bg-rose-950/60 border-rose-600/50 text-rose-400'
                          : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                      title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Language and Genres */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-neutral-400">
                    {item.language && (
                      <span className="font-semibold text-neutral-300">{item.language}</span>
                    )}
                    {item.rating && (
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {item.rating}
                      </span>
                    )}
                    {item.genre && item.genre.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>•</span>
                        {item.genre.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Synopsis */}
                  <p className="text-xs sm:text-sm text-neutral-300 mt-3 line-clamp-2 leading-relaxed">
                    {item.synopsis}
                  </p>

                  {/* Why Watch Note */}
                  {item.whyWatch && (
                    <div className="mt-3 p-2.5 rounded-xl bg-neutral-850/90 border border-neutral-800/90 text-xs text-neutral-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="italic leading-snug">{item.whyWatch}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center gap-2">
                  <a
                    id={`watch-now-${rank}`}
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-neutral-950" />
                    <span>Watch on {item.platform}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-600" />
                  </a>

                  <button
                    onClick={() => onSelectMovieForSearch(item.title)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700/80 transition-colors"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sources Citation */}
      {data?.sources && data.sources.length > 0 && (
        <div className="pt-4 border-t border-neutral-800 flex items-center gap-2 flex-wrap text-xs text-neutral-400">
          <Globe className="w-3.5 h-3.5 text-neutral-400" />
          <span>Verified from Google Search real-time web sources:</span>
          {data.sources.slice(0, 5).map((s, idx) => (
            <a
              key={idx}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-200 underline truncate max-w-xs"
            >
              {s.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
