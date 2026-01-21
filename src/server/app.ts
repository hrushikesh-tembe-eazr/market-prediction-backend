import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PolymarketExchange } from '../exchanges/polymarket';
import { KalshiExchange } from '../exchanges/kalshi';
import { ExchangeCredentials } from '../BaseExchange';
import { chatWithDeepSeek, createMarketAnalysisPrompt, createComparisonPrompt, createChatPrompt } from '../ai/deepseek';
import {
    analyzeNewsImpact,
    getPortfolioAdvice,
    detectAnomalies,
    calculateSentimentScore,
    predictPrice,
    generateSmartAlerts,
    explainMarket
} from '../ai/advanced-features';

// Singleton instances for local usage (when no credentials provided)
const defaultExchanges: Record<string, any> = {
    polymarket: null,
    kalshi: null
};

export async function startServer(port: number) {
    const app: Express = express();

    app.use(cors());
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    // AI Endpoints
    // Use server-side API key from environment, or allow client to provide their own
    const getAiApiKey = (clientKey?: string) => clientKey || process.env.DEEPSEEK_API_KEY;

    // Analyze a single market
    app.post('/api/ai/analyze', async (req: Request, res: Response, next: NextFunction) => {
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

            const messages = createMarketAnalysisPrompt(market);
            const analysis = await chatWithDeepSeek(messages, effectiveApiKey);

            res.json({ success: true, data: { analysis } });
        } catch (error: any) {
            next(error);
        }
    });

    // Compare multiple markets
    app.post('/api/ai/compare', async (req: Request, res: Response, next: NextFunction) => {
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

            const messages = createComparisonPrompt(markets);
            const comparison = await chatWithDeepSeek(messages, effectiveApiKey);

            res.json({ success: true, data: { comparison } });
        } catch (error: any) {
            next(error);
        }
    });

    // General chat about markets
    app.post('/api/ai/chat', async (req: Request, res: Response, next: NextFunction) => {
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

            const messages = createChatPrompt(message, marketContext);
            const response = await chatWithDeepSeek(messages, effectiveApiKey);

            res.json({ success: true, data: { response } });
        } catch (error: any) {
            next(error);
        }
    });

    // ============================================
    // ADVANCED AI FEATURES
    // ============================================

    // AI News Correlation - Find news affecting markets
    app.post('/api/ai/news-impact', async (req: Request, res: Response, next: NextFunction) => {
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

            const result = await analyzeNewsImpact(market, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // AI Portfolio Advisor - Smart position recommendations
    app.post('/api/ai/portfolio-advice', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { markets, riskTolerance = 'moderate', apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);

            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }

            if (!markets || !Array.isArray(markets) || markets.length === 0) {
                res.status(400).json({ success: false, error: { message: 'Markets array is required' } });
                return;
            }

            const result = await getPortfolioAdvice(markets, riskTolerance, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // AI Anomaly Detector - Unusual price movements
    app.post('/api/ai/anomalies', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { markets, apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);

            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }

            if (!markets || !Array.isArray(markets) || markets.length === 0) {
                res.status(400).json({ success: false, error: { message: 'Markets array is required' } });
                return;
            }

            const result = await detectAnomalies(markets, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // AI Sentiment Score - Comprehensive market sentiment
    app.post('/api/ai/sentiment', async (req: Request, res: Response, next: NextFunction) => {
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

            const result = await calculateSentimentScore(market, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // AI Price Prediction - With confidence intervals
    app.post('/api/ai/predict', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { market, timeframe = '24h', apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);

            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }

            if (!market) {
                res.status(400).json({ success: false, error: { message: 'Market data is required' } });
                return;
            }

            const result = await predictPrice(market, timeframe, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // AI Smart Alerts - Personalized alert conditions
    app.post('/api/ai/smart-alerts', async (req: Request, res: Response, next: NextFunction) => {
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

            const result = await generateSmartAlerts(market, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // AI Market Explainer - For beginners
    app.post('/api/ai/explain', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { market, expertiseLevel = 'beginner', apiKey } = req.body;
            const effectiveApiKey = getAiApiKey(apiKey);

            if (!effectiveApiKey) {
                res.status(400).json({ success: false, error: { message: 'API key is required' } });
                return;
            }

            if (!market) {
                res.status(400).json({ success: false, error: { message: 'Market data is required' } });
                return;
            }

            const result = await explainMarket(market, expertiseLevel, effectiveApiKey);
            res.json({ success: true, data: result });
        } catch (error: any) {
            next(error);
        }
    });

    // API endpoint: POST /api/:exchange/:method
    // Body: { args: any[], credentials?: ExchangeCredentials }
    app.post('/api/:exchange/:method', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const exchangeName = (req.params.exchange as string).toLowerCase();
            const methodName = req.params.method as string;
            const args = Array.isArray(req.body.args) ? req.body.args : [];
            const credentials = req.body.credentials as ExchangeCredentials | undefined;

            // 1. Get or Initialize Exchange
            // If credentials are provided, create a new instance for this request
            // Otherwise, use the singleton instance
            let exchange: any;
            if (credentials && (credentials.privateKey || credentials.apiKey)) {
                exchange = createExchange(exchangeName, credentials);
            } else {
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
        } catch (error: any) {
            next(error);
        }
    });

    // Error handler
    app.use((error: any, req: Request, res: Response, next: NextFunction) => {
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

function createExchange(name: string, credentials?: ExchangeCredentials) {
    switch (name) {
        case 'polymarket':
            return new PolymarketExchange({
                privateKey: credentials?.privateKey || process.env.POLYMARKET_PK || process.env.POLYMARKET_PRIVATE_KEY,
                apiKey: credentials?.apiKey || process.env.POLYMARKET_API_KEY,
                apiSecret: credentials?.apiSecret || process.env.POLYMARKET_API_SECRET,
                passphrase: credentials?.passphrase || process.env.POLYMARKET_PASSPHRASE
            });
        case 'kalshi':
            return new KalshiExchange({
                apiKey: credentials?.apiKey || process.env.KALSHI_API_KEY,
                privateKey: credentials?.privateKey || process.env.KALSHI_PRIVATE_KEY
            });
        default:
            throw new Error(`Unknown exchange: ${name}`);
    }
}
