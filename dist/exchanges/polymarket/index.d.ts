import { PredictionMarketExchange, MarketFilterParams, HistoryFilterParams, ExchangeCredentials } from '../../BaseExchange';
import { UnifiedMarket, PriceCandle, OrderBook, Trade, Order, Position, Balance, CreateOrderParams } from '../../types';
export declare class PolymarketExchange extends PredictionMarketExchange {
    private auth?;
    constructor(credentials?: ExchangeCredentials);
    get name(): string;
    fetchMarkets(params?: MarketFilterParams): Promise<UnifiedMarket[]>;
    searchMarkets(query: string, params?: MarketFilterParams): Promise<UnifiedMarket[]>;
    getMarketsBySlug(slug: string): Promise<UnifiedMarket[]>;
    fetchOHLCV(id: string, params: HistoryFilterParams): Promise<PriceCandle[]>;
    fetchOrderBook(id: string): Promise<OrderBook>;
    fetchTrades(id: string, params: HistoryFilterParams): Promise<Trade[]>;
    /**
     * Ensure authentication is initialized before trading operations.
     */
    private ensureAuth;
    createOrder(params: CreateOrderParams): Promise<Order>;
    cancelOrder(orderId: string): Promise<Order>;
    fetchOrder(orderId: string): Promise<Order>;
    fetchOpenOrders(marketId?: string): Promise<Order[]>;
    fetchPositions(): Promise<Position[]>;
    fetchBalance(): Promise<Balance[]>;
}
