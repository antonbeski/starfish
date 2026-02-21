
'use server';

/**
 * @fileOverview STARFISH Direct Market Data Engine.
 * Uses native fetch to interface with Yahoo Finance public endpoints.
 * Includes automatic Indian Market (.NS) symbol resolution.
 */

import { calculateSMA, calculateEMA, calculateRSI } from './stock-utils';

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number | null;
  ema50?: number | null;
  rsi?: number | null;
}

export interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  marketCap: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface ApiResponse<T> {
  data: T;
  rateLimit: {
    remaining: number;
    total: number;
    resetIn: number;
  };
}

let remainingRequests = 100;
const TOTAL_LIMIT = 100;

function getRateLimit() {
  remainingRequests = Math.max(0, remainingRequests - 1);
  return {
    remaining: remainingRequests,
    total: TOTAL_LIMIT,
    resetIn: 3600,
  };
}

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

function formatMarketCap(val?: number): string {
  if (!val) return 'N/A';
  if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
  if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
  if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
  return val.toString();
}

/**
 * Direct fetch for historical data with fallback for Indian symbols.
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol.toUpperCase()}.NS`;
    
    let response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=3mo&interval=1d`,
      { headers: COMMON_HEADERS, next: { revalidate: 60 } }
    );

    if (!response.ok && !symbol.includes('.')) {
      // Fallback for global symbols if .NS attempt failed
      response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=3mo&interval=1d`,
        { headers: COMMON_HEADERS, next: { revalidate: 60 } }
      );
    }

    if (!response.ok) throw new Error('History Fetch Failed');

    const json = await response.json();
    const result = json.chart?.result?.[0];

    if (!result || !result.timestamp) throw new Error('No Data');

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quotes.close;

    const rawData: StockDataPoint[] = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open[i] ?? 0,
      high: quotes.high[i] ?? 0,
      low: quotes.low[i] ?? 0,
      close: adjClose[i] ?? quotes.close[i] ?? 0,
      volume: quotes.volume[i] ?? 0,
    })).filter((d: any) => d.close > 0);

    // Inject Technical Indicators
    const closes = rawData.map(d => d.close);
    const sma20 = calculateSMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const rsi = calculateRSI(closes, 14);

    const enrichedData = rawData.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      ema50: ema50[i],
      rsi: rsi[i],
    }));

    return { data: enrichedData, rateLimit: getRateLimit() };
  } catch (error) {
    console.error('Terminal History Error:', error);
    return { data: [], rateLimit: getRateLimit() };
  }
}

/**
 * Direct fetch for real-time stock details.
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol.toUpperCase()}.NS`;

    let response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedSymbol}`,
      { headers: COMMON_HEADERS, next: { revalidate: 60 } }
    );

    let json = await response.json();
    let result = json.quoteResponse?.result?.[0];

    if (!result && !symbol.includes('.')) {
      // Fallback for global symbols
      response = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol.toUpperCase()}`,
        { headers: COMMON_HEADERS, next: { revalidate: 60 } }
      );
      json = await response.json();
      result = json.quoteResponse?.result?.[0];
    }

    if (!result) throw new Error('Symbol Not Found');

    return {
      data: {
        symbol: result.symbol,
        name: result.longName || result.shortName || result.symbol,
        price: result.regularMarketPrice || 0,
        change: result.regularMarketChange || 0,
        changePercent: result.regularMarketChangePercent || 0,
        peRatio: result.trailingPE || 0,
        eps: result.trailingEps || 0,
        dividendYield: result.dividendYield || 0,
        marketCap: formatMarketCap(result.marketCap),
        fiftyTwoWeekHigh: result.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: result.fiftyTwoWeekLow || 0,
      },
      rateLimit: getRateLimit(),
    };
  } catch (error) {
    console.error('Terminal Details Error:', error);
    throw error;
  }
}
