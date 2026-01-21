"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const polymarket_1 = require("../exchanges/polymarket");
const kalshi_1 = require("../exchanges/kalshi");
const deepseek_1 = require("../ai/deepseek");
// Singleton instances for local usage (when no credentials provided)
const defaultExchanges = {
    polymarket: null,
    kalshi: null
};
async function startServer(port) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });
    // AI Endpoints
    // Use server-side API key from environment, or allow client to provide their own
    const getAiApiKey = (clientKey) => clientKey || process.env.DEEPSEEK_API_KEY;
    // Analyze a single market
    app.post('/api/ai/analyze', async (req, res, next) => {
        try {
            const { market, apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);
            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }
            if (!market) {
                res.status(400).json({ success: false, error: { message: 'Market data is required' } });
                return;
            }
            const messages = (0, deepseek_1.createMarketAnalysisPrompt)(market);
            const analysis = await (0, deepseek_1.chatWithDeepSeek)(messages, effectiveApiKey);
            res.json({ success: true, data: { analysis } });
        }
        catch (error) {
            next(error);
        }
    });
    // Compare multiple markets
    app.post('/api/ai/compare', async (req, res, next) => {
        try {
            const { markets, apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);
            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }
            if (!markets || !Array.isArray(markets) || markets.length < 2) {
                res.status(400).json({ success: false, error: { message: 'At least 2 markets are required for comparison' } });
                return;
            }
            const messages = (0, deepseek_1.createComparisonPrompt)(markets);
            const comparison = await (0, deepseek_1.chatWithDeepSeek)(messages, effectiveApiKey);
            res.json({ success: true, data: { comparison } });
        }
        catch (error) {
            next(error);
        }
    });
    // General chat about markets
    app.post('/api/ai/chat', async (req, res, next) => {
        try {
            const { message, marketContext, apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);
            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }
            if (!message) {
                res.status(400).json({ success: false, error: { message: 'Message is required' } });
                return;
            }
            const messages = (0, deepseek_1.createChatPrompt)(message, marketContext);
            const response = await (0, deepseek_1.chatWithDeepSeek)(messages, effectiveApiKey);
            res.json({ success: true, data: { response } });
        }
        catch (error) {
            next(error);
        }
    });
    // API endpoint: POST /api/:exchange/:method
    // Body: { args: any[], credentials?: ExchangeCredentials }
    app.post('/api/:exchange/:method', async (req, res, next) => {
        try {
            const exchangeName = req.params.exchange.toLowerCase();
            const methodName = req.params.method;
            const args = Array.isArray(req.body.args) ? req.body.args : [];
            const credentials = req.body.credentials;
            // 1. Get or Initialize Exchange
            // If credentials are provided, create a new instance for this request
            // Otherwise, use the singleton instance
            let exchange;
            if (credentials && (credentials.privateKey || credentials.apiKey)) {
                exchange = createExchange(exchangeName, credentials);
            }
            else {
                if (!defaultExchanges[exchangeName]) {
                    defaultExchanges[exchangeName] = createExchange(exchangeName);
                }
                exchange = defaultExchanges[exchangeName];
            }
            // 2. Validate Method
            if (typeof exchange[methodName] !== 'function') {
                res.status(404).json({ success: false, error: `Method '${methodName}' not found on ${exchangeName}` });
                return;
            }
            // 3. Execute with direct argument spreading
            const result = await exchange[methodName](...args);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    });
    // Error handler
    app.use((error, req, res, next) => {
        console.error('Error:', error);
        res.status(error.status || 500).json({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                // stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    });
    return app.listen(port);
}
function createExchange(name, credentials) {
    switch (name) {
        case 'polymarket':
            return new polymarket_1.PolymarketExchange({
                privateKey: credentials?.privateKey || process.env.POLYMARKET_PK || process.env.POLYMARKET_PRIVATE_KEY,
                apiKey: credentials?.apiKey || process.env.POLYMARKET_API_KEY,
                apiSecret: credentials?.apiSecret || process.env.POLYMARKET_API_SECRET,
                passphrase: credentials?.passphrase || process.env.POLYMARKET_PASSPHRASE
            });
        case 'kalshi':
            return new kalshi_1.KalshiExchange({
                apiKey: credentials?.apiKey || process.env.KALSHI_API_KEY,
                privateKey: credentials?.privateKey || process.env.KALSHI_PRIVATE_KEY
            });
        default:
            throw new Error(`Unknown exchange: ${name}`);
    }
}
