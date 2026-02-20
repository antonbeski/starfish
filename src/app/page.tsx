"use client"

import { useState, useEffect } from "react";
import { StockSearch } from "@/components/StockSearch";
import { StockChart } from "@/components/StockChart";
import { StockSummary } from "@/components/StockSummary";
import { RateLimitDisplay } from "@/components/RateLimitDisplay";
import { fetchStockHistory, fetchStockDetails, StockDataPoint, StockDetails } from "@/lib/stock-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ShieldCheck, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const [symbol, setSymbol] = useState<string>("AAPL");
  const [history, setHistory] = useState<StockDataPoint[]>([]);
  const [details, setDetails] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimit, setRateLimit] = useState({ remaining: 100, total: 100 });

  const loadStockData = async (searchSymbol: string) => {
    setLoading(true);
    try {
      const [histRes, detailsRes] = await Promise.all([
        fetchStockHistory(searchSymbol),
        fetchStockDetails(searchSymbol)
      ]);
      
      setHistory(histRes.data);
      setDetails(detailsRes.data);
      setRateLimit(detailsRes.rateLimit);
      setSymbol(searchSymbol);
    } catch (error) {
      console.error("Failed to fetch stock data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData("AAPL");
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8 md:space-y-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b-2 border-primary">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-md shadow-lg">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-primary">STARFISH</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">Data Terminal v2.0</span>
              <Badge variant="outline" className="text-[10px] border-primary px-1.5 py-0">LIVE</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full md:max-w-xl">
          <StockSearch onSearch={loadStockData} isLoading={loading} />
        </div>

        <div className="hidden xl:block">
          <RateLimitDisplay remaining={rateLimit.remaining} total={rateLimit.total} />
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="space-y-8 md:space-y-12">
        
        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-md" />)}
          </div>
        ) : details && (
          <StockSummary details={details} />
        )}

        {/* Main Chart Area */}
        <div className="bg-white rounded-md shadow-2xl border-2 border-primary overflow-hidden">
          {loading ? (
            <Skeleton className="h-[400px] md:h-[600px] w-full" />
          ) : (
            <StockChart data={history} symbol={symbol} />
          )}
        </div>

        {/* Technical Analysis & Market Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-md border-2 border-primary p-6 md:p-8 shadow-md">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Activity className="w-5 h-5" />
              Technical Sentiment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-md bg-secondary border border-primary/10 text-center transition-all hover:border-primary">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black mb-2 tracking-widest">RSI (14)</p>
                <p className="text-2xl md:text-3xl font-mono font-bold">{loading ? '...' : history[history.length - 1]?.rsi?.toFixed(2)}</p>
                <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2 block">
                  {history[history.length-1]?.rsi && history[history.length-1]!.rsi! > 70 ? 'Overbought' : history[history.length-1]?.rsi && history[history.length-1]!.rsi! < 30 ? 'Oversold' : 'Neutral'}
                </span>
              </div>
              <div className="p-6 rounded-md bg-secondary border border-primary/10 text-center transition-all hover:border-primary">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black mb-2 tracking-widest">SMA 20</p>
                <p className="text-2xl md:text-3xl font-mono font-bold">${loading ? '...' : history[history.length - 1]?.sma20?.toFixed(2)}</p>
                <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2 block">Short-term Avg</span>
              </div>
              <div className="p-6 rounded-md bg-secondary border border-primary/10 text-center transition-all hover:border-primary">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black mb-2 tracking-widest">EMA 50</p>
                <p className="text-2xl md:text-3xl font-mono font-bold">${loading ? '...' : history[history.length - 1]?.ema50?.toFixed(2)}</p>
                <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2 block">Long-term Trend</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-primary text-white rounded-md p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-4 uppercase italic">Market Condition</h3>
              <p className="text-base font-medium opacity-90 leading-relaxed">
                Terminal analysis indicates a <span className="underline decoration-2 underline-offset-4">{details && details.changePercent > 0 ? 'BULLISH' : 'BEARISH'}</span> trajectory for {symbol}. 
                Momentum is currently {Math.abs(details?.changePercent || 0) > 1.5 ? 'ACCELERATING' : 'STABILIZING'}.
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-white/30 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span>Status</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Synchronized
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer / Disclaimer */}
      <footer className="pt-16 pb-12 border-t-2 border-primary text-center space-y-4">
        <div className="flex justify-center gap-6 text-primary mb-4">
            <Star className="w-5 h-5" />
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest">
          © 2024 STARFISH Global Analytics Terminal. All rights reserved.
        </p>
        <p className="text-[9px] md:text-[11px] text-muted-foreground max-w-2xl mx-auto opacity-60 px-4">
          Data is provided "as is" and solely for informational purposes, not for trading purposes or advice. 
          Market data may be delayed. STARFISH does not verify any data and disclaims any obligation to do so.
        </p>
      </footer>
    </div>
  );
}