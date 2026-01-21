"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrderBook = fetchOrderBook;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
/**
 * Fetch the current order book for a specific token.
 * @param id - The CLOB token ID
 */
async function fetchOrderBook(id) {
    try {
        const response = await axios_1.default.get(`${utils_1.CLOB_API_URL}/book`, {
            params: { token_id: id }
        });
        const data = response.data;
        // Response format: { bids: [{price: "0.52", size: "100"}], asks: [...] }
        const bids = (data.bids || []).map((level) => ({
            price: parseFloat(level.price),
            size: parseFloat(level.size)
        })).sort((a, b) => b.price - a.price); // Sort Bids Descending (Best/Highest first)
        const asks = (data.asks || []).map((level) => ({
            price: parseFloat(level.price),
            size: parseFloat(level.size)
        })).sort((a, b) => a.price - b.price); // Sort Asks Ascending (Best/Lowest first)
        return {
            bids,
            asks,
            timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now()
        };
    }
    catch (error) {
        console.error(`Error fetching Polymarket orderbook for ${id}:`, error);
        return { bids: [], asks: [] };
    }
}
