"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrderBook = fetchOrderBook;
const axios_1 = __importDefault(require("axios"));
async function fetchOrderBook(id) {
    try {
        const ticker = id.replace(/-NO$/, '');
        const url = `https://api.elections.kalshi.com/trade-api/v2/markets/${ticker}/orderbook`;
        const response = await axios_1.default.get(url);
        const data = response.data.orderbook;
        // Structure: { yes: [[price, qty], ...], no: [[price, qty], ...] }
        const bids = (data.yes || []).map((level) => ({
            price: level[0] / 100,
            size: level[1]
        }));
        const asks = (data.no || []).map((level) => ({
            price: (100 - level[0]) / 100,
            size: level[1]
        }));
        // Sort bids desc, asks asc
        bids.sort((a, b) => b.price - a.price);
        asks.sort((a, b) => a.price - b.price);
        return { bids, asks, timestamp: Date.now() };
    }
    catch (error) {
        console.error(`Error fetching Kalshi orderbook for ${id}:`, error);
        return { bids: [], asks: [] };
    }
}
