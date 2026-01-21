import { UnifiedMarket, CandleInterval } from '../../types';
export declare const KALSHI_API_URL = "https://api.elections.kalshi.com/trade-api/v2/events";
export declare const KALSHI_SERIES_URL = "https://api.elections.kalshi.com/trade-api/v2/series";
export declare function mapMarketToUnified(event: any, market: any): UnifiedMarket | null;
export declare function mapIntervalToKalshi(interval: CandleInterval): number;
