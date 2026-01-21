import { MarketFilterParams } from '../../BaseExchange';
import { UnifiedMarket } from '../../types';
export declare function resetCache(): void;
export declare function fetchMarkets(params?: MarketFilterParams): Promise<UnifiedMarket[]>;
