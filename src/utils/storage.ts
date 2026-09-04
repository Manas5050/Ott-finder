import { UserPreferences } from '../types';

const WATCHLIST_KEY = 'streamfinder_india_watchlist';
const PREFERENCES_KEY = 'streamfinder_india_preferences';
const SEARCH_HISTORY_KEY = 'streamfinder_india_search_history';

export interface WatchlistItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  year?: string;
  platform: string;
  platformKey: string;
  watchUrl: string;
  addedAt: string;
  genres?: string[];
  imdbRating?: string;
  isWatched?: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  subscribedPlatforms: ['netflix', 'prime', 'hotstar', 'jiocinema'],
  preferredLanguages: ['Hindi', 'English', 'Tamil', 'Malayalam'],
  preferredGenres: ['Thriller', 'Action', 'Comedy', 'Crime'],
  mood: 'Edge-of-the-seat thrillers',
  note: '',
};

export function getStoredWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save watchlist to localStorage', e);
  }
}

export function getStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences to localStorage', e);
  }
}

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : ['Stree 2', 'Kalki 2898 AD', 'Maharaja', 'Manjummel Boys', 'Dune: Part Two'];
  } catch (e) {
    return ['Stree 2', 'Kalki 2898 AD', 'Maharaja', 'Manjummel Boys'];
  }
}

export function addSearchToHistory(query: string): string[] {
  try {
    const history = getSearchHistory().filter((q) => q.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...history].slice(0, 10);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}
