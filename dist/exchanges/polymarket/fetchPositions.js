"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPositions = fetchPositions;
const axios_1 = __importDefault(require("axios"));
const DATA_API_URL = 'https://data-api.polymarket.com';
async function fetchPositions(userAddress) {
    const response = await axios_1.default.get(`${DATA_API_URL}/positions`, {
        params: {
            user: userAddress,
            limit: 100
        }
    });
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((p) => ({
        marketId: p.conditionId,
        outcomeId: p.asset,
        outcomeLabel: p.outcome || 'Unknown',
        size: parseFloat(p.size),
        entryPrice: parseFloat(p.avgPrice),
        currentPrice: parseFloat(p.curPrice || '0'),
        unrealizedPnL: parseFloat(p.cashPnl || '0'),
        realizedPnL: parseFloat(p.realizedPnl || '0')
    }));
}
