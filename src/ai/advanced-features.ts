import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatWithAI(messages: Message[], apiKey: string): Promise<string> {
  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );
  return response.data.choices[0]?.message?.content || '';
}

// ============================================
// 1. AI NEWS CORRELATION
// Finds and analyzes news that could affect a market
// ============================================
export async function analyzeNewsImpact(market: any, apiKey: string): Promise<{
  relatedNews: Array<{ headline: string; impact: string; sentiment: 'positive' | 'negative' | 'neutral' }>;
  overallImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a news analyst AI. Given a prediction market, identify recent news events that could impact the market outcome. Return JSON only.

Format your response EXACTLY as:
{
  "relatedNews": [
    {"headline": "News headline 1", "impact": "How this affects the market", "sentiment": "positive/negative/neutral"},
    {"headline": "News headline 2", "impact": "How this affects the market", "sentiment": "positive/negative/neutral"}
  ],
  "overallImpact": "Summary of how news is affecting this market",
  "riskLevel": "low/medium/high"
}`
    },
    {
      role: 'user',
      content: `Analyze potential news impact for this prediction market:

Title: ${market.title}
Description: ${market.description || 'No description'}
Current Probability: ${market.outcomes?.[0]?.label}: ${((market.outcomes?.[0]?.price || 0) * 100).toFixed(1)}%
Category: ${market.category || 'Unknown'}

Identify 3-5 recent or potential news events that could affect this market's outcome.`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse news analysis:', e);
  }

  return {
    relatedNews: [{ headline: 'Analysis unavailable', impact: 'Could not analyze news impact', sentiment: 'neutral' }],
    overallImpact: 'Unable to determine news impact',
    riskLevel: 'medium'
  };
}

// ============================================
// 2. AI PORTFOLIO ADVISOR
// Smart position recommendations based on multiple markets
// ============================================
export async function getPortfolioAdvice(markets: any[], riskTolerance: 'conservative' | 'moderate' | 'aggressive', apiKey: string): Promise<{
  recommendations: Array<{
    marketId: string;
    marketTitle: string;
    action: 'buy_yes' | 'buy_no' | 'avoid' | 'watch';
    confidence: number;
    reasoning: string;
    suggestedAllocation: number;
  }>;
  diversificationScore: number;
  overallStrategy: string;
  expectedReturn: string;
}> {
  const marketsSummary = markets.slice(0, 10).map(m => ({
    id: m.id,
    title: m.title?.slice(0, 50),
    yesPrice: m.outcomes?.[0]?.price,
    noPrice: m.outcomes?.[1]?.price,
    volume: m.volume,
    category: m.category
  }));

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an AI portfolio advisor for prediction markets. Analyze markets and provide investment recommendations. Return JSON only.

Risk profiles:
- conservative: Focus on high-probability outcomes (>70%), lower returns
- moderate: Balanced approach, look for mispriced markets
- aggressive: High-risk/high-reward, contrarian bets

Format response EXACTLY as:
{
  "recommendations": [
    {
      "marketId": "id",
      "marketTitle": "title",
      "action": "buy_yes/buy_no/avoid/watch",
      "confidence": 0.0-1.0,
      "reasoning": "Why this recommendation",
      "suggestedAllocation": 0.0-0.3
    }
  ],
  "diversificationScore": 0.0-1.0,
  "overallStrategy": "Strategy summary",
  "expectedReturn": "Expected return description"
}`
    },
    {
      role: 'user',
      content: `Create a portfolio recommendation for a ${riskTolerance} investor.

Available markets:
${JSON.stringify(marketsSummary, null, 2)}

Analyze each market and recommend positions. Total allocation should sum to 1.0.`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse portfolio advice:', e);
  }

  return {
    recommendations: [],
    diversificationScore: 0,
    overallStrategy: 'Unable to generate portfolio advice',
    expectedReturn: 'Unknown'
  };
}

// ============================================
// 3. AI ANOMALY DETECTOR
// Detects unusual price movements or patterns
// ============================================
export async function detectAnomalies(markets: any[], apiKey: string): Promise<{
  anomalies: Array<{
    marketId: string;
    marketTitle: string;
    anomalyType: 'sudden_spike' | 'unusual_volume' | 'price_manipulation' | 'arbitrage_opportunity' | 'sentiment_divergence';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  marketHealth: 'healthy' | 'caution' | 'warning';
  summary: string;
}> {
  const marketsSummary = markets.slice(0, 15).map(m => ({
    id: m.id,
    title: m.title?.slice(0, 40),
    price: m.outcomes?.[0]?.price,
    priceChange24h: m.outcomes?.[0]?.priceChange24h,
    volume: m.volume,
    volume24h: m.volume24h
  }));

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an AI anomaly detector for prediction markets. Identify unusual patterns that could indicate opportunities or risks. Return JSON only.

Look for:
- Sudden price spikes (>10% in 24h)
- Unusual volume patterns
- Potential price manipulation
- Arbitrage opportunities
- Sentiment divergence from fundamentals

Format response EXACTLY as:
{
  "anomalies": [
    {
      "marketId": "id",
      "marketTitle": "title",
      "anomalyType": "sudden_spike/unusual_volume/price_manipulation/arbitrage_opportunity/sentiment_divergence",
      "severity": "low/medium/high",
      "description": "What was detected",
      "recommendation": "What to do"
    }
  ],
  "marketHealth": "healthy/caution/warning",
  "summary": "Overall market analysis"
}`
    },
    {
      role: 'user',
      content: `Scan these markets for anomalies:

${JSON.stringify(marketsSummary, null, 2)}

Identify any unusual patterns, potential opportunities, or risks.`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse anomaly detection:', e);
  }

  return {
    anomalies: [],
    marketHealth: 'healthy',
    summary: 'No anomalies detected'
  };
}

// ============================================
// 4. AI SENTIMENT SCORE
// Calculates a comprehensive sentiment score
// ============================================
export async function calculateSentimentScore(market: any, apiKey: string): Promise<{
  overallScore: number; // -100 to +100
  components: {
    priceAction: number;
    volumeTrend: number;
    marketMomentum: number;
    newsImpact: number;
    crowdWisdom: number;
  };
  interpretation: string;
  tradingSignal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an AI sentiment analyzer. Calculate a comprehensive sentiment score for a prediction market. Return JSON only.

Score components (each -100 to +100):
- priceAction: Based on recent price movements
- volumeTrend: Based on trading volume patterns
- marketMomentum: Technical momentum indicators
- newsImpact: Likely news sentiment
- crowdWisdom: Confidence in crowd prediction

Format response EXACTLY as:
{
  "overallScore": -100 to +100,
  "components": {
    "priceAction": -100 to +100,
    "volumeTrend": -100 to +100,
    "marketMomentum": -100 to +100,
    "newsImpact": -100 to +100,
    "crowdWisdom": -100 to +100
  },
  "interpretation": "What this score means",
  "tradingSignal": "strong_buy/buy/hold/sell/strong_sell",
  "confidence": 0.0-1.0
}`
    },
    {
      role: 'user',
      content: `Calculate sentiment score for this market:

Title: ${market.title}
Yes Price: ${((market.outcomes?.[0]?.price || 0) * 100).toFixed(1)}%
No Price: ${((market.outcomes?.[1]?.price || 0) * 100).toFixed(1)}%
24h Change: ${((market.outcomes?.[0]?.priceChange24h || 0) * 100).toFixed(2)}%
Volume: $${market.volume?.toLocaleString() || 'N/A'}
24h Volume: $${market.volume24h?.toLocaleString() || 'N/A'}
Category: ${market.category || 'Unknown'}`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse sentiment score:', e);
  }

  return {
    overallScore: 0,
    components: { priceAction: 0, volumeTrend: 0, marketMomentum: 0, newsImpact: 0, crowdWisdom: 0 },
    interpretation: 'Unable to calculate sentiment',
    tradingSignal: 'hold',
    confidence: 0
  };
}

// ============================================
// 5. AI PRICE PREDICTION
// Predicts future price with confidence intervals
// ============================================
export async function predictPrice(market: any, timeframe: '1h' | '24h' | '7d' | '30d', apiKey: string): Promise<{
  currentPrice: number;
  predictedPrice: number;
  confidenceInterval: { low: number; high: number };
  confidence: number;
  direction: 'up' | 'down' | 'stable';
  keyFactors: string[];
  disclaimer: string;
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an AI price predictor for prediction markets. Analyze market data and predict future prices. Return JSON only.

Consider:
- Current probability and trends
- Historical patterns for similar events
- News and external factors
- Market efficiency

Format response EXACTLY as:
{
  "currentPrice": 0.0-1.0,
  "predictedPrice": 0.0-1.0,
  "confidenceInterval": {"low": 0.0-1.0, "high": 0.0-1.0},
  "confidence": 0.0-1.0,
  "direction": "up/down/stable",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "disclaimer": "Risk disclaimer"
}`
    },
    {
      role: 'user',
      content: `Predict the price for this market in ${timeframe}:

Title: ${market.title}
Current Yes Price: ${market.outcomes?.[0]?.price || 0}
Current No Price: ${market.outcomes?.[1]?.price || 0}
24h Change: ${market.outcomes?.[0]?.priceChange24h || 0}
Volume: $${market.volume?.toLocaleString() || 'N/A'}
Category: ${market.category || 'Unknown'}

Provide a ${timeframe} price prediction with confidence intervals.`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse price prediction:', e);
  }

  return {
    currentPrice: market.outcomes?.[0]?.price || 0,
    predictedPrice: market.outcomes?.[0]?.price || 0,
    confidenceInterval: { low: 0, high: 1 },
    confidence: 0,
    direction: 'stable',
    keyFactors: ['Unable to analyze'],
    disclaimer: 'Prediction unavailable'
  };
}

// ============================================
// 6. AI SMART ALERTS
// Generates personalized alert conditions
// ============================================
export async function generateSmartAlerts(market: any, apiKey: string): Promise<{
  alerts: Array<{
    condition: string;
    trigger: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    reasoning: string;
  }>;
  keyDates: Array<{ date: string; event: string; importance: string }>;
  monitoringAdvice: string;
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an AI alert generator. Create smart alerts for monitoring a prediction market. Return JSON only.

Generate alerts for:
- Price thresholds
- Volume spikes
- Key dates/events
- News triggers

Format response EXACTLY as:
{
  "alerts": [
    {
      "condition": "When to trigger",
      "trigger": "Specific threshold",
      "priority": "low/medium/high/critical",
      "reasoning": "Why this alert matters"
    }
  ],
  "keyDates": [
    {"date": "Date or timeframe", "event": "What happens", "importance": "Why it matters"}
  ],
  "monitoringAdvice": "How to monitor this market"
}`
    },
    {
      role: 'user',
      content: `Generate smart alerts for this market:

Title: ${market.title}
Description: ${market.description || 'No description'}
Current Price: ${((market.outcomes?.[0]?.price || 0) * 100).toFixed(1)}%
Category: ${market.category || 'Unknown'}

Create 3-5 smart alerts and identify key dates to watch.`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse smart alerts:', e);
  }

  return {
    alerts: [],
    keyDates: [],
    monitoringAdvice: 'Unable to generate alerts'
  };
}

// ============================================
// 7. AI MARKET EXPLAINER (For beginners)
// Explains complex markets in simple terms
// ============================================
export async function explainMarket(market: any, expertiseLevel: 'beginner' | 'intermediate' | 'expert', apiKey: string): Promise<{
  simpleExplanation: string;
  whatItMeans: string;
  whyItMatters: string;
  howToTrade: string;
  keyTerms: Array<{ term: string; definition: string }>;
  relatedConcepts: string[];
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an AI educator. Explain prediction markets in a way appropriate for the user's expertise level. Return JSON only.

Expertise levels:
- beginner: Use simple language, analogies, avoid jargon
- intermediate: Some technical terms OK, focus on strategy
- expert: Deep analysis, advanced concepts

Format response EXACTLY as:
{
  "simpleExplanation": "What this market is about",
  "whatItMeans": "What the current price indicates",
  "whyItMatters": "Why this market is important",
  "howToTrade": "How to participate in this market",
  "keyTerms": [{"term": "Term", "definition": "Definition"}],
  "relatedConcepts": ["concept1", "concept2"]
}`
    },
    {
      role: 'user',
      content: `Explain this market for a ${expertiseLevel} user:

Title: ${market.title}
Description: ${market.description || 'No description'}
Yes Price: ${((market.outcomes?.[0]?.price || 0) * 100).toFixed(1)}%
Category: ${market.category || 'Unknown'}`
    }
  ];

  const response = await chatWithAI(messages, apiKey);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse market explanation:', e);
  }

  return {
    simpleExplanation: 'Unable to explain market',
    whatItMeans: '',
    whyItMatters: '',
    howToTrade: '',
    keyTerms: [],
    relatedConcepts: []
  };
}
