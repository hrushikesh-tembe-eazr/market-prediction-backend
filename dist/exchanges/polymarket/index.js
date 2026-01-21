"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolymarketExchange = void 0;
const BaseExchange_1 = require("../../BaseExchange");
const fetchMarkets_1 = require("./fetchMarkets");
const searchMarkets_1 = require("./searchMarkets");
const getMarketsBySlug_1 = require("./getMarketsBySlug");
const fetchOHLCV_1 = require("./fetchOHLCV");
const fetchOrderBook_1 = require("./fetchOrderBook");
const fetchTrades_1 = require("./fetchTrades");
const fetchPositions_1 = require("./fetchPositions");
const auth_1 = require("./auth");
const clob_client_1 = require("@polymarket/clob-client");
class PolymarketExchange extends BaseExchange_1.PredictionMarketExchange {
    constructor(credentials) {
        super(credentials);
        // Initialize auth if credentials are provided
        if (credentials?.privateKey) {
            this.auth = new auth_1.PolymarketAuth(credentials);
        }
    }
    get name() {
        return 'Polymarket';
    }
    async fetchMarkets(params) {
        return (0, fetchMarkets_1.fetchMarkets)(params);
    }
    async searchMarkets(query, params) {
        return (0, searchMarkets_1.searchMarkets)(query, params);
    }
    async getMarketsBySlug(slug) {
        return (0, getMarketsBySlug_1.getMarketsBySlug)(slug);
    }
    async fetchOHLCV(id, params) {
        return (0, fetchOHLCV_1.fetchOHLCV)(id, params);
    }
    async fetchOrderBook(id) {
        return (0, fetchOrderBook_1.fetchOrderBook)(id);
    }
    async fetchTrades(id, params) {
        return (0, fetchTrades_1.fetchTrades)(id, params);
    }
    // ----------------------------------------------------------------------------
    // Trading Methods
    // ----------------------------------------------------------------------------
    /**
     * Ensure authentication is initialized before trading operations.
     */
    ensureAuth() {
        if (!this.auth) {
            throw new Error('Trading operations require authentication. ' +
                'Initialize PolymarketExchange with credentials: new PolymarketExchange({ privateKey: "0x..." })');
        }
        return this.auth;
    }
    async createOrder(params) {
        const auth = this.ensureAuth();
        const client = await auth.getClobClient();
        // Map side to Polymarket enum
        const side = params.side.toUpperCase() === 'BUY' ? clob_client_1.Side.BUY : clob_client_1.Side.SELL;
        // For limit orders, price is required
        if (params.type === 'limit' && !params.price) {
            throw new Error('Price is required for limit orders');
        }
        // For market orders, use max slippage: 0.99 for BUY (willing to pay up to 99%), 0.01 for SELL (willing to accept down to 1%)
        const price = params.price || (side === clob_client_1.Side.BUY ? 0.99 : 0.01);
        try {
            // We use createAndPostOrder which handles signing and posting
            const response = await client.createAndPostOrder({
                tokenID: params.outcomeId,
                price: price,
                side: side,
                size: params.amount,
                feeRateBps: 0,
            }, {
                tickSize: "0.01"
            });
            if (!response || !response.success) {
                throw new Error(response?.errorMsg || 'Order placement failed');
            }
            return {
                id: response.orderID,
                marketId: params.marketId,
                outcomeId: params.outcomeId,
                side: params.side,
                type: params.type,
                price: price,
                amount: params.amount,
                status: 'open',
                filled: 0,
                remaining: params.amount,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error("Polymarket createOrder error:", error);
            throw error;
        }
    }
    async cancelOrder(orderId) {
        const auth = this.ensureAuth();
        const client = await auth.getClobClient();
        try {
            await client.cancelOrder({ orderID: orderId });
            return {
                id: orderId,
                marketId: 'unknown',
                outcomeId: 'unknown',
                side: 'buy',
                type: 'limit',
                amount: 0,
                status: 'cancelled',
                filled: 0,
                remaining: 0,
                timestamp: Date.now()
            };
        }
        catch (error) {
            console.error("Polymarket cancelOrder error:", error);
            throw error;
        }
    }
    async fetchOrder(orderId) {
        const auth = this.ensureAuth();
        const client = await auth.getClobClient();
        try {
            const order = await client.getOrder(orderId);
            return {
                id: order.id,
                marketId: order.market || 'unknown',
                outcomeId: order.asset_id,
                side: order.side.toLowerCase(),
                type: order.order_type === 'GTC' ? 'limit' : 'market',
                price: parseFloat(order.price),
                amount: parseFloat(order.original_size),
                status: order.status, // Needs precise mapping
                filled: parseFloat(order.size_matched),
                remaining: parseFloat(order.original_size) - parseFloat(order.size_matched),
                timestamp: order.created_at * 1000
            };
        }
        catch (error) {
            console.error("Polymarket fetchOrder error:", error);
            throw error;
        }
    }
    async fetchOpenOrders(marketId) {
        const auth = this.ensureAuth();
        const client = await auth.getClobClient();
        try {
            const orders = await client.getOpenOrders({
                market: marketId
            });
            return orders.map((o) => ({
                id: o.id,
                marketId: o.market || 'unknown',
                outcomeId: o.asset_id,
                side: o.side.toLowerCase(),
                type: 'limit',
                price: parseFloat(o.price),
                amount: parseFloat(o.original_size),
                status: 'open',
                filled: parseFloat(o.size_matched),
                remaining: parseFloat(o.size_left || (parseFloat(o.original_size) - parseFloat(o.size_matched))),
                timestamp: o.created_at * 1000
            }));
        }
        catch (error) {
            console.error("Polymarket fetchOpenOrders error:", error);
            return [];
        }
    }
    async fetchPositions() {
        const auth = this.ensureAuth();
        const address = auth.getAddress();
        return (0, fetchPositions_1.fetchPositions)(address);
    }
    async fetchBalance() {
        const auth = this.ensureAuth();
        const client = await auth.getClobClient();
        try {
            // 1. Fetch raw collateral balance (USDC)
            // Polymarket relies strictly on USDC (Polygon) which has 6 decimals.
            const USDC_DECIMALS = 6;
            const balRes = await client.getBalanceAllowance({
                asset_type: clob_client_1.AssetType.COLLATERAL
            });
            const rawBalance = parseFloat(balRes.balance);
            const total = rawBalance / Math.pow(10, USDC_DECIMALS);
            // 2. Fetch open orders to calculate locked funds
            // We only care about BUY orders for USDC balance locking
            const openOrders = await client.getOpenOrders({});
            let locked = 0;
            if (openOrders && Array.isArray(openOrders)) {
                for (const order of openOrders) {
                    if (order.side === clob_client_1.Side.BUY) {
                        const remainingSize = parseFloat(order.original_size) - parseFloat(order.size_matched);
                        const price = parseFloat(order.price);
                        locked += remainingSize * price;
                    }
                }
            }
            return [{
                    currency: 'USDC',
                    total: total,
                    available: total - locked, // Available for new trades
                    locked: locked
                }];
        }
        catch (error) {
            console.error("Polymarket fetchBalance error:", error);
            throw error;
        }
    }
}
exports.PolymarketExchange = PolymarketExchange;
