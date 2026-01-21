"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMarkets = searchMarkets;
const fetchMarkets_1 = require("./fetchMarkets");
async function searchMarkets(query, params) {
    // Polymarket Gamma API doesn't support native search
    // Fetch all active markets and filter client-side
    const searchLimit = 100000; // Fetch all markets for comprehensive search
    try {
        // Fetch markets with a higher limit
        const markets = await (0, fetchMarkets_1.fetchMarkets)({
            ...params,
            limit: searchLimit
        });
        // Client-side text filtering
        const lowerQuery = query.toLowerCase();
        const searchIn = params?.searchIn || 'title'; // Default to title-only search
        const filtered = markets.filter(market => {
            const titleMatch = (market.title || '').toLowerCase().includes(lowerQuery);
            const descMatch = (market.description || '').toLowerCase().includes(lowerQuery);
            if (searchIn === 'title')
                return titleMatch;
            if (searchIn === 'description')
                return descMatch;
            return titleMatch || descMatch; // 'both'
        });
        // Apply limit to filtered results
        const limit = params?.limit || 20;
        return filtered.slice(0, limit);
    }
    catch (error) {
        console.error("Error searching Polymarket data:", error);
        return [];
    }
}
