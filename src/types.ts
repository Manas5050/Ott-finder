export type AvailabilityType = 'subscription' | 'rent' | 'buy' | 'free' | 'upcoming';

export interface PlatformAvailability {
  platformName: string; // e.g., Netflix, Amazon Prime Video, Disney+ Hotstar, JioCinema, Zee5, SonyLIV, Apple TV, YouTube
  platformKey: string; // e.g., netflix, prime, hotstar, jiocinema, zee5, sonyliv, appletv, youtube, other
  type: AvailabilityType;
  priceOrPlan?: string; // e.g., "Included with Subscription", "₹120 Rent in HD", "Free with Ads"
  videoQuality?: string; // e.g., "4K UHD", "Dolby Atmos", "1080p Full HD"
  audioLanguages?: string[]; // e.g., ["Hindi", "English", "Tamil", "Telugu"]
  watchUrl: string; // Direct link or deep search link
  isDirectLink?: boolean;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface MovieSearchResult {
  query: string;
  found: boolean;
  title: string;
  originalTitle?: string;
  year?: string;
  type: 'movie' | 'series' | 'documentary';
  runtime?: string;
  imdbRating?: string;
  rottenTomatoes?: string;
  censorRating?: string; // e.g. U/A 16+, A, U
  synopsis: string;
  director?: string;
  cast?: string[];
  genres?: string[];
  originalLanguage?: string;
  availableLanguagesInIndia?: string[];
  subtitles?: string[];
  posterUrl?: string;
  backdropUrl?: string;
  theatricalStatus?: string; // e.g. "Already left theatres", "Currently in cinemas"
  ottReleaseStatus?: string; // e.g. "Streaming now", "Expected October 2024"
  platforms: PlatformAvailability[];
  sources: GroundingSource[];
  searchTimestamp: string;
  disclaimer?: string;
}

export interface WeeklyReleaseItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  platform: string;
  platformKey: string;
  releaseDate: string;
  genre: string[];
  language: string;
  availableAudio?: string[];
  synopsis: string;
  cast?: string[];
  watchUrl: string;
  posterUrl?: string;
  whyWatch?: string;
  seasonsCount?: string;
  rating?: string;
}

export interface WeeklyReleasesResponse {
  weekTitle: string;
  lastUpdated: string;
  topMovies: WeeklyReleaseItem[];
  topWebSeries: WeeklyReleaseItem[];
  sources: GroundingSource[];
}

export interface UserPreferences {
  subscribedPlatforms: string[]; // e.g. ['netflix', 'prime', 'hotstar', 'jiocinema', 'sonyliv', 'zee5']
  preferredLanguages: string[]; // e.g. ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam']
  preferredGenres: string[]; // e.g. ['Action', 'Thriller', 'Comedy', 'Sci-Fi']
  mood: string; // e.g. 'Mind-bending Mystery', 'High Adrenaline Action'
  note?: string; // custom prompt note
}

export interface RecommendationItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  platform: string;
  platformKey: string;
  year?: string;
  matchScore?: number; // 0-100%
  matchReason: string;
  synopsis: string;
  genres: string[];
  language: string;
  watchUrl: string;
  imdbRating?: string;
}

export interface RecommendationsResponse {
  vibeSummary: string;
  recommendations: RecommendationItem[];
  sources: GroundingSource[];
}
