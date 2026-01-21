"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTrades = fetchTrades;
const axios_1 = __importDefault(require("axios"));
async function fetchTrades(id, params) {
    try {
        const ticker = id.replace(/-NO$/, '');
        const url = `https://api.elections.kalshi.com/trade-api/v2/markets/trades`;
        const response = await axios_1.default.get(url, {
            params: {
                ticker: ticker,
                limit: params.limit || 100
            }
        });
        const trades = response.data.trades || [];
        return trades.map((t) => ({
            id: t.trade_id,
            timestamp: new Date(t.created_time).getTime(),
            price: t.yes_price / 100,
            amount: t.count,
            side: t.taker_side === 'yes' ? 'buy' : 'sell'
        }));
    }
    catch (error) {
        console.error(`Error fetching Kalshi trades for ${id}:`, error);
        return [];
    }
}
