import React, { useState } from 'react';
import { MovieSearchResult, PlatformAvailability } from '../types';
import { getPlatformMeta, getWatchUrl } from '../utils/platformHelpers';
import {
  Play,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Star,
  Clock,
  Globe,
  Film,
  Users,
  ShieldCheck,
  Share2,
  Check,
  Tv,
  AlertCircle,
} from 'lucide-react';
import { WatchlistItem } from '../utils/storage';

interface SearchResultCardProps {
  result: MovieSearchResult;
  onToggleWatchlist: (item: WatchlistItem) => void;
  isSavedInWatchlist: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onToggleWatchlist,
  isSavedInWatchlist,
}) => {
  const [copied, setCopied] = useState(false);

  if (!result.found) {
    return (
      <div id="no-result-card" className="w-full max-w-3xl mx-auto mt-8 p-8 bg-neutral-900/80 border border-neutral-800 rounded-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Title Not Found</h3>
        <p className="text-neutral-400 max-w-md mx-auto mb-4">
          We couldn't find real-time streaming availability for &quot;{result.query}&quot; in India. Please check the spelling or try searching with the release year.
        </p>
      </div>
    );
  }

  const handleShare = () => {
    const text = `Check out where to stream "${result.title}" in India on OTT!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryPlatform = result.platforms && result.platforms.length > 0 ? result.platforms[0] : null;

  const handleWatchlistClick = () => {
    const primary = primaryPlatform || {
      platformName: 'Theatrical/TBD',
      platformKey: 'other',
      watchUrl: '',
    };
    const watchUrl = getWatchUrl(primary.platformKey, result.title, primary.watchUrl);

    onToggleWatchlist({
      id: `${result.title}-${result.year || 'latest'}`,
      title: result.title,
      type: result.type === 'series' ? 'series' : 'movie',
      year: result.year,
      platform: primary.platformName,
      platformKey: primary.platformKey,
      watchUrl: watchUrl,
      addedAt: new Date().toISOString(),
      genres: result.genres,
      imdbRating: result.imdbRating,
      isWatched: false,
    });
  };

  return (
    <div id="movie-result-card" className="w-full max-w-4xl mx-auto mt-6 bg-neutral-900/90 border border-neutral-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Header Banner */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-b from-neutral-850 to-neutral-900 border-b border-neutral-800">
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex-1">
            {/* Type & Certification Pills */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wide">
                {result.type}
              </span>

              {result.year && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {result.year}
                </span>
              )}

              {result.censorRating && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {result.censorRating}
                </span>
              )}

              {result.runtime && (
                <span className="flex items-center gap-1 text-xs text-neutral-400 ml-1">
                  <Clock className="w-3.5 h-3.5" />
                  {result.runtime}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {result.title}
            </h1>
            {result.originalTitle && result.originalTitle !== result.title && (
              <p className="text-sm text-neutral-400 mt-0.5">Original Title: {result.originalTitle}</p>
            )}

            {/* Ratings & Genres */}
            <div className="flex items-center gap-3 mt-3 flex-wrap text-sm">
              {result.imdbRating && result.imdbRating !== 'N/A' && (
                <div className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/30">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{result.imdbRating}</span>
                </div>
              )}

              {result.rottenTomatoes && result.rottenTomatoes !== 'N/A' && (
                <div className="flex items-center gap-1 font-semibold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-500/30">
                  <span>🍅 {result.rottenTomatoes}</span>
                </div>
              )}

              {result.genres && result.genres.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {result.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full text-xs bg-neutral-800/80 text-neutral-300 border border-neutral-700/60"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto justify-end">
            <button
              id="btn-bookmark"
              onClick={handleWatchlistClick}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                isSavedInWatchlist
                  ? 'bg-rose-950/50 border-rose-600/50 text-rose-300 hover:bg-rose-900/50'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750 hover:text-white'
              }`}
            >
              {isSavedInWatchlist ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-rose-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Watchlist</span>
                </>
              )}
            </button>

            <button
              id="btn-share"
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-750 transition-colors"
              title="Share Title"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* OTT Streaming Availability Section (Highest Priority) */}
        <section id="streaming-availability-section">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Where to Watch in India
              </h2>
            </div>
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Real-Time Verified
            </span>
          </div>

          {result.platforms && result.platforms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.platforms.map((platform, idx) => {
                const meta = getPlatformMeta(platform.platformKey || platform.platformName);
                const finalWatchUrl = getWatchUrl(meta.key, result.title, platform.watchUrl);

                return (
                  <div
                    key={`${platform.platformName}-${idx}`}
                    id={`platform-card-${meta.key}`}
                    className={`p-5 rounded-xl border ${meta.bgColor} ${meta.borderColor} flex flex-col justify-between transition-all hover:scale-[1.01] shadow-lg`}
                  >
                    <div>
                      {/* Platform header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                          <h3 className="font-bold text-base sm:text-lg text-white">
                            {platform.platformName}
                          </h3>
                        </div>

                        {/* Availability Type Badge */}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            platform.type === 'subscription'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                              : platform.type === 'free'
                              ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {platform.type}
                        </span>
                      </div>

                      {/* Pricing or Plan */}
                      {platform.priceOrPlan && (
                        <p className="text-xs text-neutral-300 font-medium mb-2">
                          {platform.priceOrPlan}
                        </p>
                      )}

                      {/* Quality & Audio Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-4">
                        {platform.videoQuality && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900/80 text-neutral-300 border border-neutral-700/60 font-mono">
                            {platform.videoQuality}
                          </span>
                        )}
                        {platform.audioLanguages && platform.audioLanguages.length > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900/80 text-neutral-300 border border-neutral-700/60 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-neutral-400" />
                            {platform.audioLanguages.slice(0, 3).join(', ')}
                            {platform.audioLanguages.length > 3 && ` +${platform.audioLanguages.length - 3}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DIRECT WATCH BUTTON */}
                    <a
                      id={`watch-btn-${meta.key}`}
                      href={finalWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors group"
                    >
                      <Play className="w-4 h-4 fill-neutral-950 text-neutral-950 group-hover:scale-110 transition-transform" />
                      <span>Watch on {platform.platformName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-600 ml-auto" />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-neutral-850/80 border border-neutral-800 text-neutral-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Not Currently Available on Indian OTT</h4>
                  <p className="text-sm text-neutral-400 mt-1">
                    {result.ottReleaseStatus ||
                      'This title has not yet arrived on major streaming platforms in India.'}
                  </p>
                  {result.theatricalStatus && (
                    <p className="text-xs text-amber-400/90 mt-2 font-medium">
                      Theatrical Status: {result.theatricalStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Synopsis & Story */}
        <section id="synopsis-section" className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Overview
          </h3>
          <p className="text-neutral-200 text-sm sm:text-base leading-relaxed">
            {result.synopsis}
          </p>
        </section>

        {/* Cast, Crew, Languages Grid */}
        <section id="details-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-neutral-800 text-sm">
          {result.director && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Director
              </span>
              <p className="text-white font-medium">{result.director}</p>
            </div>
          )}

          {result.cast && result.cast.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Starring Cast
              </span>
              <p className="text-neutral-200">{result.cast.join(', ')}</p>
            </div>
          )}

          {result.availableLanguagesInIndia && result.availableLanguagesInIndia.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Audio Languages (India)
              </span>
              <p className="text-neutral-200">
                {result.availableLanguagesInIndia.join(', ')}
              </p>
            </div>
          )}

          {result.subtitles && result.subtitles.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Subtitles
              </span>
              <p className="text-neutral-200">{result.subtitles.join(', ')}</p>
            </div>
          )}

          {result.theatricalStatus && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Theatrical Status
              </span>
              <p className="text-neutral-200">{result.theatricalStatus}</p>
            </div>
          )}

          {result.ottReleaseStatus && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                OTT Status (India)
              </span>
              <p className="text-amber-400 font-medium">{result.ottReleaseStatus}</p>
            </div>
          )}
        </section>

        {/* Real-Time Grounding Verification Sources */}
        {result.sources && result.sources.length > 0 && (
          <section id="sources-section" className="pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400 font-medium">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <span>Real-time live search sources:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {result.sources.map((source, sIdx) => (
                <a
                  key={sIdx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/50 transition-colors truncate max-w-xs"
                >
                  <span className="truncate">{source.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 text-neutral-400" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
