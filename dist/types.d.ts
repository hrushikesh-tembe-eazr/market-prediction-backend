export interface MarketOutcome {
    id: string;
    label: string;
    price: number;
    priceChange24h?: number;
    metadata?: Record<string, any>;
}
export interface UnifiedMarket {
    id: string;
    title: string;
    description: string;
    outcomes: MarketOutcome[];
    resolutionDate: Date;
    volume24h: number;
    volume?: number;
    liquidity: number;
    openInterest?: number;
    url: string;
    image?: string;
    category?: string;
    tags?: string[];
}
export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
export interface PriceCandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
export interface OrderLevel {
    price: number;
    size: number;
}
export interface OrderBook {
    bids: OrderLevel[];
    asks: OrderLevel[];
    timestamp?: number;
}
export interface Trade {
    id: string;
    timestamp: number;
    price: number;
    amount: number;
    side: 'buy' | 'sell' | 'unknown';
}
export interface Order {
    id: string;
    marketId: string;
    outcomeId: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    price?: number;
    amount: number;
    status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
    filled: number;
    remaining: number;
    timestamp: number;
    fee?: number;
}
export interface Position {
    marketId: string;
    outcomeId: string;
    outcomeLabel: string;
    size: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    realizedPnL?: number;
}
export interface Balance {
    currency: string;
    total: number;
    available: number;
    locked: number;
}
export interface CreateOrderParams {
    marketId: string;
    outcomeId: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    amount: number;
    price?: number;
}
