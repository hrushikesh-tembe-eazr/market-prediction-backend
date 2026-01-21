import { HistoryFilterParams } from '../../BaseExchange';
import { Trade } from '../../types';
/**
 * Fetch raw trade history for a specific token.
 * @param id - The CLOB token ID
 *
 * NOTE: Polymarket's /trades endpoint currently requires L2 Authentication (API Key).
 * This method will return an empty array if an API key is not provided in headers.
 * Use fetchOHLCV for public historical price data instead.
 */
export declare function fetchTrades(id: string, params: HistoryFilterParams): Promise<Trade[]>;
