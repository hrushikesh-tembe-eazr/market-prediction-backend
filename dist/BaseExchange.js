"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionMarketExchange = void 0;
// ----------------------------------------------------------------------------
// Base Exchange Class
// ----------------------------------------------------------------------------
class PredictionMarketExchange {
    constructor(credentials) {
        this.credentials = credentials;
    }
    /**
     * Fetch historical price data for a specific market outcome.
     * @param id - The Outcome ID (MarketOutcome.id). This should be the ID of the specific tradeable asset.
     */
    async fetchOHLCV(id, params) {
        throw new Error("Method fetchOHLCV not implemented.");
    }
    /**
     * Fetch the current order book (bids/asks) for a specific outcome.
     * Essential for calculating localized spread and depth.
     */
    async fetchOrderBook(id) {
        throw new Error("Method fetchOrderBook not implemented.");
    }
    /**
     * Fetch raw trade history.
     */
    async fetchTrades(id, params) {
        throw new Error("Method fetchTrades not implemented.");
    }
    // ----------------------------------------------------------------------------
    // Trading Methods
    // ----------------------------------------------------------------------------
    /**
     * Place a new order.
     */
    async createOrder(params) {
        throw new Error("Method createOrder not implemented.");
    }
    /**
     * Cancel an existing order.
     */
    async cancelOrder(orderId) {
        throw new Error("Method cancelOrder not implemented.");
    }
    /**
     * Fetch a specific order by ID.
     */
    async fetchOrder(orderId) {
        throw new Error("Method fetchOrder not implemented.");
    }
    /**
     * Fetch all open orders.
     * @param marketId - Optional filter by market.
     */
    async fetchOpenOrders(marketId) {
        throw new Error("Method fetchOpenOrders not implemented.");
    }
    /**
     * Fetch current user positions.
     */
    async fetchPositions() {
        throw new Error("Method fetchPositions not implemented.");
    }
    /**
     * Fetch account balances.
     */
    async fetchBalance() {
        throw new Error("Method fetchBalance not implemented.");
    }
}
exports.PredictionMarketExchange = PredictionMarketExchange;
