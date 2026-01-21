import { ClobClient } from '@polymarket/clob-client';
import type { ApiKeyCreds } from '@polymarket/clob-client';
import { ExchangeCredentials } from '../../BaseExchange';
/**
 * Manages Polymarket authentication and CLOB client initialization.
 * Handles both L1 (wallet-based) and L2 (API credentials) authentication.
 */
export declare class PolymarketAuth {
    private credentials;
    private signer?;
    private clobClient?;
    private apiCreds?;
    constructor(credentials: ExchangeCredentials);
    /**
     * Get or create API credentials using L1 authentication.
     * This uses the private key to derive/create API credentials.
     */
    getApiCredentials(): Promise<ApiKeyCreds>;
    /**
     * Get an authenticated CLOB client for L2 operations (trading).
     * This client can place orders, cancel orders, query positions, etc.
     */
    getClobClient(): Promise<ClobClient>;
    /**
     * Get the signer's address.
     */
    getAddress(): string;
    /**
     * Reset cached credentials and client (useful for testing or credential rotation).
     */
    reset(): void;
}
