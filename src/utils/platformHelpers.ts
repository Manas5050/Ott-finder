export interface PlatformMeta {
  key: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeTextColor: string;
  logoUrl?: string;
  searchUrlBuilder: (title: string) => string;
}

export const PLATFORM_REGISTRY: Record<string, PlatformMeta> = {
  netflix: {
    key: 'netflix',
    name: 'Netflix',
    color: '#E50914',
    bgColor: 'bg-red-950/40',
    borderColor: 'border-red-600/40',
    badgeTextColor: 'text-red-400',
    searchUrlBuilder: (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
  },
  prime: {
    key: 'prime',
    name: 'Amazon Prime Video',
    color: '#00A8E1',
    bgColor: 'bg-sky-950/40',
    borderColor: 'border-sky-500/40',
    badgeTextColor: 'text-sky-400',
    searchUrlBuilder: (q) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(q)}`,
  },
  hotstar: {
    key: 'hotstar',
    name: 'Disney+ Hotstar',
    color: '#134B8A',
    bgColor: 'bg-blue-950/40',
    borderColor: 'border-blue-500/40',
    badgeTextColor: 'text-blue-400',
    searchUrlBuilder: (q) => `https://www.hotstar.com/in/explore?search_query=${encodeURIComponent(q)}`,
  },
  jiocinema: {
    key: 'jiocinema',
    name: 'JioCinema',
    color: '#D80075',
    bgColor: 'bg-pink-950/40',
    borderColor: 'border-pink-500/40',
    badgeTextColor: 'text-pink-400',
    searchUrlBuilder: (q) => `https://www.jiocinema.com/search/${encodeURIComponent(q)}`,
  },
  sonyliv: {
    key: 'sonyliv',
    name: 'SonyLIV',
    color: '#262626',
    bgColor: 'bg-neutral-900',
    borderColor: 'border-neutral-700',
    badgeTextColor: 'text-amber-400',
    searchUrlBuilder: (q) => `https://www.sonyliv.com/search/${encodeURIComponent(q)}`,
  },
  zee5: {
    key: 'zee5',
    name: 'ZEE5',
    color: '#8230C6',
    bgColor: 'bg-purple-950/40',
    borderColor: 'border-purple-500/40',
    badgeTextColor: 'text-purple-400',
    searchUrlBuilder: (q) => `https://www.zee5.com/search?q=${encodeURIComponent(q)}`,
  },
  appletv: {
    key: 'appletv',
    name: 'Apple TV+',
    color: '#A2AAAD',
    bgColor: 'bg-zinc-900',
    borderColor: 'border-zinc-700',
    badgeTextColor: 'text-zinc-300',
    searchUrlBuilder: (q) => `https://tv.apple.com/search?term=${encodeURIComponent(q)}`,
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube Movies',
    color: '#FF0000',
    bgColor: 'bg-red-950/30',
    borderColor: 'border-red-500/30',
    badgeTextColor: 'text-red-400',
    searchUrlBuilder: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}+movie`,
  },
  lionsgate: {
    key: 'lionsgate',
    name: 'Lionsgate Play',
    color: '#B7914A',
    bgColor: 'bg-amber-950/30',
    borderColor: 'border-amber-600/40',
    badgeTextColor: 'text-amber-400',
    searchUrlBuilder: (q) => `https://www.lionsgateplay.com/search?q=${encodeURIComponent(q)}`,
  },
  aha: {
    key: 'aha',
    name: 'Aha',
    color: '#FF6D00',
    bgColor: 'bg-orange-950/40',
    borderColor: 'border-orange-500/40',
    badgeTextColor: 'text-orange-400',
    searchUrlBuilder: (q) => `https://www.aha.video/search?q=${encodeURIComponent(q)}`,
  },
  sunnxt: {
    key: 'sunnxt',
    name: 'Sun NXT',
    color: '#E87D04',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-500/40',
    badgeTextColor: 'text-amber-400',
    searchUrlBuilder: (q) => `https://www.sunnxt.com/search?q=${encodeURIComponent(q)}`,
  },
  other: {
    key: 'other',
    name: 'Other Streaming',
    color: '#6366F1',
    bgColor: 'bg-indigo-950/40',
    borderColor: 'border-indigo-500/40',
    badgeTextColor: 'text-indigo-400',
    searchUrlBuilder: (q) => `https://www.justwatch.com/in/search?q=${encodeURIComponent(q)}`,
  },
};

export function normalizePlatformKey(rawName: string): string {
  const s = rawName.toLowerCase();
  if (s.includes('netflix')) return 'netflix';
  if (s.includes('prime') || s.includes('amazon')) return 'prime';
  if (s.includes('hotstar') || s.includes('disney')) return 'hotstar';
  if (s.includes('jio')) return 'jiocinema';
  if (s.includes('sony')) return 'sonyliv';
  if (s.includes('zee')) return 'zee5';
  if (s.includes('apple')) return 'appletv';
  if (s.includes('youtube')) return 'youtube';
  if (s.includes('lionsgate')) return 'lionsgate';
  if (s.includes('aha')) return 'aha';
  if (s.includes('sun')) return 'sunnxt';
  return 'other';
}

export function getPlatformMeta(keyOrName: string): PlatformMeta {
  const normalized = normalizePlatformKey(keyOrName);
  return PLATFORM_REGISTRY[normalized] || PLATFORM_REGISTRY.other;
}

export function getWatchUrl(platformKey: string, movieTitle: string, directUrl?: string): string {
  if (directUrl && (directUrl.startsWith('http://') || directUrl.startsWith('https://'))) {
    // If it's a valid direct URL to the platform, prioritize it
    return directUrl;
  }
  const meta = getPlatformMeta(platformKey);
  return meta.searchUrlBuilder(movieTitle);
}
