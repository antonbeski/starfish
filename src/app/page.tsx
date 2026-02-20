"use client"

import { useState, useEffect } from "react";
import { StockSearch } from "@/components/StockSearch";
import { StockChart } from "@/components/StockChart";
import { StockSummary } from "@/components/StockSummary";
import { RateLimitDisplay } from "@/components/RateLimitDisplay";
import { fetchStockHistory, fetchStockDetails, StockDataPoint, StockDetails } from "@/lib/stock-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 md:p-2.5 rounded-xl shadow-sm">
            <Star className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-accent">STARFISH</h1>
            <p className="text-[10px] md:text-sm text-muted-foreground font-medium uppercase tracking-widest">Global Analytics Terminal</p>
          </div>
        </div>
        
        <div className="flex-1 w-full md:max-w-md">
          <StockSearch onSearch={loadStockData} isLoading={loading} />
        </div>

        <div className="hidden lg:block w-48">
          <RateLimitDisplay remaining={rateLimit.remaining} total={rateLimit.total} />
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="space-y-6 md:space-y-8">
        
        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : details && (
          <StockSummary details={details} />
        )}

        {/* Main Chart Area */}
        <div className="bg-white rounded-2xl shadow-sm border p-1 overflow-hidden">
          {loading ? (
            <Skeleton className="h-[300px] md:h-[500px] w-full rounded-xl" />
          ) : (
            <StockChart data={history} symbol={symbol} />
          )}
        </div>

        {/* Technical Data Table / Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border p-4 md:p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              Technical Sentiment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold mb-1">RSI (14)</p>
                <p className="text-lg md:text-xl font-mono">{loading ? '...' : history[history.length - 1]?.rsi?.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold mb-1">SMA 20</p>
                <p className="text-lg md:text-xl font-mono">${loading ? '...' : history[history.length - 1]?.sma20?.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold mb-1">EMA 50</p>
                <p className="text-lg md:text-xl font-mono">${loading ? '...' : history[history.length - 1]?.ema50?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-accent text-white rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold mb-2">Market Condition</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Calculated based on technical indicators. Current momentum suggests a {details && details.changePercent > 0 ? 'Bullish' : 'Bearish'} trend for {symbol}.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span>Last Updated</span>
                <span>Just Now</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer / Disclaimer */}
      <footer className="pt-12 pb-8 border-t text-center text-[10px] md:text-xs text-muted-foreground space-y-2">
        <p>© 2024 STARFISH Analytics. Data provided via simulated terminal.</p>
        <p>Market data is delayed by 15 minutes. All information is provided for educational purposes only.</p>
      </footer>
    </div>
  );
}
