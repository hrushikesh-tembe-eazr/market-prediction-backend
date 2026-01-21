import { UnifiedMarket } from '../../types';
/**
 * Fetch specific markets by their event ticker.
 * Useful for looking up a specific event from a URL.
 * @param eventTicker - The event ticker (e.g. "FED-25JAN" or "PRES-2024")
 */
export declare function getMarketsBySlug(eventTicker: string): Promise<UnifiedMarket[]>;
