import { UnifiedMarket, CandleInterval } from '../../types';
export declare const GAMMA_API_URL = "https://gamma-api.polymarket.com/events";
export declare const CLOB_API_URL = "https://clob.polymarket.com";
export declare function mapMarketToUnified(event: any, market: any, options?: {
    useQuestionAsCandidateFallback?: boolean;
}): UnifiedMarket | null;
export declare function mapIntervalToFidelity(interval: CandleInterval): number;
