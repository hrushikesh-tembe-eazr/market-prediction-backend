import { UnifiedMarket } from '../../types';
/**
 * Fetch specific markets by their URL slug.
 * Useful for looking up a specific event from a URL.
 * @param slug - The event slug (e.g. "will-fed-cut-rates-in-march")
 */
export declare function getMarketsBySlug(slug: string): Promise<UnifiedMarket[]>;
