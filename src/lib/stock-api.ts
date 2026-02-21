'use server';

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

/**
 * Formats market cap number to human-readable string (T, B, M)
 */
function formatMarketCap(val?: number): string {
  if (!val) return 'N/A';
  if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
  if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
  if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
  return val.toString();
}

/**
 * Fetches historical data using direct Yahoo API for maximum reliability
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    // Direct API call to Yahoo Finance Chart v8
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.statusText}`);
    }

    const json = await response.json();
    const result = json.chart?.result?.[0];

    if (!result || !result.timestamp) {
      throw new Error('No historical data found for this symbol');
    }

    const timestamps = result.timestamp;
    const indicators = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || indicators.close;

    const data: StockDataPoint[] = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: indicators.open[i] ?? 0,
      high: indicators.high[i] ?? 0,
      low: indicators.low[i] ?? 0,
      close: adjClose[i] ?? indicators.close[i] ?? 0,
      volume: indicators.volume[i] ?? 0,
    })).filter((d: any) => d.close > 0);

    // Calculate Technical Indicators
    const closes = data.map(d => d.close);
    const sma20 = calculateSMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const rsi = calculateRSI(closes, 14);

    const enrichedData = data.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      ema50: ema50[i],
      rsi: rsi[i],
    }));

    return {
      data: enrichedData,
      rateLimit: getRateLimit(),
    };
  } catch (error) {
    console.error(`Terminal Error [History] for ${symbol}:`, error);
    return {
      data: [],
      rateLimit: getRateLimit(),
    };
  }
}

/**
 * Fetches stock details using a combination of Open API and direct Yahoo Quotes
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    // 1. Primary Source: Koyeb Open API for Live Price
    const liveRes = await fetch(`https://military-jobye-haiqstudios-14f59639.koyeb.app/stock?symbol=${symbol}&res=num`, {
      cache: 'no-store'
    });
    
    let liveData = { price: 0, change: 0, percentChange: 0 };
    if (liveRes.ok) {
      liveData = await liveRes.json();
    }
    
    // 2. Secondary Source: Direct Yahoo Quote API for Fundamentals
    const quoteRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`, {
      cache: 'no-store'
    });

    if (!quoteRes.ok) {
      throw new Error('Failed to reach Yahoo Quote endpoint');
    }

    const quoteJson = await quoteRes.json();
    const yfResult = quoteJson.quoteResponse?.result?.[0];

    if (!yfResult) {
      throw new Error('No details found for this symbol');
    }
    
    return {
      data: {
        symbol: symbol,
        name: yfResult.longName || yfResult.shortName || symbol,
        price: liveData.price || yfResult.regularMarketPrice || 0,
        change: liveData.change || yfResult.regularMarketChange || 0,
        changePercent: liveData.percentChange || yfResult.regularMarketChangePercent || 0,
        peRatio: yfResult.trailingPE ?? 0,
        eps: yfResult.trailingEps ?? 0,
        dividendYield: yfResult.dividendYield ?? 0,
        marketCap: formatMarketCap(yfResult.marketCap),
        fiftyTwoWeekHigh: yfResult.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: yfResult.fiftyTwoWeekLow ?? 0,
      },
      rateLimit: getRateLimit(),
    };
  } catch (error) {
    console.error(`Terminal Error [Details] for ${symbol}:`, error);
    throw error;
  }
}
