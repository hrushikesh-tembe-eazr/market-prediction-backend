import { HistoryFilterParams } from '../../BaseExchange';
import { PriceCandle } from '../../types';
export declare function fetchOHLCV(id: string, params: HistoryFilterParams): Promise<PriceCandle[]>;
