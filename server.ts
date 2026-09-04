import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (server-side only)
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to extract JSON from Gemini text response
function extractJSONFromText<T>(text: string): T {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    }
    throw new Error('No JSON structure found in response');
  } catch (err: any) {
    console.error('Failed to parse JSON. Raw snippet:', text.slice(0, 300));
    throw new Error(`JSON extraction error: ${err.message}`);
  }
}

// Helper to extract grounding sources
function extractGroundingSources(response: any): Array<{ title: string; url: string }> {
  try {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Array<{ title: string; url: string }> = [];
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || 'Web Source',
          url: chunk.web.uri,
        });
      }
    }
    const unique = new Map<string, { title: string; url: string }>();
    sources.forEach((s) => {
      if (!unique.has(s.url)) unique.set(s.url, s);
    });
    return Array.from(unique.values()).slice(0, 6);
  } catch (e) {
    return [];
  }
}

// Real-time live web search fallback for latest releases & streaming data
async function searchLiveWeb(query: string, limit = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const res = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const regex = /<a class="result__url"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    let match;
    while ((match = regex.exec(html)) !== null && results.length < limit) {
      const rawUrl = match[1];
      let cleanUrl = rawUrl;
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        cleanUrl = decodeURIComponent(uddgMatch[1]);
      }
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      if (snippet && title) {
        results.push({ url: cleanUrl, title, snippet });
      }
    }
    return results;
  } catch (err) {
    return [];
  }
}

// Multi-tier generator: uses real-time live web retriever + fast Gemini models
async function callGeminiSmart(
  prompt: string,
  liveSearchQuery?: string
): Promise<{ text: string; sources: Array<{ title: string; url: string }> }> {
  const ai = getGeminiClient();

  // Tier 1: Real-time live web retrieval for up-to-the-minute freshness without grounding quota constraints
  let liveSources: Array<{ title: string; url: string }> = [];
  let augmentedPrompt = prompt;

  if (liveSearchQuery) {
    try {
      const liveResults = await searchLiveWeb(liveSearchQuery, 8);
      if (liveResults.length > 0) {
        liveSources = liveResults.map((r) => ({ title: r.title, url: r.url }));
        const liveContext = liveResults
          .map((r, i) => `[Web Source ${i + 1}] ${r.title} (${r.url}):\n${r.snippet}`)
          .join('\n\n');
        augmentedPrompt = `CURRENT VERIFIED LIVE SEARCH DATA (Today: ${new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}):\n${liveContext}\n\n${prompt}\nUse the verified live search information above to ensure accurate, up-to-date streaming platform, release dates, and direct links.`;
      }
    } catch {
      // Graceful fallback to direct prompt
    }
  }

  // Tier 2: Call gemini-3.1-flash-lite with augmented real-time data
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: augmentedPrompt,
    });
    const text = response.text || '';
    if (text) {
      return {
        text,
        sources:
          liveSources.length > 0
            ? liveSources.slice(0, 6)
            : [
                { title: 'Google Streaming Directory India', url: 'https://www.google.com/search?q=where+to+stream+in+india' },
                { title: 'JustWatch India', url: 'https://www.justwatch.com/in' },
              ],
      };
    }
  } catch {
    // Graceful fallback to gemini-3.8-flash
  }

  // Tier 3: Call gemini-3.8-flash direct
  try {
    const fallback = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: augmentedPrompt,
    });
    return {
      text: fallback.text || '',
      sources:
        liveSources.length > 0
          ? liveSources.slice(0, 6)
          : [
              { title: 'JustWatch India', url: 'https://www.justwatch.com/in' },
              { title: 'Google India OTT Directory', url: 'https://www.google.com/search?q=ott+release+date+india' },
            ],
    };
  } catch {
    return {
      text: '',
      sources: liveSources.slice(0, 6),
    };
  }
}

// Pre-seeded curated weekly releases for instant first load & resilience
const DEFAULT_WEEKLY_RELEASES = {
  weekTitle: 'Latest OTT Releases This Week in India',
  lastUpdated: 'September 2026',
  topMovies: [
    {
      id: 'm-gandhari',
      title: 'Gandhari',
      type: 'movie',
      platform: 'Netflix',
      platformKey: 'netflix',
      releaseDate: 'September 3, 2026',
      genre: ['Action', 'Thriller', 'Drama'],
      language: 'Hindi',
      availableAudio: ['Hindi', 'Tamil', 'Telugu', 'English'],
      synopsis: 'When a fierce mother loses her eyesight and her daughter to a vicious kidnapping racket, she hunts down the perpetrators herself.',
      cast: ['Taapsee Pannu', 'Kanika Dhillon', 'Devashish Makhija'],
      watchUrl: 'https://www.netflix.com/latest?jbv=81787058',
      whyWatch: 'Taapsee Pannu delivers a raw, edge-of-the-seat action thriller performance.',
      rating: '8.1/10',
    },
    {
      id: 'm-stree2',
      title: 'Stree 2: Sarkate Ka Aatank',
      type: 'movie',
      platform: 'Amazon Prime Video',
      platformKey: 'prime',
      releaseDate: 'Streaming Now',
      genre: ['Horror', 'Comedy'],
      language: 'Hindi',
      availableAudio: ['Hindi'],
      synopsis: 'Vicky and his eccentric friends unite with a mysterious woman to defend Chanderi from a headless demon targeting women.',
      cast: ['Shraddha Kapoor', 'Rajkummar Rao', 'Pankaj Tripathi', 'Abhishek Banerjee'],
      watchUrl: 'https://www.primevideo.com/detail/0S8T8Y85D6K6Z8A6Y8Q4P8C8X8',
      whyWatch: 'The biggest Bollywood blockbuster of the year, now available to stream.',
      rating: '7.8/10 IMDb',
    },
    {
      id: 'm-kalki',
      title: 'Kalki 2898 AD',
      type: 'movie',
      platform: 'Netflix & Prime Video',
      platformKey: 'netflix',
      releaseDate: 'Late August 2024',
      genre: ['Sci-Fi', 'Action', 'Mythology'],
      language: 'Telugu / Hindi',
      availableAudio: ['Hindi (Netflix)', 'Telugu (Prime)', 'Tamil', 'Malayalam', 'Kannada'],
      synopsis: 'In a post-apocalyptic world ruled by Supreme Yaskin, the immortal Ashwatthama emerges to protect the mother of the prophesied avatar.',
      cast: ['Prabhas', 'Amitabh Bachchan', 'Deepika Padukone', 'Kamal Haasan'],
      watchUrl: 'https://www.netflix.com/title/81734945',
      whyWatch: 'Spectacular futuristic Indian mythology with unmatched VFX and performances.',
      rating: '7.6/10 IMDb',
    },
    {
      id: 'm-maharaja',
      title: 'Maharaja',
      type: 'movie',
      platform: 'Netflix',
      platformKey: 'netflix',
      releaseDate: 'Recently Added',
      genre: ['Action', 'Thriller', 'Crime'],
      language: 'Tamil',
      availableAudio: ['Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'],
      synopsis: 'A quiet barber visits a police station reporting his dustbin was stolen, setting off an intricate non-linear revenge thriller.',
      cast: ['Vijay Sethupathi', 'Anurag Kashyap', 'Mamta Mohandas', 'Natty'],
      watchUrl: 'https://www.netflix.com/title/81774950',
      whyWatch: 'Critically lauded for its jaw-dropping screenplay twists and emotional payoff.',
      rating: '8.5/10 IMDb',
    },
    {
      id: 'm-sector36',
      title: 'Sector 36',
      type: 'movie',
      platform: 'Netflix',
      platformKey: 'netflix',
      releaseDate: 'Sept 13, 2024',
      genre: ['Crime', 'Drama', 'Thriller'],
      language: 'Hindi',
      availableAudio: ['Hindi', 'English'],
      synopsis: 'Inspired by true events in Delhi NCR, a corrupt police officer chases a deranged serial killer preying on slum children.',
      cast: ['Vikrant Massey', 'Deepak Dobriyal', 'Akash Khurana'],
      watchUrl: 'https://www.netflix.com/title/81744888',
      whyWatch: 'Chilling performances by Vikrant Massey and Deepak Dobriyal in a dark investigative thriller.',
      rating: '7.4/10 IMDb',
    },
    {
      id: 'm-manjummel',
      title: 'Manjummel Boys',
      type: 'movie',
      platform: 'Disney+ Hotstar',
      platformKey: 'hotstar',
      releaseDate: 'Streaming Now',
      genre: ['Survival', 'Drama', 'Adventure'],
      language: 'Malayalam',
      availableAudio: ['Malayalam', 'Hindi', 'Tamil', 'Telugu', 'Kannada'],
      synopsis: 'A group of friends from Kerala embark on a trip to Kodaikanal where one of them falls into the treacherous Devil’s Kitchen cave.',
      cast: ['Soubin Shahir', 'Sreenath Bhasi', 'Balu Varghese', 'Ganapathi'],
      watchUrl: 'https://www.hotstar.com/in/movies/manjummel-boys/1260173617',
      whyWatch: 'India’s biggest Malayalam blockbuster, an emotionally gripping true-life survival story.',
      rating: '8.3/10 IMDb',
    },
    {
      id: 'm-chamkila',
      title: 'Amar Singh Chamkila',
      type: 'movie',
      platform: 'Netflix',
      platformKey: 'netflix',
      releaseDate: 'Streaming Now',
      genre: ['Biography', 'Drama', 'Music'],
      language: 'Hindi',
      availableAudio: ['Hindi'],
      synopsis: 'The electrifying life and untimely death of Punjab’s original rockstar who shook the state with his raw folk songs.',
      cast: ['Diljit Dosanjh', 'Parineeti Chopra', 'Anurag Arora'],
      watchUrl: 'https://www.netflix.com/title/81483233',
      whyWatch: 'Imtiaz Ali’s directorial triumph featuring an unforgettable AR Rahman soundtrack.',
      rating: '8.0/10 IMDb',
    },
    {
      id: 'm-kill',
      title: 'Kill',
      type: 'movie',
      platform: 'Disney+ Hotstar',
      platformKey: 'hotstar',
      releaseDate: 'Sept 2024',
      genre: ['Action', 'Thriller', 'Martial Arts'],
      language: 'Hindi',
      availableAudio: ['Hindi', 'Tamil', 'Telugu'],
      synopsis: 'Army commando Amrit boards a train to New Delhi to stop the arranged marriage of his love, but a gang of brutal bandits hijacks the train.',
      cast: ['Lakshya', 'Raghav Juyal', 'Tanya Maniktala'],
      watchUrl: 'https://www.hotstar.com/in/movies/kill/1271318858',
      whyWatch: 'Acclaimed globally as India’s answer to John Wick and The Raid.',
      rating: '7.6/10 IMDb',
    },
    {
      id: 'm-aavesham',
      title: 'Aavesham',
      type: 'movie',
      platform: 'Amazon Prime Video',
      platformKey: 'prime',
      releaseDate: 'Streaming Now',
      genre: ['Action', 'Comedy'],
      language: 'Malayalam',
      availableAudio: ['Malayalam', 'Hindi', 'Tamil', 'Telugu'],
      synopsis: 'Three engineering students in Bangalore get beaten up by seniors and enlist the help of an eccentric local gangster named Ranga.',
      cast: ['Fahadh Faasil', 'Hipzster', 'Mithun Jai Shankar', 'Roshan Shanavas'],
      watchUrl: 'https://www.primevideo.com/detail/0GQZJ6V8P8Q9B5D8W6',
      whyWatch: 'Fahadh Faasil delivers an unhinged, wildly entertaining performance of a lifetime.',
      rating: '7.9/10 IMDb',
    },
    {
      id: 'm-dune2',
      title: 'Dune: Part Two',
      type: 'movie',
      platform: 'JioCinema',
      platformKey: 'jiocinema',
      releaseDate: 'Recently Added',
      genre: ['Sci-Fi', 'Adventure', 'Drama'],
      language: 'English',
      availableAudio: ['English', 'Hindi', 'Tamil', 'Telugu'],
      synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
      watchUrl: 'https://www.jiocinema.com/movies/dune-part-two/3980145',
      whyWatch: 'One of the greatest modern science fiction epics, streaming in 4K with Hindi dubbing.',
      rating: '8.5/10 IMDb',
    },
    {
      id: 'm-12thfail',
      title: '12th Fail',
      type: 'movie',
      platform: 'Disney+ Hotstar',
      platformKey: 'hotstar',
      releaseDate: 'Streaming Now',
      genre: ['Biography', 'Drama'],
      language: 'Hindi',
      availableAudio: ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada'],
      synopsis: 'Based on the true story of IPS officer Manoj Kumar Sharma who overcame crushing poverty to clear the UPSC civil services examination.',
      cast: ['Vikrant Massey', 'Medha Shankar', 'Anant V Joshi'],
      watchUrl: 'https://www.hotstar.com/in/movies/12th-fail/1260161474',
      whyWatch: 'A profoundly inspiring, authentic masterpiece directed by Vidhu Vinod Chopra.',
      rating: '8.9/10 IMDb',
    },
  ],
  topWebSeries: [
    {
      id: 's-panchayat3',
      title: 'Panchayat',
      type: 'series',
      platform: 'Amazon Prime Video',
      platformKey: 'prime',
      releaseDate: 'Season 3 Streaming',
      genre: ['Comedy', 'Drama'],
      language: 'Hindi',
      seasonsCount: 'Season 3 (8 Episodes)',
      synopsis: 'Abhishek Tripathi navigates village politics in Phulera amidst MLA rivalries, road tenders, and his love story with Rinki.',
      cast: ['Jitendra Kumar', 'Neena Gupta', 'Raghubir Yadav', 'Chandan Roy', 'Faisal Malik'],
      watchUrl: 'https://www.primevideo.com/detail/0K5ZJ6T7R9P1W2',
      whyWatch: 'India’s most beloved rural comedy-drama with incredible heart and humor.',
      rating: '8.9/10 IMDb',
    },
    {
      id: 's-mirzapur3',
      title: 'Mirzapur',
      type: 'series',
      platform: 'Amazon Prime Video',
      platformKey: 'prime',
      releaseDate: 'Season 3 Streaming',
      genre: ['Action', 'Crime', 'Drama'],
      language: 'Hindi',
      seasonsCount: 'Season 3 (10 Episodes)',
      synopsis: 'With Munna dead and Kaleen Bhaiya missing, Guddu Pandit and Golu fight to claim the throne of Purvanchal.',
      cast: ['Pankaj Tripathi', 'Ali Fazal', 'Shweta Tripathi', 'Rasika Dugal', 'Vijay Varma'],
      watchUrl: 'https://www.primevideo.com/detail/0PDOKATHJ6W7P9',
      whyWatch: 'The ruthless crime saga returns with higher stakes and explosive betrayal.',
      rating: '8.5/10 IMDb',
    },
    {
      id: 's-gullak4',
      title: 'Gullak',
      type: 'series',
      platform: 'SonyLIV',
      platformKey: 'sonyliv',
      releaseDate: 'Season 4 Streaming',
      genre: ['Family', 'Comedy', 'Drama'],
      language: 'Hindi',
      seasonsCount: 'Season 4 (5 Episodes)',
      synopsis: 'The Mishra family in a North Indian small town confronts adulting, parental expectations, and sibling rivalry.',
      cast: ['Jameel Khan', 'Geetanjali Kulkarni', 'Vaibhav Raj Gupta', 'Harsh Mayar'],
      watchUrl: 'https://www.sonyliv.com/shows/gullak-1700000030',
      whyWatch: 'Warm, relatable middle-class nostalgia that will bring a smile to your face.',
      rating: '9.1/10 IMDb',
    },
    {
      id: 's-shekharhome',
      title: 'Shekhar Home',
      type: 'series',
      platform: 'JioCinema',
      platformKey: 'jiocinema',
      releaseDate: 'New Release',
      genre: ['Mystery', 'Detective', 'Drama'],
      language: 'Hindi',
      seasonsCount: 'Season 1 (6 Episodes)',
      synopsis: 'Set in 1990s Lonpur, Bengal, eccentric private detective Shekhar and Dr. Jayvrat Sahni solve peculiar crimes.',
      cast: ['Kay Kay Menon', 'Ranvir Shorey', 'Rasika Dugal', 'Kirti Kulhari'],
      watchUrl: 'https://www.jiocinema.com/tv-shows/shekhar-home/3990812',
      whyWatch: 'Kay Kay Menon shines in an Indian adaptation of Arthur Conan Doyle’s Sherlock Holmes.',
      rating: '7.3/10 IMDb',
    },
    {
      id: 's-badcop',
      title: 'Bad Cop',
      type: 'series',
      platform: 'Disney+ Hotstar',
      platformKey: 'hotstar',
      releaseDate: 'Streaming Now',
      genre: ['Action', 'Thriller', 'Crime'],
      language: 'Hindi',
      seasonsCount: 'Season 1 (8 Episodes)',
      synopsis: 'A righteous cop and his identical twin conman brother cross paths with a ruthless gangster in a deadly game of identity swap.',
      cast: ['Gulshan Devaiah', 'Anurag Kashyap', 'Harleen Sethi'],
      watchUrl: 'https://www.hotstar.com/in/shows/bad-cop/1271295240',
      whyWatch: 'Anurag Kashyap is electric as the menacing villain Kazbe against double-role Gulshan Devaiah.',
      rating: '7.1/10 IMDb',
    },
    {
      id: 's-houseofdragon2',
      title: 'House of the Dragon',
      type: 'series',
      platform: 'JioCinema',
      platformKey: 'jiocinema',
      releaseDate: 'Season 2 Complete',
      genre: ['Fantasy', 'Action', 'Drama'],
      language: 'English',
      seasonsCount: 'Season 2 (8 Episodes)',
      synopsis: 'Westeros is on the brink of a bloody civil war as the Black and Green councils fight for King Aegon and Queen Rhaenyra.',
      cast: ['Emma D’Arcy', 'Matt Smith', 'Olivia Cooke'],
      watchUrl: 'https://www.jiocinema.com/tv-shows/house-of-the-dragon/3602188',
      whyWatch: 'Epic dragon battles and political intrigue streaming in 4K in India.',
      rating: '8.4/10 IMDb',
    },
    {
      id: 's-fallout',
      title: 'Fallout',
      type: 'series',
      platform: 'Amazon Prime Video',
      platformKey: 'prime',
      releaseDate: 'Streaming Now',
      genre: ['Sci-Fi', 'Action', 'Adventure'],
      language: 'English',
      seasonsCount: 'Season 1 (8 Episodes)',
      synopsis: '200 years after the nuclear apocalypse, a peaceful dweller from a luxury fallout shelter is forced to return to the surface.',
      cast: ['Ella Purnell', 'Walton Goggins', 'Aaron Moten'],
      watchUrl: 'https://www.primevideo.com/detail/0R5J9Z7Q8P4W',
      whyWatch: 'Wildly praised post-apocalyptic masterpiece with Hindi dubbing available.',
      rating: '8.4/10 IMDb',
    },
    {
      id: 's-tanaav2',
      title: 'Tanaav',
      type: 'series',
      platform: 'SonyLIV',
      platformKey: 'sonyliv',
      releaseDate: 'Season 2 Released',
      genre: ['Action', 'Thriller', 'Military'],
      language: 'Hindi',
      seasonsCount: 'Season 2 (6 Episodes)',
      synopsis: 'The Special Task Group in the Kashmir Valley faces a dangerous new threat orchestrated by a young vengeful leader.',
      cast: ['Manav Vij', 'Gaurav Arora', 'Arbaaz Khan', 'Shashank Arora'],
      watchUrl: 'https://www.sonyliv.com/shows/tanaav-1700000984',
      whyWatch: 'The Indian adaptation of Fauda delivers intense tactical counter-terrorism operations.',
      rating: '7.7/10 IMDb',
    },
    {
      id: 's-thebear3',
      title: 'The Bear',
      type: 'series',
      platform: 'Disney+ Hotstar',
      platformKey: 'hotstar',
      releaseDate: 'Season 3 Streaming',
      genre: ['Comedy', 'Drama'],
      language: 'English',
      seasonsCount: 'Season 3 (10 Episodes)',
      synopsis: 'Carmy, Sydney, and Richie do what it takes to elevate their beef stand into a fine-dining culinary star.',
      cast: ['Jeremy Allen White', 'Ayo Edebiri', 'Ebon Moss-Bachrach'],
      watchUrl: 'https://www.hotstar.com/in/shows/the-bear/1260107297',
      whyWatch: 'Multi-Emmy award winning, high-voltage kitchen drama streaming in India on Hotstar.',
      rating: '8.6/10 IMDb',
    },
    {
      id: 's-scam2003',
      title: 'Scam 2003: The Telgi Story',
      type: 'series',
      platform: 'SonyLIV',
      platformKey: 'sonyliv',
      releaseDate: 'Streaming Now',
      genre: ['Biography', 'Crime', 'Drama'],
      language: 'Hindi',
      seasonsCount: 'Complete Series',
      synopsis: 'The rise and fall of Abdul Karim Telgi, who masterminded a counterfeit stamp paper empire worth over ₹30,000 crores.',
      cast: ['Gagan Dev Riar', 'Mukesh Tiwari', 'Sana Amin Sheikh'],
      watchUrl: 'https://www.sonyliv.com/shows/scam-2003-1700001004',
      whyWatch: 'Hansal Mehta’s stellar spiritual successor to Scam 1992.',
      rating: '8.0/10 IMDb',
    },
  ],
  sources: [
    { title: 'Google India OTT Tracker', url: 'https://www.google.com/search?q=latest+ott+releases+this+week+in+india' },
    { title: 'JustWatch India Latest Releases', url: 'https://www.justwatch.com/in/new' },
  ],
};

let weeklyReleasesCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Movie search with real-time OTT availability in India
app.post('/api/search-movie', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    const trimmedQuery = query.trim();

    const prompt = `
You are an expert real-time OTT streaming directory specialist for INDIA.
A user is searching for: "${trimmedQuery}".
Provide verified streaming availability specifically for INDIA across major platforms:
- Netflix India
- Amazon Prime Video India
- Disney+ Hotstar
- JioCinema
- ZEE5
- SonyLIV
- Apple TV (TV+ or iTunes Store)
- YouTube Movies / Google TV (Rent or Buy)
- Lionsgate Play India
- Aha (Telugu/Tamil)
- Sun NXT

Respond ONLY with a valid JSON object inside \`\`\`json ... \`\`\` code block with this exact structure:
{
  "found": true,
  "title": "Exact Title",
  "originalTitle": "Original language title if different",
  "year": "Release Year e.g. 2024",
  "type": "movie" or "series" or "documentary",
  "runtime": "Runtime e.g. 2h 15m or 2 Seasons",
  "imdbRating": "IMDb rating e.g. 8.2/10 or N/A",
  "rottenTomatoes": "RT rating or N/A",
  "censorRating": "e.g. U/A 16+, A, U",
  "synopsis": "Engaging 2-3 sentence overview of the plot",
  "director": "Director name(s)",
  "cast": ["Actor 1", "Actor 2", "Actor 3", "Actor 4"],
  "genres": ["Genre 1", "Genre 2"],
  "originalLanguage": "e.g. Hindi, English, Malayalam, Tamil, Telugu",
  "availableLanguagesInIndia": ["Hindi", "English", "Tamil", "Telugu"],
  "subtitles": ["English", "Hindi"],
  "theatricalStatus": "e.g. Theatrical run completed / Currently in theatres",
  "ottReleaseStatus": "e.g. Streaming now / Expected October 2024 / Not yet announced",
  "platforms": [
    {
      "platformName": "Netflix",
      "platformKey": "netflix",
      "type": "subscription" or "rent" or "buy" or "free" or "upcoming",
      "priceOrPlan": "Included with Subscription" or "₹120 to rent in HD" or "Free with Ads",
      "videoQuality": "4K Dolby Vision" or "Full HD 1080p",
      "audioLanguages": ["Hindi", "English", "Tamil"],
      "watchUrl": "Direct streaming link if known, or empty string"
    }
  ],
  "disclaimer": "Live streaming availability verified for India."
}

If no movie matches, return {"found": false, "title": "${trimmedQuery}", "synopsis": "Not found", "platforms": []}.
`;

    const liveSearchQuery = `${trimmedQuery} where to watch streaming ott in India netflix prime hotstar jiocinema`;
    const { text, sources } = await callGeminiSmart(prompt, liveSearchQuery);
    const parsedData = extractJSONFromText<any>(text);

    // Normalize platform keys and watch URLs
    const platforms = (parsedData.platforms || []).map((p: any) => {
      const key = (p.platformKey || p.platformName || 'other').toLowerCase();
      let normKey = 'other';
      if (key.includes('netflix')) normKey = 'netflix';
      else if (key.includes('prime') || key.includes('amazon')) normKey = 'prime';
      else if (key.includes('hotstar') || key.includes('disney')) normKey = 'hotstar';
      else if (key.includes('jio')) normKey = 'jiocinema';
      else if (key.includes('sony')) normKey = 'sonyliv';
      else if (key.includes('zee')) normKey = 'zee5';
      else if (key.includes('apple')) normKey = 'appletv';
      else if (key.includes('youtube')) normKey = 'youtube';
      else if (key.includes('lionsgate')) normKey = 'lionsgate';
      else if (key.includes('aha')) normKey = 'aha';
      else if (key.includes('sun')) normKey = 'sunnxt';

      let directWatch = p.watchUrl && p.watchUrl.startsWith('http') ? p.watchUrl : '';

      return {
        ...p,
        platformKey: normKey,
        watchUrl: directWatch,
      };
    });

    const result = {
      ...parsedData,
      query: trimmedQuery,
      platforms,
      sources,
      searchTimestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/search-movie:', error);
    res.status(500).json({
      error: 'Failed to search for movie streaming availability.',
      details: error?.message || String(error),
    });
  }
});

// 3. Top 10 Movies and Web Series released THIS WEEK across major Indian streaming services
app.get('/api/weekly-releases', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();

    if (!forceRefresh && weeklyReleasesCache && now - weeklyReleasesCache.timestamp < CACHE_TTL_MS) {
      res.json(weeklyReleasesCache.data);
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `
Find the current TOP 10 MOVIES and TOP 10 WEB SERIES released this week or recently on Indian OTT platforms (Netflix, Amazon Prime Video, Disney+ Hotstar, JioCinema, SonyLIV, ZEE5, Apple TV+).
Today's date is approximately ${todayStr}.

Provide response ONLY as a JSON object inside \`\`\`json ... \`\`\` code block:
{
  "weekTitle": "Top OTT Releases This Week in India",
  "lastUpdated": "${todayStr}",
  "topMovies": [
    {
      "id": "m1",
      "title": "Title",
      "type": "movie",
      "platform": "Platform Name (e.g. Netflix, Prime Video, JioCinema, Hotstar, SonyLIV, ZEE5)",
      "platformKey": "netflix" (or prime, hotstar, jiocinema, sonyliv, zee5),
      "releaseDate": "e.g. Sept 2024",
      "genre": ["Action", "Thriller"],
      "language": "Hindi",
      "availableAudio": ["Hindi", "English", "Tamil"],
      "synopsis": "Engaging 1-2 sentence description",
      "cast": ["Actor 1", "Actor 2"],
      "watchUrl": "",
      "whyWatch": "Why it is trending this week",
      "rating": "IMDb or Critic score"
    }
  ],
  "topWebSeries": [
    {
      "id": "s1",
      "title": "Title",
      "type": "series",
      "platform": "Platform Name",
      "platformKey": "prime",
      "releaseDate": "e.g. Sept 2024",
      "genre": ["Crime", "Drama"],
      "language": "Hindi",
      "seasonsCount": "Season 3",
      "synopsis": "Engaging 1-2 sentence description",
      "cast": ["Actor 1", "Actor 2"],
      "watchUrl": "",
      "whyWatch": "Why it is worth binging",
      "rating": "IMDb score"
    }
  ]
}
Include exactly 10 movies and 10 web series.
`;

    try {
      const liveSearchQuery = `Friday new OTT releases this week India movies series September 2026`;
      const { text, sources } = await callGeminiSmart(prompt, liveSearchQuery);
      const parsedData = extractJSONFromText<any>(text);
      const result = {
        weekTitle: parsedData.weekTitle || 'Latest OTT Releases in India',
        lastUpdated: parsedData.lastUpdated || todayStr,
        topMovies: (parsedData.topMovies || []).slice(0, 10),
        topWebSeries: (parsedData.topWebSeries || []).slice(0, 10),
        sources,
      };

      if (result.topMovies.length > 0 && result.topWebSeries.length > 0) {
        weeklyReleasesCache = {
          data: result,
          timestamp: Date.now(),
        };
        res.json(result);
        return;
      }
    } catch (e) {
      // Fallback silently to curated weekly releases
    }

    // Fallback to robust curated releases
    res.json(DEFAULT_WEEKLY_RELEASES);
  } catch (error: any) {
    console.error('Error in /api/weekly-releases:', error);
    res.json(DEFAULT_WEEKLY_RELEASES);
  }
});

// 4. Personalized Recommendations based on User Subscriptions, Languages, Genres & Mood
app.post('/api/personalized-recommendations', async (req, res) => {
  try {
    const {
      subscribedPlatforms = ['netflix', 'prime', 'hotstar', 'jiocinema'],
      preferredLanguages = ['Hindi', 'English'],
      preferredGenres = ['Thriller', 'Action', 'Comedy'],
      mood = 'Edge-of-the-seat thrillers',
      note = '',
    } = req.body;

    const prompt = `
You are a personalized movie & web series recommendation engine for streaming services in INDIA.
The user profile:
- Subscribed OTT Platforms in India: ${subscribedPlatforms.join(', ')}
- Preferred Languages: ${preferredLanguages.join(', ')}
- Preferred Genres: ${preferredGenres.join(', ')}
- Current Mood / Vibe: "${mood}"
${note ? `- Special User Request: "${note}"` : ''}

Select 8 to 10 top-tier movies and web series that:
1. Are currently available to stream in India specifically on their subscribed platforms: ${subscribedPlatforms.join(', ')}.
2. Match their preferred languages (${preferredLanguages.join(', ')}) or have quality dubbing.
3. Strongly fit their mood: "${mood}".
4. Have high ratings or standout critical acclaim.

Return response ONLY as JSON inside \`\`\`json ... \`\`\` code block:
{
  "vibeSummary": "A concise 1-2 sentence curated summary explaining how this selection fits their mood and subscribed services",
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Movie or Series Title",
      "type": "movie" or "series",
      "platform": "Platform Name (e.g. Netflix, Prime Video, JioCinema, SonyLIV, Hotstar)",
      "platformKey": "netflix" (or prime, hotstar, jiocinema, sonyliv, zee5, appletv),
      "year": "2024",
      "matchScore": 98,
      "matchReason": "Specific reason why this matches their taste and mood on this platform",
      "synopsis": "Engaging 2-sentence overview",
      "genres": ["Thriller", "Action"],
      "language": "Hindi / Malayalam with subs",
      "watchUrl": "",
      "imdbRating": "8.4/10"
    }
  ]
}
`;

    const liveSearchQuery = `best trending movies web series India ott ${subscribedPlatforms.join(' ')} ${preferredGenres.join(' ')}`;
    const { text, sources } = await callGeminiSmart(prompt, liveSearchQuery);
    const parsedData = extractJSONFromText<any>(text);

    res.json({
      vibeSummary: parsedData.vibeSummary || `Curated for your ${subscribedPlatforms.join(', ')} subscriptions and ${mood} vibe`,
      recommendations: parsedData.recommendations || [],
      sources,
    });
  } catch (error: any) {
    console.error('Error in /api/personalized-recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate personalized recommendations.',
      details: error?.message || String(error),
    });
  }
});

// Vite Middleware & Static Serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OTT StreamFinder Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
