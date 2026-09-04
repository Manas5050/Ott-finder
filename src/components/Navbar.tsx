import React from 'react';
import { Search, Flame, Sparkles, Bookmark, Film, Tv } from 'lucide-react';

export type NavTab = 'search' | 'weekly' | 'recommendations' | 'watchlist';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('search')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">StreamFinder</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-white/80 to-emerald-500 text-neutral-950 font-mono">
                  INDIA 🇮🇳
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Real-Time OTT Availability & Direct Watch Links
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav id="nav-tabs" className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-search"
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search Movie</span>
            </button>

            <button
              id="tab-weekly"
              onClick={() => setActiveTab('weekly')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Top Releases</span>
              <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                This Week
              </span>
            </button>

            <button
              id="tab-recommendations"
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">For You</span>
            </button>

            <button
              id="tab-watchlist"
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'watchlist'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden md:inline">Watchlist</span>
              {watchlistCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-semibold flex items-center justify-center">
                  {watchlistCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
