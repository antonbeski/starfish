'use server';

/**
 * @fileOverview STARFISH Alpaca Market Data Engine.
 * High-performance native fetch implementation for Alpaca V2 Data API.
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

const ALPACA_BASE_URL = 'https://data.alpaca.markets/v2';

function getAlpacaHeaders() {
  const keyId = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET;

  if (!keyId || !secretKey) {
    console.error('CRITICAL: Alpaca credentials missing.');
    return null;
  }

  return {
    'APCA-API-KEY-ID': keyId,
    'APCA-API-SECRET-KEY': secretKey,
    'Accept': 'application/json',
  };
}

/**
 * Fetches historical bars and calculates technical indicators.
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  const headers = getAlpacaHeaders();
  if (!headers) return { data: null, error: 'Credentials missing', rateLimit: { remaining: 0, total: 0 } };

  try {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const url = `${ALPACA_BASE_URL}/stocks/${symbol.toUpperCase()}/bars?timeframe=1Day&start=${start}&end=${end}&adjustment=all`;

    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Alpaca Error: ${res.status}`);

    const json = await res.json();
    const bars = json.bars || [];

    if (bars.length === 0) return { data: [], rateLimit: { remaining: 1000, total: 1000 } };

    const rawData: StockDataPoint[] = bars.map((bar: any) => ({
      date: bar.t.split('T')[0],
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
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
      rateLimit: { remaining: 1000, total: 1000 } 
    };
  } catch (err: any) {
    return { data: null, error: err.message, rateLimit: { remaining: 0, total: 0 } };
  }
}

/**
 * Fetches snapshot for real-time price and daily metrics.
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  const headers = getAlpacaHeaders();
  if (!headers) return { data: null, error: 'Credentials missing', rateLimit: { remaining: 0, total: 0 } };

  try {
    const sym = symbol.toUpperCase();
    const snapshotUrl = `${ALPACA_BASE_URL}/stocks/${sym}/snapshot`;
    const snapRes = await fetch(snapshotUrl, { headers, next: { revalidate: 60 } });
    
    if (!snapRes.ok) throw new Error('Symbol not found');
    const snapshot = await snapRes.json();

    if (!snapshot.dailyBar || !snapshot.prevDailyBar) throw new Error('Incomplete market data');

    const currentPrice = snapshot.latestTrade?.p || snapshot.dailyBar.c;
    const change = currentPrice - snapshot.prevDailyBar.c;
    const changePercent = (change / snapshot.prevDailyBar.c) * 100;

    // Fetch year bars for 52-week range
    const yearStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const barsUrl = `${ALPACA_BASE_URL}/stocks/${sym}/bars?timeframe=1Day&start=${yearStart}&adjustment=all`;
    const barsRes = await fetch(barsUrl, { headers, next: { revalidate: 3600 } });
    
    let high = currentPrice;
    let low = currentPrice;

    if (barsRes.ok) {
      const barsJson = await barsRes.Res.json();
      const bars = barsJson.bars || [];
      if (bars.length > 0) {
        high = Math.max(...bars.map((b: any) => b.h), currentPrice);
        low = Math.min(...bars.map((b: any) => b.l), currentPrice);
      }
    }

    return {
      data: {
        symbol: sym,
        name: sym,
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        peRatio: 0, // Fundamentals require separate premium data subscriptions
        eps: 0,
        dividendYield: 0,
        marketCap: 'N/A',
        fiftyTwoWeekHigh: Number(high.toFixed(2)),
        fiftyTwoWeekLow: Number(low.toFixed(2)),
      },
      rateLimit: { remaining: 1000, total: 1000 }
    };
  } catch (err: any) {
    return { data: null, error: err.message, rateLimit: { remaining: 0, total: 0 } };
  }
}