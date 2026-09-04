/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MovieSearchResult,
  WeeklyReleasesResponse,
  RecommendationsResponse,
  UserPreferences,
} from './types';
import {
  getStoredWatchlist,
  saveWatchlist,
  getStoredPreferences,
  savePreferences,
  WatchlistItem,
} from './utils/storage';
import { Navbar, NavTab } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { SearchResultCard } from './components/SearchResultCard';
import { WeeklyReleasesView } from './components/WeeklyReleasesView';
import { RecommendationsView } from './components/RecommendationsView';
import { WatchlistView } from './components/WatchlistView';
import {
  Flame,
  Sparkles,
  Tv,
  Film,
  Search,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Compass,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MovieSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Weekly releases state
  const [weeklyData, setWeeklyData] = useState<WeeklyReleasesResponse | null>(null);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

  // Recommendations state
  const [recommendationsData, setRecommendationsData] = useState<RecommendationsResponse | null>(null);
  const [isRecLoading, setIsRecLoading] = useState(false);

  // Preferences & Watchlist
  const [preferences, setPreferences] = useState<UserPreferences>(getStoredPreferences);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(getStoredWatchlist);

  // Load weekly releases on initial mount
  useEffect(() => {
    fetchWeeklyReleases(false);
  }, []);

  // Save watchlist when changed
  const handleToggleWatchlist = (item: WatchlistItem) => {
    const exists = watchlist.some((w) => w.title.toLowerCase() === item.title.toLowerCase());
    let updated: WatchlistItem[];
    if (exists) {
      updated = watchlist.filter((w) => w.title.toLowerCase() !== item.title.toLowerCase());
    } else {
      updated = [item, ...watchlist];
    }
    setWatchlist(updated);
    saveWatchlist(updated);
  };

  const handleRemoveWatchlistItem = (id: string) => {
    const updated = watchlist.filter((w) => w.id !== id);
    setWatchlist(updated);
    saveWatchlist(updated);
  };

  const handleToggleWatched = (id: string) => {
    const updated = watchlist.map((w) => (w.id === id ? { ...w, isWatched: !w.isWatched } : w));
    setWatchlist(updated);
    saveWatchlist(updated);
  };

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Perform Movie Search
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setIsSearching(true);
    setSearchError(null);
    setActiveTab('search');

    try {
      const res = await fetch('/api/search-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `Search failed with status ${res.status}`);
      }

      const data: MovieSearchResult = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      console.error('Search request failed:', err);
      setSearchError(err.message || 'Failed to search streaming availability. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch weekly releases
  const fetchWeeklyReleases = async (forceRefresh = false) => {
    setIsWeeklyLoading(true);
    try {
      const res = await fetch(`/api/weekly-releases${forceRefresh ? '?refresh=true' : ''}`);
      if (!res.ok) {
        throw new Error(`Weekly releases request failed with status ${res.status}`);
      }
      const data: WeeklyReleasesResponse = await res.json();
      setWeeklyData(data);
    } catch (err) {
      console.error('Failed to load weekly releases:', err);
    } finally {
      setIsWeeklyLoading(false);
    }
  };

  // Generate personalized recommendations
  const handleGenerateRecommendations = async (prefs: UserPreferences) => {
    setIsRecLoading(true);
    try {
      const res = await fetch('/api/personalized-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Recommendations failed with status ${res.status}`);
      }

      const data: RecommendationsResponse = await res.json();
      setRecommendationsData(data);
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    } finally {
      setIsRecLoading(false);
    }
  };

  // Select a movie from anywhere to search
  const handleSelectMovieForSearch = (title: string) => {
    handleSearch(title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCurrentMovieInWatchlist = searchResult
    ? watchlist.some((w) => w.title.toLowerCase() === searchResult.title.toLowerCase())
    : false;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="space-y-8">
            {/* Hero Heading when no search done yet */}
            {!searchResult && !isSearching && (
              <div className="text-center max-w-3xl mx-auto pt-6 pb-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                  <Tv className="w-3.5 h-3.5" />
                  <span>Real-Time India Streaming Search</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Where to Watch Any Movie in <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">India</span>
                </h1>
                <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto">
                  Instant real-time search across Netflix, Prime Video, Disney+ Hotstar, JioCinema, SonyLIV, and ZEE5 with verified 1-click watch links.
                </p>
              </div>
            )}

            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
              initialQuery={searchQuery}
            />

            {/* Search Error Notice */}
            {searchError && (
              <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <p>{searchError}</p>
              </div>
            )}

            {/* Search Result Display */}
            {searchResult && !isSearching && (
              <SearchResultCard
                result={searchResult}
                onToggleWatchlist={handleToggleWatchlist}
                isSavedInWatchlist={isCurrentMovieInWatchlist}
              />
            )}

            {/* Quick Teaser for Weekly Releases & Recommendations if currently resting on empty search */}
            {!searchResult && !isSearching && (
              <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Weekly Releases Card Banner */}
                <div
                  onClick={() => setActiveTab('weekly')}
                  className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 via-neutral-900 to-neutral-900 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Flame className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        NEW ARRIVALS
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                      Top 10 Movies & Series Released This Week
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2">
                      Check out what just dropped in India across Netflix, Prime Video, Hotstar, and JioCinema this week.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-400">
                    <span>Explore this week&apos;s chart</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Personalized Recommendations Banner */}
                <div
                  onClick={() => setActiveTab('recommendations')}
                  className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-neutral-900 to-neutral-900 border border-indigo-500/30 hover:border-indigo-500/60 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        TAILORED PICKS
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      Personalized OTT Recommendations
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-2">
                      Tell us what platforms you subscribe to and what you feel like watching; we will find your next favorite.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-400">
                    <span>Set your taste & subscriptions</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WEEKLY RELEASES TAB */}
        {activeTab === 'weekly' && (
          <WeeklyReleasesView
            data={weeklyData}
            isLoading={isWeeklyLoading}
            onRefresh={() => fetchWeeklyReleases(true)}
            onSelectMovieForSearch={handleSelectMovieForSearch}
            onToggleWatchlist={handleToggleWatchlist}
            watchlist={watchlist}
          />
        )}

        {/* PERSONALIZED RECOMMENDATIONS TAB */}
        {activeTab === 'recommendations' && (
          <RecommendationsView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onGenerateRecommendations={handleGenerateRecommendations}
            data={recommendationsData}
            isLoading={isRecLoading}
            onSelectMovieForSearch={handleSelectMovieForSearch}
            onToggleWatchlist={handleToggleWatchlist}
            watchlist={watchlist}
          />
        )}

        {/* WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <WatchlistView
            watchlist={watchlist}
            onRemoveItem={handleRemoveWatchlistItem}
            onToggleWatched={handleToggleWatched}
            onSelectMovieForSearch={handleSelectMovieForSearch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-neutral-900 bg-neutral-950/60 py-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">OTT StreamFinder India</span>
            <span>•</span>
            <span>Real-time availability powered by Google Search</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Netflix</span>
            <span>Prime Video</span>
            <span>Disney+ Hotstar</span>
            <span>JioCinema</span>
            <span>SonyLIV</span>
            <span>ZEE5</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
