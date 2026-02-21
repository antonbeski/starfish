'use server';

/**
 * @fileOverview STARFISH Finnhub Market Data Engine.
 * High-performance native fetch implementation for Finnhub API.
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
  data: T | null;
  error?: string;
  rateLimit: {
    remaining: number;
    total: number;
  };
}

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

function getFinnhubToken() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) {
    console.error('CRITICAL: FINNHUB_API_KEY missing.');
    return null;
  }
  return token;
}

/**
 * Fetches historical candles and calculates technical indicators using Finnhub.
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  const token = getFinnhubToken();
  if (!token) return { data: null, error: 'API Key missing', rateLimit: { remaining: 0, total: 60 } };

  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (180 * 24 * 60 * 60); // 180 days ago
    
    const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=D&from=${from}&to=${to}&token=${token}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Finnhub Error: ${res.status}`);

    const json = await res.json();
    
    if (json.s !== 'ok' || !json.c) {
      return { data: [], rateLimit: { remaining: 60, total: 60 } };
    }

    const rawData: StockDataPoint[] = json.c.map((close: number, i: number) => ({
      date: new Date(json.t[i] * 1000).toISOString().split('T')[0],
      open: json.o[i],
      high: json.h[i],
      low: json.l[i],
      close: close,
      volume: json.v[i],
    }));

    const closes = rawData.map(d => d.close);
    const sma20 = calculateSMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const rsi = calculateRSI(closes, 14);

    const enriched = rawData.map((d, i) => ({
      ...d,
      sma20: sma20[i],
      ema50: ema50[i],
      rsi: rsi[i],
    }));

    return { 
      data: enriched.slice(-90), 
      rateLimit: { remaining: 60, total: 60 } 
    };
  } catch (err: any) {
    return { data: null, error: err.message, rateLimit: { remaining: 0, total: 60 } };
  }
}

/**
 * Fetches quote and basic financials for stock details using Finnhub.
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  const token = getFinnhubToken();
  if (!token) return { data: null, error: 'API Key missing', rateLimit: { remaining: 0, total: 60 } };

  try {
    const sym = symbol.toUpperCase();
    
    // Parallel requests for Quote, Profile, and Metrics
    const [quoteRes, profileRes, metricRes] = await Promise.all([
      fetch(`${FINNHUB_BASE_URL}/quote?symbol=${sym}&token=${token}`, { next: { revalidate: 60 } }),
      fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${sym}&token=${token}`, { next: { revalidate: 3600 } }),
      fetch(`${FINNHUB_BASE_URL}/stock/metric?symbol=${sym}&metric=all&token=${token}`, { next: { revalidate: 3600 } })
    ]);

    if (!quoteRes.ok) throw new Error('Symbol quote not found');
    
    const quote = await quoteRes.json();
    const profile = profileRes.ok ? await profileRes.json() : {};
    const metricData = metricRes.ok ? await metricRes.json() : { metric: {} };
    const metrics = metricData.metric || {};

    if (!quote.c) throw new Error('Incomplete market data from Finnhub');

    return {
      data: {
        symbol: sym,
        name: profile.name || sym,
        price: Number(quote.c.toFixed(2)),
        change: Number(quote.d.toFixed(2)),
        changePercent: Number(quote.dp.toFixed(2)),
        peRatio: Number((metrics.peNormalizedAnnual || metrics.peBasicExclExtraTTM || 0).toFixed(2)),
        eps: Number((metrics.epsAnnual || 0).toFixed(2)),
        dividendYield: Number((metrics.dividendYieldIndicatedAnnual || 0).toFixed(2)),
        marketCap: metrics.marketCapitalization ? `${(metrics.marketCapitalization / 1000).toFixed(2)}T` : 'N/A',
        fiftyTwoWeekHigh: Number((metrics['52WeekHigh'] || quote.h).toFixed(2)),
        fiftyTwoWeekLow: Number((metrics['52WeekLow'] || quote.l).toFixed(2)),
      },
      rateLimit: { remaining: 60, total: 60 }
    };
  } catch (err: any) {
    return { data: null, error: err.message, rateLimit: { remaining: 0, total: 60 } };
  }
}
