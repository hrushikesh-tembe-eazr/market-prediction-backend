import axios from 'axios';
import type { StockQuote, IndexData, TopGainerLoser } from './nse-service';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatWithAI(messages: Message[], apiKey: string, maxTokens: number = 1500): Promise<string> {
  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000, // 30 second timeout
    }
  );
  return response.data.choices[0]?.message?.content || '';
}

// ============================================
// 1. AI STOCK ANALYSIS
// Comprehensive analysis of a single stock
// ============================================
export async function analyzeStock(stock: StockQuote, apiKey: string): Promise<{
  summary: string;
  technicalAnalysis: string;
  fundamentalOutlook: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  targetPrice: { low: number; mid: number; high: number };
  keyFactors: string[];
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an expert Indian stock market analyst. Analyze the given stock data and provide insights. Return JSON only.

Format response EXACTLY as:
{
  "summary": "Brief 2-3 sentence summary of the stock",
  "technicalAnalysis": "Technical analysis based on price action",
  "fundamentalOutlook": "Fundamental outlook and business prospects",
  "riskLevel": "low/medium/high",
  "recommendation": "strong_buy/buy/hold/sell/strong_sell",
  "targetPrice": {"low": number, "mid": number, "high": number},
  "keyFactors": ["factor1", "factor2", "factor3"]
}`
    },
    {
      role: 'user',
      content: `Analyze this Indian stock:

Symbol: ${stock.symbol || 'N/A'}
Company: ${stock.companyName || stock.symbol || 'Unknown'}
Current Price: ₹${(stock.lastPrice || 0).toLocaleString('en-IN')}
Day Change: ${(stock.change || 0) > 0 ? '+' : ''}${(stock.change || 0).toFixed(2)} (${(stock.pChange || 0) > 0 ? '+' : ''}${(stock.pChange || 0).toFixed(2)}%)
Open: ₹${(stock.open || 0).toLocaleString('en-IN')}
Day High: ₹${(stock.dayHigh || 0).toLocaleString('en-IN')}
Day Low: ₹${(stock.dayLow || 0).toLocaleString('en-IN')}
Previous Close: ₹${(stock.previousClose || 0).toLocaleString('en-IN')}
52-Week High: ₹${(stock.yearHigh || 0).toLocaleString('en-IN')}
52-Week Low: ₹${(stock.yearLow || 0).toLocaleString('en-IN')}
Volume: ${(stock.totalTradedVolume || 0).toLocaleString('en-IN')}
${stock.industry ? `Industry: ${stock.industry}` : ''}
${stock.perChange30d ? `30-Day Change: ${stock.perChange30d.toFixed(2)}%` : ''}
${stock.perChange365d ? `1-Year Change: ${stock.perChange365d.toFixed(2)}%` : ''}`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse stock analysis:', e);
  }

  return {
    summary: 'Unable to analyze stock',
    technicalAnalysis: '',
    fundamentalOutlook: '',
    riskLevel: 'medium',
    recommendation: 'hold',
    targetPrice: { low: stock.lastPrice * 0.9, mid: stock.lastPrice, high: stock.lastPrice * 1.1 },
    keyFactors: ['Analysis unavailable']
  };
}

// ============================================
// 2. AI MARKET SENTIMENT
// Overall market sentiment analysis
// ============================================
export async function analyzeMarketSentiment(
  nifty: IndexData,
  bankNifty: IndexData,
  gainers: TopGainerLoser[],
  losers: TopGainerLoser[],
  apiKey: string
): Promise<{
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  marketTrend: string;
  sectorOutlook: string;
  tradingStrategy: string;
  keyObservations: string[];
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an expert Indian stock market analyst. Analyze market sentiment based on index and stock data. Return JSON only.

Format response EXACTLY as:
{
  "overallSentiment": "bullish/bearish/neutral",
  "sentimentScore": -100 to +100,
  "marketTrend": "Description of current market trend",
  "sectorOutlook": "Which sectors are performing well/poorly",
  "tradingStrategy": "Recommended trading approach",
  "keyObservations": ["observation1", "observation2", "observation3"]
}`
    },
    {
      role: 'user',
      content: `Analyze Indian market sentiment:

NIFTY 50:
- Current: ${(nifty.current || 0).toLocaleString('en-IN')}
- Change: ${(nifty.change || 0) > 0 ? '+' : ''}${(nifty.change || 0).toFixed(2)} (${(nifty.pChange || 0) > 0 ? '+' : ''}${(nifty.pChange || 0).toFixed(2)}%)
- Day Range: ${(nifty.low || 0).toLocaleString('en-IN')} - ${(nifty.high || 0).toLocaleString('en-IN')}

BANK NIFTY:
- Current: ${(bankNifty.current || 0).toLocaleString('en-IN')}
- Change: ${(bankNifty.change || 0) > 0 ? '+' : ''}${(bankNifty.change || 0).toFixed(2)} (${(bankNifty.pChange || 0) > 0 ? '+' : ''}${(bankNifty.pChange || 0).toFixed(2)}%)

Top Gainers:
${(gainers || []).slice(0, 5).map(g => `- ${g.symbol}: +${(g.pChange || 0).toFixed(2)}%`).join('\n')}

Top Losers:
${(losers || []).slice(0, 5).map(l => `- ${l.symbol}: ${(l.pChange || 0).toFixed(2)}%`).join('\n')}`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse market sentiment:', e);
  }

  return {
    overallSentiment: 'neutral',
    sentimentScore: 0,
    marketTrend: 'Unable to determine market trend',
    sectorOutlook: '',
    tradingStrategy: '',
    keyObservations: ['Analysis unavailable']
  };
}

// ============================================
// 3. AI PORTFOLIO ADVISOR
// Smart stock recommendations
// ============================================
export async function getStockRecommendations(
  stocks: StockQuote[],
  investmentAmount: number,
  riskProfile: 'conservative' | 'moderate' | 'aggressive',
  apiKey: string
): Promise<{
  recommendations: Array<{
    symbol: string;
    companyName: string;
    action: 'buy' | 'hold' | 'avoid';
    allocation: number;
    reasoning: string;
    targetPrice: number;
  }>;
  portfolioStrategy: string;
  diversificationAdvice: string;
  riskWarnings: string[];
}> {
  const stocksSummary = stocks.slice(0, 15).map(s => ({
    symbol: s.symbol,
    name: s.companyName,
    price: s.lastPrice,
    change: s.pChange,
    volume: s.totalTradedVolume,
    yearHigh: s.yearHigh,
    yearLow: s.yearLow,
  }));

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an expert Indian stock market portfolio advisor. Recommend stocks based on the user's investment amount and risk profile. Return JSON only.

Risk profiles:
- conservative: Focus on large-cap, dividend stocks, lower volatility
- moderate: Mix of large and mid-cap, balanced approach
- aggressive: Include mid and small-cap, higher growth potential

Format response EXACTLY as:
{
  "recommendations": [
    {
      "symbol": "SYMBOL",
      "companyName": "Company Name",
      "action": "buy/hold/avoid",
      "allocation": 0.0-1.0 (percentage of total investment),
      "reasoning": "Why this stock",
      "targetPrice": number
    }
  ],
  "portfolioStrategy": "Overall strategy description",
  "diversificationAdvice": "How to diversify",
  "riskWarnings": ["warning1", "warning2"]
}`
    },
    {
      role: 'user',
      content: `Create a stock portfolio for:
Investment Amount: ₹${investmentAmount.toLocaleString('en-IN')}
Risk Profile: ${riskProfile}

Available stocks:
${JSON.stringify(stocksSummary, null, 2)}

Recommend stocks with allocation percentages. Total allocation should sum to 1.0.`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse stock recommendations:', e);
  }

  return {
    recommendations: [],
    portfolioStrategy: 'Unable to generate recommendations',
    diversificationAdvice: '',
    riskWarnings: ['Analysis unavailable']
  };
}

// ============================================
// 4. AI STOCK COMPARISON
// Compare multiple stocks
// ============================================
export async function compareStocks(stocks: StockQuote[], apiKey: string): Promise<{
  comparison: Array<{
    symbol: string;
    strengths: string[];
    weaknesses: string[];
    score: number;
  }>;
  winner: string;
  analysis: string;
  investmentPick: string;
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an expert Indian stock analyst. Compare the given stocks and provide a detailed comparison. Return JSON only.

Format response EXACTLY as:
{
  "comparison": [
    {
      "symbol": "SYMBOL",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "score": 0-100
    }
  ],
  "winner": "Best stock symbol",
  "analysis": "Detailed comparison analysis",
  "investmentPick": "Which stock to pick and why"
}`
    },
    {
      role: 'user',
      content: `Compare these Indian stocks:

${(stocks || []).map(s => `
${s.symbol || 'N/A'} (${s.companyName || s.symbol || 'Unknown'}):
- Price: ₹${(s.lastPrice || 0).toLocaleString('en-IN')}
- Day Change: ${(s.pChange || 0) > 0 ? '+' : ''}${(s.pChange || 0).toFixed(2)}%
- 52W High: ₹${(s.yearHigh || 0).toLocaleString('en-IN')}
- 52W Low: ₹${(s.yearLow || 0).toLocaleString('en-IN')}
- Volume: ${(s.totalTradedVolume || 0).toLocaleString('en-IN')}
`).join('\n')}`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse stock comparison:', e);
  }

  return {
    comparison: [],
    winner: '',
    analysis: 'Unable to compare stocks',
    investmentPick: ''
  };
}

// ============================================
// 5. AI STOCK EXPLAINER
// Explain stock for beginners
// ============================================
export async function explainStock(stock: StockQuote, apiKey: string): Promise<{
  whatIsThisStock: string;
  businessModel: string;
  whyPriceChanged: string;
  shouldYouInvest: string;
  riskFactors: string[];
  glossary: Array<{ term: string; definition: string }>;
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a friendly stock market educator for beginners in India. Explain the stock in simple terms. Return JSON only.

Format response EXACTLY as:
{
  "whatIsThisStock": "Simple explanation of the company",
  "businessModel": "How the company makes money",
  "whyPriceChanged": "Why the price moved today",
  "shouldYouInvest": "Beginner-friendly investment advice",
  "riskFactors": ["risk1", "risk2", "risk3"],
  "glossary": [{"term": "Term", "definition": "Simple definition"}]
}`
    },
    {
      role: 'user',
      content: `Explain this stock to a beginner investor:

Company: ${stock.companyName || stock.symbol || 'Unknown'} (${stock.symbol || 'N/A'})
Current Price: ₹${(stock.lastPrice || 0).toLocaleString('en-IN')}
Today's Change: ${(stock.change || 0) > 0 ? '+' : ''}${(stock.change || 0).toFixed(2)} (${(stock.pChange || 0) > 0 ? '+' : ''}${(stock.pChange || 0).toFixed(2)}%)
52-Week Range: ₹${(stock.yearLow || 0).toLocaleString('en-IN')} - ₹${(stock.yearHigh || 0).toLocaleString('en-IN')}
${stock.industry ? `Industry: ${stock.industry}` : ''}`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse stock explanation:', e);
  }

  return {
    whatIsThisStock: 'Unable to explain stock',
    businessModel: '',
    whyPriceChanged: '',
    shouldYouInvest: '',
    riskFactors: [],
    glossary: []
  };
}

// ============================================
// 6. AI STOCK CHAT
// General chat about Indian stocks
// ============================================
export async function chatAboutStocks(
  message: string,
  stockContext: StockQuote | null,
  apiKey: string
): Promise<string> {
  const systemPrompt = `You are an expert Indian stock market assistant. Help users understand Indian stocks, markets, and investing.

Key points:
- Always use ₹ for prices
- Reference NSE/BSE exchanges
- Consider Indian market hours (9:15 AM - 3:30 PM IST)
- Be aware of Indian regulations (SEBI, etc.)
- Mention relevant Indian economic factors

${stockContext ? `
Current stock context:
Symbol: ${stockContext.symbol || 'N/A'}
Company: ${stockContext.companyName || stockContext.symbol || 'Unknown'}
Price: ₹${(stockContext.lastPrice || 0).toLocaleString('en-IN')}
Change: ${(stockContext.pChange || 0) > 0 ? '+' : ''}${(stockContext.pChange || 0).toFixed(2)}%
` : ''}

Provide helpful, accurate information. If you're unsure, say so.`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];

  return await chatWithAI(messages, apiKey, 800); // Faster chat with fewer tokens
}
