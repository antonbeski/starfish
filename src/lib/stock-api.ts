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
  peRatio: number; // Placeholder for Alpaca (not in market data API)
  eps: number;     // Placeholder for Alpaca
  dividendYield: number; // Placeholder for Alpaca
  marketCap: string;     // Placeholder for Alpaca
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
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY || '',
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET || '',
    'Accept': 'application/json',
  };
}

/**
 * Fetches historical bar data from Alpaca.
 */
export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  try {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago
    
    const url = `${ALPACA_BASE_URL}/stocks/${symbol.toUpperCase()}/bars?timeframe=1Day&start=${start}&end=${end}&adjustment=all`;
    
    const response = await fetch(url, {
      headers: getAlpacaHeaders(),
      next: { revalidate: 300 } // Cache for 5 mins
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca History Error:', errorText);
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

    return { 
      data: enrichedData, 
      rateLimit: { remaining: 1000, total: 1000, resetIn: 0 } 
    };
  } catch (error) {
    console.error('Terminal History Error:', error);
    return { data: [], rateLimit: { remaining: 0, total: 0, resetIn: 0 } };
  }
}

/**
 * Fetches real-time snapshot data from Alpaca.
 */
export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  try {
    const url = `${ALPACA_BASE_URL}/stocks/${symbol.toUpperCase()}/snapshot`;
    
    const response = await fetch(url, {
      headers: getAlpacaHeaders(),
      next: { revalidate: 60 } // Cache for 1 min
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alpaca Details Error:', errorText);
      throw new Error(`Alpaca API error: ${response.status}`);
    }

    const json = await response.json();
    const dailyBar = json.dailyBar;
    const prevDailyBar = json.prevDailyBar;
    const latestTrade = json.latestTrade;

    if (!dailyBar || !prevDailyBar) throw new Error('Symbol details not found');

    const price = latestTrade?.p || dailyBar.c;
    const change = price - prevDailyBar.c;
    const changePercent = (change / prevDailyBar.c) * 100;

    return {
      data: {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(), // Alpaca Data API doesn't provide company names
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        peRatio: 0, // Fundamentals not available in Alpaca Market Data API
        eps: 0,
        dividendYield: 0,
        marketCap: 'N/A',
        fiftyTwoWeekHigh: 0, // Would require fetching 1yr of bars to calculate
        fiftyTwoWeekLow: 0,
      },
      rateLimit: { remaining: 1000, total: 1000, resetIn: 0 },
    };
  } catch (error) {
    console.error('Terminal Details Error:', error);
    throw error;
  }
}
