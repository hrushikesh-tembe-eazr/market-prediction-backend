"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMarkets = searchMarkets;
const fetchMarkets_1 = require("./fetchMarkets");
async function searchMarkets(query, params) {
    // We must fetch ALL markets to search them locally since we don't have server-side search
    const fetchLimit = 100000;
    try {
        const markets = await (0, fetchMarkets_1.fetchMarkets)({ ...params, limit: fetchLimit });
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
        const limit = params?.limit || 20;
        return filtered.slice(0, limit);
    }
    catch (error) {
        console.error("Error searching Kalshi data:", error);
        return [];
    }
}
