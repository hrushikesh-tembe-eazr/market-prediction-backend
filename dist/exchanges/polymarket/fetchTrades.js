"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTrades = fetchTrades;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
/**
 * Fetch raw trade history for a specific token.
 * @param id - The CLOB token ID
 *
 * NOTE: Polymarket's /trades endpoint currently requires L2 Authentication (API Key).
 * This method will return an empty array if an API key is not provided in headers.
 * Use fetchOHLCV for public historical price data instead.
 */
async function fetchTrades(id, params) {
    // ID Validation
    if (id.length < 10 && /^\d+$/.test(id)) {
        throw new Error(`Invalid ID for Polymarket trades: "${id}". You provided a Market ID, but Polymarket's CLOB API requires a Token ID.`);
    }
    try {
        const queryParams = {
            market: id
        };
        // Add time filters if provided
        if (params.start) {
            queryParams.after = Math.floor(params.start.getTime() / 1000);
        }
        if (params.end) {
            queryParams.before = Math.floor(params.end.getTime() / 1000);
        }
        const response = await axios_1.default.get(`${utils_1.CLOB_API_URL}/trades`, {
            params: queryParams
        });
        // Response is an array of trade objects
        const trades = response.data || [];
        const mappedTrades = trades.map((trade) => ({
            id: trade.id || `${trade.timestamp}-${trade.price}`,
            timestamp: trade.timestamp * 1000, // Convert to milliseconds
            price: parseFloat(trade.price),
            amount: parseFloat(trade.size || trade.amount || 0),
            side: trade.side === 'BUY' ? 'buy' : trade.side === 'SELL' ? 'sell' : 'unknown'
        }));
        // Apply limit if specified
        if (params.limit && mappedTrades.length > params.limit) {
            return mappedTrades.slice(-params.limit); // Return most recent N trades
        }
        return mappedTrades;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            const apiError = error.response.data?.error || error.response.data?.message || "Unknown API Error";
            throw new Error(`Polymarket Trades API Error (${error.response.status}): ${apiError}. Used ID: ${id}`);
        }
        console.error(`Unexpected error fetching Polymarket trades for ${id}:`, error);
        throw error;
    }
}
