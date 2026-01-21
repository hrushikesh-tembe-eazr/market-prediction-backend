"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithDeepSeek = chatWithDeepSeek;
exports.createMarketAnalysisPrompt = createMarketAnalysisPrompt;
exports.createComparisonPrompt = createComparisonPrompt;
exports.createChatPrompt = createChatPrompt;
const axios_1 = __importDefault(require("axios"));
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
async function chatWithDeepSeek(messages, apiKey) {
    try {
        const response = await axios_1.default.post(DEEPSEEK_API_URL, {
            model: 'deepseek-chat',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        return response.data.choices[0]?.message?.content || 'No response generated';
    }
    catch (error) {
        console.error('DeepSeek API error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to get AI response');
    }
}
function createMarketAnalysisPrompt(market) {
    return [
        {
            role: 'system',
            content: `You are an expert prediction market analyst. You analyze market data and provide insights about probability movements, trading volumes, and potential factors affecting outcomes. Be concise but insightful. Use bullet points for clarity.

Key concepts:
- Price = Probability (0.65 = 65% chance)
- Volume = Trading activity (higher = more interest)
- Price change = Sentiment shift

Always provide:
1. Current state summary
2. Key factors to watch
3. Risk assessment`
        },
        {
            role: 'user',
            content: `Analyze this prediction market:

Title: ${market.title}
Description: ${market.description || 'No description'}

Outcomes:
${market.outcomes?.map((o) => `- ${o.label}: ${(o.price * 100).toFixed(1)}% (24h change: ${((o.priceChange24h || 0) * 100).toFixed(1)}%)`).join('\n')}

Volume: $${market.volume?.toLocaleString() || 'N/A'}
24h Volume: $${market.volume24h?.toLocaleString() || 'N/A'}
Category: ${market.category || 'Unknown'}

Provide a brief analysis of this market.`
        }
    ];
}
function createComparisonPrompt(markets) {
    const marketSummaries = markets.map((m, i) => `
Market ${i + 1}: ${m.title}
- Top outcome: ${m.outcomes?.[0]?.label} at ${((m.outcomes?.[0]?.price || 0) * 100).toFixed(1)}%
- Volume: $${m.volume?.toLocaleString() || 'N/A'}
`).join('\n');
    return [
        {
            role: 'system',
            content: `You are an expert prediction market analyst. Compare markets and identify patterns, correlations, and trading opportunities. Be concise and actionable.`
        },
        {
            role: 'user',
            content: `Compare these prediction markets and identify any interesting patterns or correlations:

${marketSummaries}

What insights can you provide about these markets together?`
        }
    ];
}
function createChatPrompt(userMessage, marketContext) {
    const systemPrompt = marketContext
        ? `You are an AI assistant specializing in prediction markets. You have access to the following market data:

Title: ${marketContext.title}
Outcomes: ${marketContext.outcomes?.map((o) => `${o.label}: ${(o.price * 100).toFixed(1)}%`).join(', ')}
Volume: $${marketContext.volume?.toLocaleString() || 'N/A'}

Answer questions about this market or prediction markets in general. Be helpful and concise.`
        : `You are an AI assistant specializing in prediction markets. Help users understand market dynamics, probabilities, and trading strategies. Be helpful and concise.`;
    return [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: userMessage
        }
    ];
}
