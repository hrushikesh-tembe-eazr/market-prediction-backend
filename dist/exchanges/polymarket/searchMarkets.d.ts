import { MarketFilterParams } from '../../BaseExchange';
import { UnifiedMarket } from '../../types';
export declare function searchMarkets(query: string, params?: MarketFilterParams): Promise<UnifiedMarket[]>;
