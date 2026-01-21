"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketsBySlug = getMarketsBySlug;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
/**
 * Fetch specific markets by their event ticker.
 * Useful for looking up a specific event from a URL.
 * @param eventTicker - The event ticker (e.g. "FED-25JAN" or "PRES-2024")
 */
async function getMarketsBySlug(eventTicker) {
    try {
        // Kalshi API expects uppercase tickers, but URLs use lowercase
        const normalizedTicker = eventTicker.toUpperCase();
        const url = `https://api.elections.kalshi.com/trade-api/v2/events/${normalizedTicker}`;
        const response = await axios_1.default.get(url, {
            params: { with_nested_markets: true }
        });
        const event = response.data.event;
        if (!event)
            return [];
        // Enrichment: Fetch series tags if they exist
        if (event.series_ticker) {
            try {
                const seriesUrl = `${utils_1.KALSHI_SERIES_URL}/${event.series_ticker}`;
                const seriesResponse = await axios_1.default.get(seriesUrl);
                const series = seriesResponse.data.series;
                if (series && series.tags && series.tags.length > 0) {
                    if (!event.tags || event.tags.length === 0) {
                        event.tags = series.tags;
                    }
                }
            }
            catch (e) {
                // Ignore errors fetching series info - non-critical
            }
        }
        const unifiedMarkets = [];
        const markets = event.markets || [];
        for (const market of markets) {
            const unifiedMarket = (0, utils_1.mapMarketToUnified)(event, market);
            if (unifiedMarket) {
                unifiedMarkets.push(unifiedMarket);
            }
        }
        return unifiedMarkets;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                throw new Error(`Kalshi event not found: "${eventTicker}". Check that the event ticker is correct.`);
            }
            const apiError = error.response.data?.error || error.response.data?.message || "Unknown API Error";
            throw new Error(`Kalshi API Error (${error.response.status}): ${apiError}. Event Ticker: ${eventTicker}`);
        }
        console.error(`Unexpected error fetching Kalshi event ${eventTicker}:`, error);
        throw error;
    }
}
