const Parser = require("rss-parser");
const parser = new Parser();

// Cache for news to avoid spamming RSS feeds
let newsCache = {
  data: null,
  lastFetch: null,
};

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// List of Surf RSS feeds
const RSS_FEEDS = [
  { url: "https://www.surfertoday.com/feed/", source: "Surfer Today" },
  { url: "https://stabmag.com/feed/", source: "Stab Mag" },
  { url: "https://wsl.com/feed", source: "World Surf League" }, // Replace with real WSL feed or another
  { url: "https://beachgrit.com/feed/", source: "BeachGrit" },
];

exports.getNews = async (req, res) => {
  try {
    // Return cached data if valid
    if (
      newsCache.data &&
      newsCache.lastFetch &&
      Date.now() - newsCache.lastFetch < CACHE_DURATION
    ) {
      return res.status(200).json({
        success: true,
        cached: true,
        count: newsCache.data.length,
        data: newsCache.data,
      });
    }

    let allItems = [];

    // Fetch all feeds in parallel
    const feedPromises = RSS_FEEDS.map(async (feedData) => {
      try {
        const feed = await parser.parseURL(feedData.url);
        return feed.items.map((item) => {
          // Extract an image if it exists in content or contentSnippet
          let imageUrl = null;
          const imgRegex = /<img.*?src="(.*?)"/;

          if (item.content) {
            const match = imgRegex.exec(item.content);
            if (match && match[1]) imageUrl = match[1];
          }
          if (!imageUrl && item["content:encoded"]) {
            const match = imgRegex.exec(item["content:encoded"]);
            if (match && match[1]) imageUrl = match[1];
          }

          return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || item.isoDate,
            source: feedData.source,
            contentSnippet: item.contentSnippet
              ? item.contentSnippet.substring(0, 150) + "..."
              : "",
            image:
              imageUrl ||
              "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // Fallback surf image
            categories: item.categories || ["Surfing"],
          };
        });
      } catch (err) {
        console.error(`Error fetching feed ${feedData.url}:`, err.message);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);

    // Flatten the array
    results.forEach((items) => {
      allItems = [...allItems, ...items];
    });

    // Sort by date (newest first)
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Update cache
    newsCache.data = allItems;
    newsCache.lastFetch = Date.now();

    res.status(200).json({
      success: true,
      cached: false,
      count: allItems.length,
      data: allItems,
    });
  } catch (error) {
    console.error("Error in getNews:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching news" });
  }
};
