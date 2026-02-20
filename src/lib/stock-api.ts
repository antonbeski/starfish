import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from './stock-utils';

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
    resetIn: 3600, // seconds
  };
}

export async function fetchStockHistory(symbol: string): Promise<ApiResponse<StockDataPoint[]>> {
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

  const data: StockDataPoint[] = [];
  let basePrice = 150 + Math.random() * 200;
  const now = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = 0.02;
    const change = basePrice * volatility * (Math.random() - 0.5);
    const open = basePrice + change;
    const close = open + (basePrice * volatility * (Math.random() - 0.5));
    const high = Math.max(open, close) + (Math.random() * 2);
    const low = Math.min(open, close) - (Math.random() * 2);
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    basePrice = close;
  }

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
}

export async function fetchStockDetails(symbol: string): Promise<ApiResponse<StockDetails>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const mockNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'TSLA': 'Tesla, Inc.',
    'META': 'Meta Platforms, Inc.',
    'NVDA': 'NVIDIA Corporation',
  };

  const name = mockNames[symbol.toUpperCase()] || `${symbol.toUpperCase()} Global Ltd.`;
  const price = 100 + Math.random() * 500;
  
  return {
    data: {
      symbol: symbol.toUpperCase(),
      name,
      price: Number(price.toFixed(2)),
      change: Number((Math.random() * 10 - 5).toFixed(2)),
      changePercent: Number((Math.random() * 4 - 2).toFixed(2)),
      peRatio: Number((15 + Math.random() * 20).toFixed(2)),
      eps: Number((2 + Math.random() * 8).toFixed(2)),
      dividendYield: Number((Math.random() * 3).toFixed(2)),
      marketCap: (Math.random() * 3).toFixed(2) + 'T',
      fiftyTwoWeekHigh: Number((price * 1.2).toFixed(2)),
      fiftyTwoWeekLow: Number((price * 0.8).toFixed(2)),
    },
    rateLimit: getRateLimit(),
  };
}