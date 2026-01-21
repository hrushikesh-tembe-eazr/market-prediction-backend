"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMarkets = fetchMarkets;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
async function fetchMarkets(params) {
    const limit = params?.limit || 200; // Higher default for better coverage
    const offset = params?.offset || 0;
    // Map generic sort params to Polymarket Gamma API params
    let queryParams = {
        active: 'true',
        closed: 'false',
        limit: limit,
        offset: offset,
    };
    // Gamma API uses 'order' and 'ascending' for sorting
    if (params?.sort === 'volume') {
        queryParams.order = 'volume';
        queryParams.ascending = 'false';
    }
    else if (params?.sort === 'newest') {
        queryParams.order = 'startDate';
        queryParams.ascending = 'false';
    }
    else if (params?.sort === 'liquidity') {
        // queryParams.order = 'liquidity';
    }
    else {
        // Default: do not send order param to avoid 422
    }
    try {
        // Fetch active events from Gamma
        const response = await axios_1.default.get(utils_1.GAMMA_API_URL, {
            params: queryParams
        });
        const events = response.data;
        const unifiedMarkets = [];
        for (const event of events) {
            // Each event is a container (e.g. "US Election"). 
            // It contains specific "markets" (e.g. "Winner", "Pop Vote").
            if (!event.markets)
                continue;
            for (const market of event.markets) {
                const unifiedMarket = (0, utils_1.mapMarketToUnified)(event, market);
                if (unifiedMarket) {
                    unifiedMarkets.push(unifiedMarket);
                }
            }
        }
        // Client-side Sort capability to ensure contract fulfillment
        // Often API filters are "good effort" or apply to the 'event' but not the 'market'
        if (params?.sort === 'volume') {
            unifiedMarkets.sort((a, b) => b.volume24h - a.volume24h);
        }
        else if (params?.sort === 'newest') {
            // unifiedMarkets.sort((a, b) => b.resolutionDate.getTime() - a.resolutionDate.getTime()); // Not quite 'newest'
        }
        else if (params?.sort === 'liquidity') {
            unifiedMarkets.sort((a, b) => b.liquidity - a.liquidity);
        }
        else {
            // Default volume sort
            unifiedMarkets.sort((a, b) => b.volume24h - a.volume24h);
        }
        // Respect limit strictly after flattening 
        return unifiedMarkets.slice(0, limit);
    }
    catch (error) {
        console.error("Error fetching Polymarket data:", error);
        return [];
    }
}
