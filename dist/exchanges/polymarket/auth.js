"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolymarketAuth = void 0;
const clob_client_1 = require("@polymarket/clob-client");
const ethers_1 = require("ethers");
const POLYMARKET_HOST = 'https://clob.polymarket.com';
const POLYGON_CHAIN_ID = 137;
/**
 * Manages Polymarket authentication and CLOB client initialization.
 * Handles both L1 (wallet-based) and L2 (API credentials) authentication.
 */
class PolymarketAuth {
    constructor(credentials) {
        this.credentials = credentials;
        if (!credentials.privateKey) {
            throw new Error('Polymarket requires a privateKey for authentication');
        }
        // Initialize the signer
        this.signer = new ethers_1.Wallet(credentials.privateKey);
    }
    /**
     * Get or create API credentials using L1 authentication.
     * This uses the private key to derive/create API credentials.
     */
    async getApiCredentials() {
        // Return cached credentials if available
        if (this.apiCreds) {
            return this.apiCreds;
        }
        // If credentials were provided, use them
        if (this.credentials.apiKey && this.credentials.apiSecret && this.credentials.passphrase) {
            this.apiCreds = {
                key: this.credentials.apiKey,
                secret: this.credentials.apiSecret,
                passphrase: this.credentials.passphrase,
            };
            return this.apiCreds;
        }
        // Otherwise, derive/create them using L1 auth
        const l1Client = new clob_client_1.ClobClient(POLYMARKET_HOST, POLYGON_CHAIN_ID, this.signer);
        // Robust derivation strategy:
        // 1. Try to DERIVE existing credentials first (most common case).
        // 2. If that fails (e.g. 404 or 400), try to CREATE new ones.
        let creds;
        try {
            // console.log('Trying to derive existing API key...');
            creds = await l1Client.deriveApiKey();
        }
        catch (deriveError) {
            // console.log('Derivation failed, trying to create new API key...');
            try {
                creds = await l1Client.createApiKey();
            }
            catch (createError) {
                console.error('Failed to both derive and create API key:', createError?.message || createError);
                throw new Error('Authentication failed: Could not create or derive API key.');
            }
        }
        if (!creds) {
            throw new Error('Authentication failed: Credentials are empty.');
        }
        this.apiCreds = creds;
        return creds;
    }
    /**
     * Get an authenticated CLOB client for L2 operations (trading).
     * This client can place orders, cancel orders, query positions, etc.
     */
    async getClobClient() {
        // Return cached client if available
        if (this.clobClient) {
            return this.clobClient;
        }
        // Get API credentials (L1 auth)
        const apiCreds = await this.getApiCredentials();
        // Determine signature type (default to EOA = 0)
        const signatureType = this.credentials.signatureType ?? 0;
        // Determine funder address (defaults to signer's address)
        const funderAddress = this.credentials.funderAddress ?? this.signer.address;
        // Create L2-authenticated client
        this.clobClient = new clob_client_1.ClobClient(POLYMARKET_HOST, POLYGON_CHAIN_ID, this.signer, apiCreds, signatureType, funderAddress);
        return this.clobClient;
    }
    /**
     * Get the signer's address.
     */
    getAddress() {
        return this.signer.address;
    }
    /**
     * Reset cached credentials and client (useful for testing or credential rotation).
     */
    reset() {
        this.apiCreds = undefined;
        this.clobClient = undefined;
    }
}
exports.PolymarketAuth = PolymarketAuth;
