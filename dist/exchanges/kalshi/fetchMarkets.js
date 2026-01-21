"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetCache = resetCache;
exports.fetchMarkets = fetchMarkets;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
async function fetchActiveEvents(targetMarketCount) {
    let allEvents = [];
    let totalMarketCount = 0;
    let cursor = null;
    let page = 0;
    // Note: Kalshi API uses cursor-based pagination which requires sequential fetching.
    // We cannot parallelize requests for a single list because we need the cursor from page N to fetch page N+1.
    // To optimize, we use the maximum allowed limit (200) and fetch until exhaustion.
    const MAX_PAGES = 1000; // Safety cap against infinite loops
    const BATCH_SIZE = 200; // Max limit per Kalshi API docs
    do {
        try {
            const queryParams = {
                limit: BATCH_SIZE,
                with_nested_markets: true,
                status: 'open' // Filter to open markets to improve relevance and speed
            };
            if (cursor)
                queryParams.cursor = cursor;
            const response = await axios_1.default.get(utils_1.KALSHI_API_URL, { params: queryParams });
            const events = response.data.events || [];
            if (events.length === 0)
                break;
            allEvents = allEvents.concat(events);
            // Count markets in this batch for early termination
            if (targetMarketCount) {
                for (const event of events) {
                    totalMarketCount += (event.markets || []).length;
                }
                // Early termination: if we have enough markets, stop fetching
                // Use 1.5x multiplier to ensure we have enough for sorting/filtering
                if (totalMarketCount >= targetMarketCount * 1.5) {
                    break;
                }
            }
            cursor = response.data.cursor;
            page++;
            // Additional safety: if no target specified, limit to reasonable number of pages
            if (!targetMarketCount && page >= 10) {
                break;
            }
        }
        catch (e) {
            console.error(`Error fetching Kalshi page ${page}:`, e);
            break;
        }
    } while (cursor && page < MAX_PAGES);
    return allEvents;
}
async function fetchSeriesMap() {
    try {
        const response = await axios_1.default.get(utils_1.KALSHI_SERIES_URL);
        const seriesList = response.data.series || [];
        const map = new Map();
        for (const series of seriesList) {
            if (series.tags && series.tags.length > 0) {
                map.set(series.ticker, series.tags);
            }
        }
        return map;
    }
    catch (e) {
        console.error("Error fetching Kalshi series:", e);
        return new Map();
    }
}
// Simple in-memory cache to avoid redundant API calls within a short period
let cachedEvents = null;
let cachedSeriesMap = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Export a function to reset the cache (useful for testing)
function resetCache() {
    cachedEvents = null;
    cachedSeriesMap = null;
    lastCacheTime = 0;
}
async function fetchMarkets(params) {
    const limit = params?.limit || 50;
    const now = Date.now();
    try {
        let events;
        let seriesMap;
        if (cachedEvents && cachedSeriesMap && (now - lastCacheTime < CACHE_TTL)) {
            events = cachedEvents;
            seriesMap = cachedSeriesMap;
        }
        else {
            // Fetch active events with nested markets
            // We also fetch Series metadata to get tags (tags are on Series, not Event)
            const [allEvents, fetchedSeriesMap] = await Promise.all([
                fetchActiveEvents(limit),
                fetchSeriesMap()
            ]);
            events = allEvents;
            seriesMap = fetchedSeriesMap;
            cachedEvents = allEvents;
            cachedSeriesMap = fetchedSeriesMap;
            lastCacheTime = now;
        }
        // Extract ALL markets from all events
        const allMarkets = [];
        // ... rest of the logic
        for (const event of events) {
            // Enrich event with tags from Series
            if (event.series_ticker && seriesMap.has(event.series_ticker)) {
                // If event has no tags or empty tags, use series tags
                if (!event.tags || event.tags.length === 0) {
                    event.tags = seriesMap.get(event.series_ticker);
                }
            }
            const markets = event.markets || [];
            for (const market of markets) {
                const unifiedMarket = (0, utils_1.mapMarketToUnified)(event, market);
                if (unifiedMarket) {
                    allMarkets.push(unifiedMarket);
                }
            }
        }
        // Sort by 24h volume
        if (params?.sort === 'volume') {
            allMarkets.sort((a, b) => b.volume24h - a.volume24h);
        }
        else if (params?.sort === 'liquidity') {
            allMarkets.sort((a, b) => b.liquidity - a.liquidity);
        }
        return allMarkets.slice(0, limit);
    }
    catch (error) {
        console.error("Error fetching Kalshi data:", error);
        return [];
    }
}
