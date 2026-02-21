'use server';

import yahooFinance from 'yahoo-finance2';
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
 * Fetches historical data with a fallback to direct internal Yahoo API
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    const queryOptions = { period1: '3mo', interval: '1d' as any };
    
    // Ensure we are using the default export correctly for the server environment
    const yf = (yahooFinance as any).default || yahooFinance;
    let result;
    
    try {
      result = await yf.chart(symbol, queryOptions);
    } catch (e) {
      console.warn(`YahooFinance2 package failed for ${symbol}, trying direct API fallback...`);
      // Direct API Fallback for chart data
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d`);
      if (response.ok) {
        const json = await response.json();
        const chart = json.chart.result[0];
        const timestamps = chart.timestamp;
        const indicators = chart.indicators.quote[0];
        
        result = {
          quotes: timestamps.map((ts: number, i: number) => ({
            date: new Date(ts * 1000),
            open: indicators.open[i],
            high: indicators.high[i],
            low: indicators.low[i],
            close: indicators.close[i],
            volume: indicators.volume[i],
          }))
        };
      } else {
        throw new Error('Direct Yahoo API fallback failed');
      }
    }
    
    if (!result || !result.quotes) {
      throw new Error('No historical data found');
    }

    const data: StockDataPoint[] = result.quotes
      .filter((q: any) => q.date && q.close !== null)
      .map((q: any) => ({
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
    return {
      data: [],
      rateLimit: getRateLimit(),
    };
  }
}

/**
 * Fetches stock details using Open API with fallback to Yahoo
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    // Attempt Open API first for real-time prices
    const response = await fetch(`https://military-jobye-haiqstudios-14f59639.koyeb.app/stock?symbol=${symbol}&res=num`, {
      cache: 'no-store'
    });
    
    let liveData = { price: 0, change: 0, percentChange: 0 };
    if (response.ok) {
      liveData = await response.json();
    }
    
    const yf = (yahooFinance as any).default || yahooFinance;
    let yfResult;
    
    try {
      yfResult = await yf.quote(symbol);
    } catch (e) {
      // Direct API Fallback for quote data if library fails
      const yfRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`);
      if (yfRes.ok) {
        const json = await yfRes.json();
        yfResult = json.quoteResponse.result[0];
      }
    }
    
    if (!yfResult) {
      throw new Error('Failed to fetch stock details from any source');
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
    console.error(`Error fetching details for ${symbol}:`, error);
    throw error;
  }
}
