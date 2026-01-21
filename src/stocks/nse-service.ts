import axios from 'axios';

const NSE_BASE_URL = 'https://www.nseindia.com/api';

// NSE requires specific headers to work
const getHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Referer': 'https://www.nseindia.com/',
});

// Cookie management for NSE
let cookies: string = '';
let lastCookieTime: number = 0;
const COOKIE_EXPIRY = 5 * 60 * 1000; // 5 minutes

async function refreshCookies(): Promise<void> {
  try {
    const response = await axios.get('https://www.nseindia.com', {
      headers: getHeaders(),
      timeout: 10000,
    });
    const setCookies = response.headers['set-cookie'];
    if (setCookies) {
      cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      lastCookieTime = Date.now();
    }
  } catch (error) {
    console.error('Failed to refresh NSE cookies:', error);
  }
}

async function getValidCookies(): Promise<string> {
  if (!cookies || Date.now() - lastCookieTime > COOKIE_EXPIRY) {
    await refreshCookies();
  }
  return cookies;
}

async function nseRequest(endpoint: string): Promise<any> {
  const validCookies = await getValidCookies();

  try {
    const response = await axios.get(`${NSE_BASE_URL}${endpoint}`, {
      headers: {
        ...getHeaders(),
        'Cookie': validCookies,
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error: any) {
    // If unauthorized, refresh cookies and retry
    if (error.response?.status === 401 || error.response?.status === 403) {
      await refreshCookies();
      const newCookies = await getValidCookies();
      const retryResponse = await axios.get(`${NSE_BASE_URL}${endpoint}`, {
        headers: {
          ...getHeaders(),
          'Cookie': newCookies,
        },
        timeout: 15000,
      });
      return retryResponse.data;
    }
    throw error;
  }
}

// ============================================
// Stock Data Interfaces
// ============================================

export interface StockQuote {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
  perChange365d?: number;
  perChange30d?: number;
  lastUpdateTime: string;
  industry?: string;
  series: string;
}

export interface IndexData {
  indexName: string;
  current: number;
  change: number;
  pChange: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  yearHigh: number;
  yearLow: number;
  lastUpdateTime: string;
}

export interface MarketStatus {
  market: string;
  marketStatus: string;
  tradeDate: string;
  index: string;
  last: number;
  variation: number;
  percentChange: number;
  marketStatusMessage: string;
}

export interface TopGainerLoser {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  volume: number;
}

// ============================================
// NSE Service Functions
// ============================================

// Get quote for a single stock
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const data = await nseRequest(`/quote-equity?symbol=${encodeURIComponent(symbol.toUpperCase())}`);

  const priceInfo = data.priceInfo || {};
  const info = data.info || {};

  return {
    symbol: info.symbol || symbol,
    companyName: info.companyName || symbol,
    lastPrice: priceInfo.lastPrice || 0,
    change: priceInfo.change || 0,
    pChange: priceInfo.pChange || 0,
    open: priceInfo.open || 0,
    dayHigh: priceInfo.intraDayHighLow?.max || 0,
    dayLow: priceInfo.intraDayHighLow?.min || 0,
    previousClose: priceInfo.previousClose || 0,
    totalTradedVolume: priceInfo.totalTradedVolume || 0,
    totalTradedValue: priceInfo.totalTradedValue || 0,
    yearHigh: priceInfo.weekHighLow?.max || 0,
    yearLow: priceInfo.weekHighLow?.min || 0,
    perChange365d: data.securityWiseDP?.perChange365d,
    perChange30d: data.securityWiseDP?.perChange30d,
    lastUpdateTime: priceInfo.lastUpdateTime || new Date().toISOString(),
    industry: info.industry,
    series: info.series || 'EQ',
  };
}

// Get multiple stock quotes
export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
  const quotes: StockQuote[] = [];

  // Process in batches to avoid rate limiting
  for (const symbol of symbols) {
    try {
      const quote = await getStockQuote(symbol);
      quotes.push(quote);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
    }
  }

  return quotes;
}

// Get NIFTY 50 index data
export async function getNifty50(): Promise<{ indexData: IndexData; stocks: StockQuote[] }> {
  const data = await nseRequest('/equity-stockIndices?index=NIFTY%2050');

  const indexData: IndexData = {
    indexName: data.metadata?.indexName || 'NIFTY 50',
    current: data.metadata?.last || 0,
    change: data.metadata?.change || 0,
    pChange: data.metadata?.percentChange || 0,
    open: data.metadata?.open || 0,
    high: data.metadata?.high || 0,
    low: data.metadata?.low || 0,
    previousClose: data.metadata?.previousClose || 0,
    yearHigh: data.metadata?.yearHigh || 0,
    yearLow: data.metadata?.yearLow || 0,
    lastUpdateTime: data.metadata?.lastUpdateTime || new Date().toISOString(),
  };

  const stocks: StockQuote[] = (data.data || []).map((stock: any) => ({
    symbol: stock.symbol,
    companyName: stock.meta?.companyName || stock.symbol,
    lastPrice: stock.lastPrice || 0,
    change: stock.change || 0,
    pChange: stock.pChange || 0,
    open: stock.open || 0,
    dayHigh: stock.dayHigh || 0,
    dayLow: stock.dayLow || 0,
    previousClose: stock.previousClose || 0,
    totalTradedVolume: stock.totalTradedVolume || 0,
    totalTradedValue: stock.totalTradedValue || 0,
    yearHigh: stock.yearHigh || 0,
    yearLow: stock.yearLow || 0,
    lastUpdateTime: stock.lastUpdateTime || new Date().toISOString(),
    series: stock.series || 'EQ',
  }));

  return { indexData, stocks };
}

// Get Bank NIFTY index data
export async function getBankNifty(): Promise<{ indexData: IndexData; stocks: StockQuote[] }> {
  const data = await nseRequest('/equity-stockIndices?index=NIFTY%20BANK');

  const indexData: IndexData = {
    indexName: data.metadata?.indexName || 'NIFTY BANK',
    current: data.metadata?.last || 0,
    change: data.metadata?.change || 0,
    pChange: data.metadata?.percentChange || 0,
    open: data.metadata?.open || 0,
    high: data.metadata?.high || 0,
    low: data.metadata?.low || 0,
    previousClose: data.metadata?.previousClose || 0,
    yearHigh: data.metadata?.yearHigh || 0,
    yearLow: data.metadata?.yearLow || 0,
    lastUpdateTime: data.metadata?.lastUpdateTime || new Date().toISOString(),
  };

  const stocks: StockQuote[] = (data.data || []).map((stock: any) => ({
    symbol: stock.symbol,
    companyName: stock.meta?.companyName || stock.symbol,
    lastPrice: stock.lastPrice || 0,
    change: stock.change || 0,
    pChange: stock.pChange || 0,
    open: stock.open || 0,
    dayHigh: stock.dayHigh || 0,
    dayLow: stock.dayLow || 0,
    previousClose: stock.previousClose || 0,
    totalTradedVolume: stock.totalTradedVolume || 0,
    totalTradedValue: stock.totalTradedValue || 0,
    yearHigh: stock.yearHigh || 0,
    yearLow: stock.yearLow || 0,
    lastUpdateTime: stock.lastUpdateTime || new Date().toISOString(),
    series: stock.series || 'EQ',
  }));

  return { indexData, stocks };
}

// Get all indices
export async function getAllIndices(): Promise<IndexData[]> {
  const data = await nseRequest('/allIndices');

  return (data.data || []).map((index: any) => ({
    indexName: index.index || index.indexSymbol,
    current: index.last || 0,
    change: index.change || 0,
    pChange: index.percentChange || 0,
    open: index.open || 0,
    high: index.high || 0,
    low: index.low || 0,
    previousClose: index.previousClose || 0,
    yearHigh: index.yearHigh || 0,
    yearLow: index.yearLow || 0,
    lastUpdateTime: index.lastUpdateTime || new Date().toISOString(),
  }));
}

// Get market status
export async function getMarketStatus(): Promise<MarketStatus[]> {
  const data = await nseRequest('/marketStatus');

  return (data.marketState || []).map((market: any) => ({
    market: market.market || '',
    marketStatus: market.marketStatus || '',
    tradeDate: market.tradeDate || '',
    index: market.index || '',
    last: market.last || 0,
    variation: market.variation || 0,
    percentChange: market.percentChange || 0,
    marketStatusMessage: market.marketStatusMessage || '',
  }));
}

// Get top gainers
export async function getTopGainers(index: string = 'NIFTY 50'): Promise<TopGainerLoser[]> {
  const data = await nseRequest(`/equity-stockIndices?index=${encodeURIComponent(index)}`);

  const stocks = data.data || [];
  return stocks
    .filter((s: any) => s.pChange > 0)
    .sort((a: any, b: any) => b.pChange - a.pChange)
    .slice(0, 10)
    .map((stock: any) => ({
      symbol: stock.symbol,
      companyName: stock.meta?.companyName || stock.symbol,
      lastPrice: stock.lastPrice || 0,
      change: stock.change || 0,
      pChange: stock.pChange || 0,
      volume: stock.totalTradedVolume || 0,
    }));
}

// Get top losers
export async function getTopLosers(index: string = 'NIFTY 50'): Promise<TopGainerLoser[]> {
  const data = await nseRequest(`/equity-stockIndices?index=${encodeURIComponent(index)}`);

  const stocks = data.data || [];
  return stocks
    .filter((s: any) => s.pChange < 0)
    .sort((a: any, b: any) => a.pChange - b.pChange)
    .slice(0, 10)
    .map((stock: any) => ({
      symbol: stock.symbol,
      companyName: stock.meta?.companyName || stock.symbol,
      lastPrice: stock.lastPrice || 0,
      change: stock.change || 0,
      pChange: stock.pChange || 0,
      volume: stock.totalTradedVolume || 0,
    }));
}

// Get most active by volume
export async function getMostActive(index: string = 'NIFTY 50'): Promise<TopGainerLoser[]> {
  const data = await nseRequest(`/equity-stockIndices?index=${encodeURIComponent(index)}`);

  const stocks = data.data || [];
  return stocks
    .sort((a: any, b: any) => (b.totalTradedVolume || 0) - (a.totalTradedVolume || 0))
    .slice(0, 10)
    .map((stock: any) => ({
      symbol: stock.symbol,
      companyName: stock.meta?.companyName || stock.symbol,
      lastPrice: stock.lastPrice || 0,
      change: stock.change || 0,
      pChange: stock.pChange || 0,
      volume: stock.totalTradedVolume || 0,
    }));
}

// Search stocks
export async function searchStocks(query: string): Promise<Array<{ symbol: string; companyName: string }>> {
  const data = await nseRequest(`/search/autocomplete?q=${encodeURIComponent(query)}`);

  return (data.symbols || [])
    .filter((item: any) => item.symbol_info)
    .map((item: any) => ({
      symbol: item.symbol,
      companyName: item.symbol_info || item.symbol,
    }));
}

// Get historical data (limited - NSE doesn't provide extensive historical data via API)
export async function getHistoricalData(symbol: string, days: number = 30): Promise<any[]> {
  // NSE historical data endpoint
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split('T')[0].split('-').reverse().join('-');

  try {
    const data = await nseRequest(
      `/historical/cm/equity?symbol=${encodeURIComponent(symbol.toUpperCase())}&from=${formatDate(fromDate)}&to=${formatDate(toDate)}`
    );

    return (data.data || []).map((item: any) => ({
      date: item.CH_TIMESTAMP,
      open: item.CH_OPENING_PRICE,
      high: item.CH_TRADE_HIGH_PRICE,
      low: item.CH_TRADE_LOW_PRICE,
      close: item.CH_CLOSING_PRICE,
      volume: item.CH_TOT_TRADED_QTY,
      value: item.CH_TOT_TRADED_VAL,
    }));
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return [];
  }
}

// Popular stocks list (for quick access)
export const POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
  'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
  'BAJFINANCE', 'WIPRO', 'HCLTECH', 'SUNPHARMA', 'TATAMOTORS'
];

// Sector indices
export const SECTOR_INDICES = [
  'NIFTY 50',
  'NIFTY BANK',
  'NIFTY IT',
  'NIFTY PHARMA',
  'NIFTY AUTO',
  'NIFTY FMCG',
  'NIFTY METAL',
  'NIFTY REALTY',
  'NIFTY ENERGY',
  'NIFTY INFRA'
];
