import { UnifiedMarket, PriceCandle, CandleInterval, OrderBook, Trade, Order, Position, Balance, CreateOrderParams } from './types';
export interface MarketFilterParams {
    limit?: number;
    offset?: number;
    sort?: 'volume' | 'liquidity' | 'newest';
    searchIn?: 'title' | 'description' | 'both';
}
export interface HistoryFilterParams {
    resolution: CandleInterval;
    start?: Date;
    end?: Date;
    limit?: number;
}
export interface ExchangeCredentials {
    apiKey?: string;
    apiSecret?: string;
    passphrase?: string;
    privateKey?: string;
    signatureType?: number;
    funderAddress?: string;
}
export declare abstract class PredictionMarketExchange {
    protected credentials?: ExchangeCredentials;
    constructor(credentials?: ExchangeCredentials);
    abstract get name(): string;
    /**
     * Fetch all relevant markets from the source.
     */
    abstract fetchMarkets(params?: MarketFilterParams): Promise<UnifiedMarket[]>;
    /**
     * Search for markets matching a keyword query.
     * By default, searches only in market titles. Use params.searchIn to search descriptions or both.
     */
    abstract searchMarkets(query: string, params?: MarketFilterParams): Promise<UnifiedMarket[]>;
    /**
     * Fetch historical price data for a specific market outcome.
     * @param id - The Outcome ID (MarketOutcome.id). This should be the ID of the specific tradeable asset.
     */
    fetchOHLCV(id: string, params: HistoryFilterParams): Promise<PriceCandle[]>;
    /**
     * Fetch the current order book (bids/asks) for a specific outcome.
     * Essential for calculating localized spread and depth.
     */
    fetchOrderBook(id: string): Promise<OrderBook>;
    /**
     * Fetch raw trade history.
     */
    fetchTrades(id: string, params: HistoryFilterParams): Promise<Trade[]>;
    /**
     * Place a new order.
     */
    createOrder(params: CreateOrderParams): Promise<Order>;
    /**
     * Cancel an existing order.
     */
    cancelOrder(orderId: string): Promise<Order>;
    /**
     * Fetch a specific order by ID.
     */
    fetchOrder(orderId: string): Promise<Order>;
    /**
     * Fetch all open orders.
     * @param marketId - Optional filter by market.
     */
    fetchOpenOrders(marketId?: string): Promise<Order[]>;
    /**
     * Fetch current user positions.
     */
    fetchPositions(): Promise<Position[]>;
    /**
     * Fetch account balances.
     */
    fetchBalance(): Promise<Balance[]>;
}
