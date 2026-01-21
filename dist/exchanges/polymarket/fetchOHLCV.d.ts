import { HistoryFilterParams } from '../../BaseExchange';
import { PriceCandle } from '../../types';
/**
 * Fetch historical price data (OHLCV candles) for a specific token.
 * @param id - The CLOB token ID (e.g., outcome token ID)
 */
export declare function fetchOHLCV(id: string, params: HistoryFilterParams): Promise<PriceCandle[]>;
