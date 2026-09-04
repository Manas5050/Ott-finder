import React, { useState } from 'react';
import { UserPreferences, RecommendationsResponse, RecommendationItem } from '../types';
import { PlatformBadge } from './PlatformBadge';
import { getPlatformMeta, getWatchUrl } from '../utils/platformHelpers';
import {
  Sparkles,
  SlidersHorizontal,
  Play,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Star,
  Tv,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Film,
} from 'lucide-react';
import { WatchlistItem } from '../utils/storage';

interface RecommendationsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onGenerateRecommendations: (prefs: UserPreferences) => void;
  data: RecommendationsResponse | null;
  isLoading: boolean;
  onSelectMovieForSearch: (title: string) => void;
  onToggleWatchlist: (item: WatchlistItem) => void;
  watchlist: WatchlistItem[];
}

const ALL_PLATFORMS = [
  { key: 'netflix', name: 'Netflix' },
  { key: 'prime', name: 'Prime Video' },
  { key: 'hotstar', name: 'Disney+ Hotstar' },
  { key: 'jiocinema', name: 'JioCinema' },
  { key: 'sonyliv', name: 'SonyLIV' },
  { key: 'zee5', name: 'ZEE5' },
  { key: 'appletv', name: 'Apple TV+' },
  { key: 'lionsgate', name: 'Lionsgate Play' },
  { key: 'aha', name: 'Aha' },
  { key: 'sunnxt', name: 'Sun NXT' },
];

const ALL_LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
  'Marathi',
  'Punjabi',
  'Korean',
];

const ALL_GENRES = [
  'Thriller',
  'Crime',
  'Action',
  'Mystery',
  'Comedy',
  'Sci-Fi',
  'Drama',
  'Romance',
  'Horror',
  'Documentary',
  'Anime',
];

const MOOD_PRESETS = [
  'Edge-of-the-seat thrillers',
  'Mind-bending sci-fi & twists',
  'Lighthearted weekend comedy',
  'Critically acclaimed Indian cinema gems',
  'Binge-worthy crime investigation series',
  'High-octane adrenaline action',
  'Feel-good heartwarming drama',
  'Dark & gritty psychological thriller',
];

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onGenerateRecommendations,
  data,
  isLoading,
  onSelectMovieForSearch,
  onToggleWatchlist,
  watchlist,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(!data || data.recommendations.length === 0);
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  const togglePlatform = (key: string) => {
    const updated = localPrefs.subscribedPlatforms.includes(key)
      ? localPrefs.subscribedPlatforms.filter((p) => p !== key)
      : [...localPrefs.subscribedPlatforms, key];
    const newPrefs = { ...localPrefs, subscribedPlatforms: updated };
    setLocalPrefs(newPrefs);
    onUpdatePreferences(newPrefs);
  };

  const toggleLanguage = (lang: string) => {
    const updated = localPrefs.preferredLanguages.includes(lang)
      ? localPrefs.preferredLanguages.filter((l) => l !== lang)
      : [...localPrefs.preferredLanguages, lang];
    const newPrefs = { ...localPrefs, preferredLanguages: updated };
    setLocalPrefs(newPrefs);
    onUpdatePreferences(newPrefs);
  };

  const toggleGenre = (genre: string) => {
    const updated = localPrefs.preferredGenres.includes(genre)
      ? localPrefs.preferredGenres.filter((g) => g !== genre)
      : [...localPrefs.preferredGenres, genre];
    const newPrefs = { ...localPrefs, preferredGenres: updated };
    setLocalPrefs(newPrefs);
    onUpdatePreferences(newPrefs);
  };

  const handleMoodSelect = (mood: string) => {
    const newPrefs = { ...localPrefs, mood };
    setLocalPrefs(newPrefs);
    onUpdatePreferences(newPrefs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateRecommendations(localPrefs);
    setIsFilterOpen(false);
  };

  const isSaved = (title: string) =>
    watchlist.some((w) => w.title.toLowerCase() === title.toLowerCase());

  return (
    <div id="recommendations-container" className="w-full max-w-6xl mx-auto mt-6 space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/70 via-neutral-900 to-neutral-900 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Personalized Streaming Recommendations
            </h2>
          </div>
          <p className="text-sm text-neutral-300 max-w-2xl">
            Real-time recommendations tuned strictly to your active OTT subscriptions in India, preferred languages, and current mood.
          </p>
        </div>

        <button
          id="toggle-filter-btn"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-sm font-medium transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span>{isFilterOpen ? 'Hide Preferences' : 'Customize Subscriptions & Taste'}</span>
          {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Preferences Configuration Box */}
      {isFilterOpen && (
        <form
          id="preferences-panel"
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-6 shadow-xl"
        >
          {/* Subscribed OTT Platforms */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-400" />
              1. Your Subscribed Streaming Services in India
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_PLATFORMS.map((p) => {
                const active = localPrefs.subscribedPlatforms.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePlatform(p.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-neutral-850 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-amber-400" />}
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
            {localPrefs.subscribedPlatforms.length === 0 && (
              <p className="text-xs text-rose-400">
                Please select at least one platform to get tailored recommendations!
              </p>
            )}
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              2. Preferred Languages (Audio / Dubs)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_LANGUAGES.map((lang) => {
                const active = localPrefs.preferredLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-neutral-850 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-cyan-400" />}
                    <span>{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Genres */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              3. Favorite Genres
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_GENRES.map((genre) => {
                const active = localPrefs.preferredGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      active
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-neutral-850 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-purple-400" />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Mood / Vibe */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              4. What is your mood today?
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {MOOD_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMoodSelect(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    localPrefs.mood === m
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                      : 'bg-neutral-850 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={localPrefs.mood}
              onChange={(e) => setLocalPrefs({ ...localPrefs, mood: e.target.value })}
              placeholder="Or type your specific mood or vibe (e.g., 'Smart crime thriller with no romantic subplots')..."
              className="w-full px-4 py-2.5 bg-neutral-950 text-white rounded-xl border border-neutral-800 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Custom Prompt Note */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">
              Optional Note (Recent movies you loved or disliked):
            </label>
            <input
              type="text"
              value={localPrefs.note || ''}
              onChange={(e) => setLocalPrefs({ ...localPrefs, note: e.target.value })}
              placeholder="e.g. Loved Maharaja, Manjummel Boys, and Tumbbad; looking for something equally captivating"
              className="w-full px-4 py-2 bg-neutral-950 text-white rounded-xl border border-neutral-800 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Generate Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              id="btn-generate-recommendations"
              type="submit"
              disabled={isLoading || localPrefs.subscribedPlatforms.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-rose-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Curating Real-Time Picks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Get My Recommendations</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Results View */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-neutral-200 font-semibold text-lg">
            Analyzing your subscribed streaming catalogues in India...
          </p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Matching {localPrefs.subscribedPlatforms.join(', ')} catalog for {localPrefs.mood} in{' '}
            {localPrefs.preferredLanguages.join(', ')}
          </p>
        </div>
      ) : data && data.recommendations.length > 0 ? (
        <div className="space-y-6">
          {/* Vibe Summary */}
          {data.vibeSummary && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-sm flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Curator&apos;s Note: </span>
                {data.vibeSummary}
              </div>
            </div>
          )}

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.recommendations.map((rec, idx) => {
              const saved = isSaved(rec.title);
              const meta = getPlatformMeta(rec.platformKey || rec.platform);
              const watchUrl = getWatchUrl(meta.key, rec.title, rec.watchUrl);

              return (
                <div
                  key={`${rec.id}-${idx}`}
                  id={`rec-card-${idx}`}
                  className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01]"
                >
                  <div>
                    {/* Top Row: Match Score & Platform */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={rec.platformKey || rec.platform} size="sm" />
                        {rec.year && (
                          <span className="text-xs text-neutral-400 font-medium">
                            {rec.year}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {rec.matchScore && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                            {rec.matchScore}% Match
                          </span>
                        )}

                        <button
                          onClick={() =>
                            onToggleWatchlist({
                              id: `${rec.title}-${rec.year || idx}`,
                              title: rec.title,
                              type: rec.type,
                              year: rec.year,
                              platform: rec.platform,
                              platformKey: meta.key,
                              watchUrl: watchUrl,
                              addedAt: new Date().toISOString(),
                              genres: rec.genres,
                              imdbRating: rec.imdbRating,
                              isWatched: false,
                            })
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            saved
                              ? 'bg-rose-950/60 border-rose-600/50 text-rose-400'
                              : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                          }`}
                          title={saved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        >
                          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectMovieForSearch(rec.title)}
                      className="text-xl font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors leading-snug"
                    >
                      {rec.title}
                    </h3>

                    {/* Ratings & Language */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-neutral-400">
                      {rec.imdbRating && (
                        <span className="flex items-center gap-1 font-semibold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {rec.imdbRating}
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-neutral-300 font-medium">{rec.language}</span>
                      {rec.genres && rec.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-neutral-400">{rec.genres.join(', ')}</span>
                        </>
                      )}
                    </div>

                    {/* Why this matches you */}
                    {rec.matchReason && (
                      <div className="mt-3 p-3 rounded-xl bg-neutral-850 border border-neutral-800 text-xs text-neutral-300">
                        <span className="font-semibold text-indigo-400">Why for you: </span>
                        <span>{rec.matchReason}</span>
                      </div>
                    )}

                    {/* Synopsis */}
                    <p className="text-xs sm:text-sm text-neutral-300 mt-3 leading-relaxed line-clamp-3">
                      {rec.synopsis}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-neutral-800 flex items-center gap-2">
                    <a
                      href={watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-neutral-950" />
                      <span>Stream on {rec.platform}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
                    </a>

                    <button
                      onClick={() => onSelectMovieForSearch(rec.title)}
                      className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors"
                    >
                      All OTTs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
