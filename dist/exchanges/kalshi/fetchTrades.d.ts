import { HistoryFilterParams } from '../../BaseExchange';
import { Trade } from '../../types';
export declare function fetchTrades(id: string, params: HistoryFilterParams): Promise<Trade[]>;
