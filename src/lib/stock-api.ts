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

export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    const queryOptions = { period1: '3mo', interval: '1d' as any };
    
    // Ensure we are using the default export correctly for the server environment
    const yf = (yahooFinance as any).default || yahooFinance;
    const result = await yf.chart(symbol, queryOptions);
    
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
    // Fallback if Yahoo fails
    return {
      data: [],
      rateLimit: getRateLimit(),
    };
  }
}

export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    // Attempt to use the provided Free Open API for live data
    // This API is specifically mentioned as being good for live current prices
    const response = await fetch(`https://military-jobye-haiqstudios-14f59639.koyeb.app/stock?symbol=${symbol}&res=num`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const liveData = await response.json();
      
      // If the open API succeeds, we still might need extra info (like 52w range) 
      // which we can attempt to get from Yahoo as a secondary source.
      try {
        const yf = (yahooFinance as any).default || yahooFinance;
        const yfResult = await yf.quote(symbol);
        
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
      } catch (yfError) {
        // If Yahoo fails, return what we got from the Open API
        return {
          data: {
            symbol: symbol,
            name: symbol,
            price: liveData.price || 0,
            change: liveData.change || 0,
            changePercent: liveData.percentChange || 0,
            peRatio: 0,
            eps: 0,
            dividendYield: 0,
            marketCap: 'N/A',
            fiftyTwoWeekHigh: 0,
            fiftyTwoWeekLow: 0,
          },
          rateLimit: getRateLimit(),
        };
      }
    } else {
      throw new Error('Open API fetch failed');
    }
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    // Ultimate fallback to Yahoo if Open API fails entirely
    try {
      const yf = (yahooFinance as any).default || yahooFinance;
      const result = await yf.quote(symbol);
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
    } catch (lastResortError) {
      throw lastResortError;
    }
  }
}
