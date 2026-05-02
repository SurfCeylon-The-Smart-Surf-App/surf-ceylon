# Surf Ceylon - Dynamic Surf News Integration

## Overview

The "Featured Stories" section in the Surf Ceylon app has been upgraded from static dummy data to a fully dynamic news feed. Because "surfing" is a specialized topic where generic news APIs often return irrelevant results (e.g., "web surfing" or unrelated sports), we opted for an **RSS-to-JSON Aggregator Architecture**.

This approach involves reading dedicated surf publications' RSS feeds through our backend, converting them into structured JSON, caching the results, and serving them to the mobile app seamlessly.

## Architecture

- **Backend (`surfapp--backend`)**: Acts as the aggregator. Fetches RSS feeds from multiple sources in parallel, parses them, extracts media, sorts by date, and serves them via a single `/api/news` endpoint.
- **Frontend (`SurfApp--frontend`)**: Fetches unified JSON from our backend and renders it. Displays a 3-item preview on the Home screen and a complete, categorizable list on a dedicated News screen.

---

## 1. Backend Implementation

### Dependencies

- **`rss-parser`**: Installed via npm to securely parse XML/RSS feeds into usable JavaScript objects.

### Configured Feed Sources

Currently, the API pulls directly from leading surf publications:

- **Surfer Today**: `https://www.surfertoday.com/feed/`
- **Stab Mag**: `https://stabmag.com/feed/`
- **World Surf League**: `https://wsl.com/feed` (Placeholder for actual competition feed)
- **BeachGrit**: `https://beachgrit.com/feed/`

### The Controller (`controllers/newsController.js`)

1. **Parallel Fetching**: We use `Promise.all` to fetch all RSS feeds simultaneously for faster response times.
2. **Image Extraction**: RSS feeds often hide article images inside HTML `<img>` tags within the `content` or `content:encoded` tags. We run a regular expression (`/<img.*?src="(.*?)"/`) to extract the first image URL and assign it to the payload.
3. **Data Normalization**:
   Every article mapped to a standard schema:
   ```json
   {
     "title": "Article Title",
     "link": "https://source.com/article-url",
     "pubDate": "ISO Timestamp",
     "source": "Stab Mag",
     "contentSnippet": "Truncated 150 char preview...",
     "image": "https://source.com/img.jpg",
     "categories": ["Surfing", "Competition"]
   }
   ```
4. **Caching Layer**: To prevent rate-limiting or IP bans from the RSS providers (and to speed up the app), the merged news array is cached in memory `newsCache` for **1 hour** (`60 * 60 * 1000` ms).

### The Route (`routes/news.js`)

- Exposes `GET /api/news`.
- Registered in `server.js` under `app.use("/api/news", require("./routes/news"));`.

---

## 2. Frontend Implementation

### Home Screen (`app/(tabs)/index.js`)

- **State Management**: Introduces `[news, setNews]` state alongside the existing spots state.
- **Data Fetching**: Calls `fetchNews()` concurrently with `fetchSpots()`. Grabs only the top 3 latest items using `.slice(0, 3)`.
- **Fallback**: If the array is empty or the network fails, it gracefully degrades to `dummyNews`.
- **UI Updates**:
  - Added a `w-20 h-20` thumbnail `Image` alongside the title.
  - Added "More News" (top right) and a primary outlined "View All News" button (bottom) mapped to `router.push('/news')`.
  - Implemented a `formatTimeAgo` function to convert ISO dates into human-readable strings (e.g., "12h ago").

### Dedicated News Hub (`app/news.js`)

- A brand new full-page screen allowing users to browse all fetched articles.
- **Categories / Tabs**: Implemented horizontal scrolling category pills (`All`, `Surfing`, `Competition`, `Gear`, `Local`).
- **Filtering Logic**: The app filters the aggregated news list on the client side based on simple string matching against the article's extracted `categories`, `title`, and `source` (e.g., matching "World Surf League" to the "Competition" tab).
- **Linking**: Clicking a news card opens the native mobile browser directly to the article source via `Linking.openURL(item.link)`.

---

## 3. How to Extend / Further Improvements

1. **Add Sri Lankan Local News**: Find local Sri Lankan surf blogs or news sites and add their `/feed` URLs to the `RSS_FEEDS` array in `newsController.js`.
2. **Infinite Scrolling**: If the feeds grow large, implement pagination in the backend controller (`?page=1&limit=20`) and use `onEndReached` on the `FlatList` in the frontend `news.js` component.
3. **Advanced Categorization**: Instead of relying on string matching, you could pipe the parsed feeds through a lightweight AI classifier script in the backend to strictly tag articles as "Hazards", "Competitions", or "Tips".
