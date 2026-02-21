'use server';

/**
 * @fileOverview STARFISH Alpaca Market Data Engine.
 * Uses native fetch to interface with Alpaca V2 Data API.
 * Requires ALPACA_API_KEY and ALPACA_SECRET env variables.
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

const ALPACA_BASE_URL = 'https://data.alpaca.markets/v2';

function getAlpacaHeaders() {
  const keyId = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET;

  if (!keyId || !secretKey) {
    console.warn('Alpaca credentials missing in environment variables.');
  }

  return {
    'APCA-API-KEY-ID': keyId || '',
    'APCA-API-SECRET-KEY': secretKey || '',
    'Accept': 'application/json',
  };
}

/**
 * Fetches historical bar data from Alpaca for technical analysis.
 * Fetches 180 days to ensure indicators are stabilized for the visible 90-day window.
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    
    const url = `${ALPACA_BASE_URL}/stocks/${symbol.toUpperCase()}/bars?timeframe=1Day&start=${start}&end=${end}&adjustment=all`;
    
    const response = await fetch(url, {
      headers: getAlpacaHeaders(),
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca API Error:', errorText);
      throw new Error(`Alpaca API error: ${response.status}`);
    }

    const json = await response.json();
    const bars = json.bars || [];

    const rawData: StockDataPoint[] = bars.map((bar: any) => ({
      date: bar.t.split('T')[0],
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

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

    // Return only the last 90 data points for the UI
    return { 
      data: enrichedData.slice(-90), 
      rateLimit: { remaining: 1000, total: 1000, resetIn: 0 } 
    };
  } catch (error) {
    console.error('Historical Fetch Failure:', error);
    return { data: [], rateLimit: { remaining: 0, total: 0, resetIn: 0 } };
  }
}

/**
 * Fetches real-time snapshot data and calculates year-range metrics.
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    // 1. Fetch Snapshot for live price and daily change
    const snapshotUrl = `${ALPACA_BASE_URL}/stocks/${symbol.toUpperCase()}/snapshot`;
    const snapshotResponse = await fetch(snapshotUrl, {
      headers: getAlpacaHeaders(),
      next: { revalidate: 60 }
    });

    if (!snapshotResponse.ok) throw new Error('Failed to fetch snapshot');
    const snapshot = await snapshotResponse.json();
    
    const dailyBar = snapshot.dailyBar;
    const prevDailyBar = snapshot.prevDailyBar;
    const latestTrade = snapshot.latestTrade;

    if (!dailyBar || !prevDailyBar) throw new Error('Symbol not found in Alpaca registry');

    const currentPrice = latestTrade?.p || dailyBar.c;
    const change = currentPrice - prevDailyBar.c;
    const changePercent = (change / prevDailyBar.c) * 100;

    // 2. Fetch 1 Year of bars for 52-week high/low
    const yearStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const barsUrl = `${ALPACA_BASE_URL}/stocks/${symbol.toUpperCase()}/bars?timeframe=1Day&start=${yearStart}&adjustment=all`;
    const barsResponse = await fetch(barsUrl, { headers: getAlpacaHeaders(), next: { revalidate: 3600 } });
    
    let fiftyTwoWeekHigh = currentPrice;
    let fiftyTwoWeekLow = currentPrice;

    if (barsResponse.ok) {
      const barsJson = await barsResponse.json();
      const yearBars = barsJson.bars || [];
      if (yearBars.length > 0) {
        fiftyTwoWeekHigh = Math.max(...yearBars.map((b: any) => b.h), currentPrice);
        fiftyTwoWeekLow = Math.min(...yearBars.map((b: any) => b.l), currentPrice);
      }
    }

    return {
      data: {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: Number(currentPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        peRatio: 0,
        eps: 0,
        dividendYield: 0,
        marketCap: 'N/A',
        fiftyTwoWeekHigh: Number(fiftyTwoWeekHigh.toFixed(2)),
        fiftyTwoWeekLow: Number(fiftyTwoWeekLow.toFixed(2)),
      },
      rateLimit: { remaining: 1000, total: 1000, resetIn: 0 },
    };
  } catch (error) {
    console.error('Details Fetch Failure:', error);
    throw error;
  }
}
