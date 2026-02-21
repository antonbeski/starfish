'use server';

import { quote, chart } from 'yahoo-finance2';
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

export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    const queryOptions = { period1: '3mo', interval: '1d' as any };
    const result = await chart(symbol, queryOptions);
    
    if (!result || !result.quotes) {
      throw new Error('No historical data found');
    }

    const data: StockDataPoint[] = result.quotes
      .filter(q => q.date && q.close !== null)
      .map(q => ({
        date: new Date(q.date).toISOString().split('T')[0],
        open: q.open ?? 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        close: q.close ?? 0,
        volume: q.volume ?? 0,
      }));

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
    console.error(`Error fetching history for ${symbol}:`, error);
    throw error;
  }
}

export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    const result = await quote(symbol);
    
    if (!result) {
      throw new Error('No stock details found');
    }

    return {
      data: {
        symbol: result.symbol,
        name: result.longName || result.shortName || result.symbol,
        price: result.regularMarketPrice ?? 0,
        change: result.regularMarketChange ?? 0,
        changePercent: result.regularMarketChangePercent ?? 0,
        peRatio: result.trailingPE ?? 0,
        eps: result.trailingEps ?? 0,
        dividendYield: result.dividendYield ?? 0,
        marketCap: formatMarketCap(result.marketCap),
        fiftyTwoWeekHigh: result.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: result.fiftyTwoWeekLow ?? 0,
      },
      rateLimit: getRateLimit(),
    };
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    throw error;
  }
}