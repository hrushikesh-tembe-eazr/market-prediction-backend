"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketsBySlug = getMarketsBySlug;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
/**
 * Fetch specific markets by their URL slug.
 * Useful for looking up a specific event from a URL.
 * @param slug - The event slug (e.g. "will-fed-cut-rates-in-march")
 */
async function getMarketsBySlug(slug) {
    try {
        const response = await axios_1.default.get(utils_1.GAMMA_API_URL, {
            params: { slug: slug }
        });
        const events = response.data;
        if (!events || events.length === 0)
            return [];
        const unifiedMarkets = [];
        for (const event of events) {
            if (!event.markets)
                continue;
            for (const market of event.markets) {
                const unifiedMarket = (0, utils_1.mapMarketToUnified)(event, market, { useQuestionAsCandidateFallback: true });
                if (unifiedMarket) {
                    unifiedMarkets.push(unifiedMarket);
                }
            }
        }
        return unifiedMarkets;
    }
    catch (error) {
        console.error(`Error fetching Polymarket slug ${slug}:`, error);
        return [];
    }
}
