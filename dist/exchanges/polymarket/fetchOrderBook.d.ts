import { OrderBook } from '../../types';
/**
 * Fetch the current order book for a specific token.
 * @param id - The CLOB token ID
 */
export declare function fetchOrderBook(id: string): Promise<OrderBook>;
