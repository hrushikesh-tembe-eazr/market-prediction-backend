import { PredictionMarketExchange, MarketFilterParams, HistoryFilterParams, ExchangeCredentials } from '../../BaseExchange';
import { UnifiedMarket, PriceCandle, OrderBook, Trade, Balance, Order, Position, CreateOrderParams } from '../../types';
export declare class KalshiExchange extends PredictionMarketExchange {
    private auth?;
    constructor(credentials?: ExchangeCredentials);
    get name(): string;
    private ensureAuth;
    fetchMarkets(params?: MarketFilterParams): Promise<UnifiedMarket[]>;
    searchMarkets(query: string, params?: MarketFilterParams): Promise<UnifiedMarket[]>;
    getMarketsBySlug(slug: string): Promise<UnifiedMarket[]>;
    fetchOHLCV(id: string, params: HistoryFilterParams): Promise<PriceCandle[]>;
    fetchOrderBook(id: string): Promise<OrderBook>;
    fetchTrades(id: string, params: HistoryFilterParams): Promise<Trade[]>;
    fetchBalance(): Promise<Balance[]>;
    createOrder(params: CreateOrderParams): Promise<Order>;
    cancelOrder(orderId: string): Promise<Order>;
    fetchOrder(orderId: string): Promise<Order>;
    fetchOpenOrders(marketId?: string): Promise<Order[]>;
    fetchPositions(): Promise<Position[]>;
    private mapKalshiOrderStatus;
}
