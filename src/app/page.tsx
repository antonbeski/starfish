"use client"

import { useState, useEffect } from "react";
import { StockSearch } from "@/components/StockSearch";
import { StockChart } from "@/components/StockChart";
import { StockSummary } from "@/components/StockSummary";
import { AiAnalysis } from "@/components/AiAnalysis";
import { fetchStockHistory, fetchStockDetails, StockDataPoint, StockDetails } from "@/lib/stock-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ShieldCheck, Activity, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HomePage() {
  const [symbol, setSymbol] = useState<string>("AAPL");
  const [history, setHistory] = useState<StockDataPoint[]>([]);
  const [details, setDetails] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStockData = async (searchSymbol: string) => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, detailsRes] = await Promise.all([
        fetchStockHistory(searchSymbol),
        fetchStockDetails(searchSymbol)
      ]);
      
      if (histRes.error || detailsRes.error) {
        throw new Error(histRes.error || detailsRes.error || "Data retrieval failed");
      }

      setHistory(histRes.data || []);
      setDetails(detailsRes.data);
      setSymbol(searchSymbol);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setHistory([]);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData("AAPL");
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-10 space-y-6 md:space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 pb-6 md:pb-8 border-b-2 border-primary">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-primary p-2 md:p-3 rounded-md shadow-lg">
            <Star className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-primary">STARFISH</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] md:text-[10px] border-primary px-1.5 py-0 font-bold uppercase tracking-widest">Alpaca Engine</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full lg:max-w-xl">
          <StockSearch onSearch={loadStockData} isLoading={loading} />
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="border-2 border-destructive rounded-none shadow-[4px_4px_0px_rgba(239,68,68,1)]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black uppercase tracking-widest text-xs">Terminal Alert</AlertTitle>
          <AlertDescription className="text-sm font-medium">
            {error}. Please verify your symbols or check API status.
          </AlertDescription>
        </Alert>
      )}

      <main className="space-y-6 md:space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 md:h-32 w-full rounded-md" />)}
          </div>
        ) : details && (
          <StockSummary details={details} />
        )}

        <div className="bg-white rounded-md shadow-2xl border-2 border-primary overflow-hidden">
          {loading ? (
            <Skeleton className="h-[300px] md:h-[600px] w-full" />
          ) : history.length > 0 ? (
            <StockChart data={history} symbol={symbol} />
          ) : !error && (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground uppercase font-black tracking-[0.3em] text-xs">
              No price data available for {symbol}
            </div>
          )}
        </div>

        {details && !loading && history.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <AiAnalysis details={details} history={history} />
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 bg-white rounded-md border-2 border-primary p-5 md:p-8 shadow-md">
            <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Activity className="w-5 h-5" />
              Technical Sentiment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="p-4 md:p-6 rounded-md bg-secondary border border-primary/10 text-center transition-all hover:border-primary">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black mb-1 md:mb-2 tracking-widest">RSI (14)</p>
                <p className="text-xl md:text-3xl font-mono font-bold">{loading ? '...' : history[history.length - 1]?.rsi?.toFixed(2) || 'N/A'}</p>
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mt-1 md:mt-2 block">
                  {history[history.length-1]?.rsi ? (history[history.length-1]!.rsi! > 70 ? 'Overbought' : history[history.length-1]!.rsi! < 30 ? 'Oversold' : 'Neutral') : '---'}
                </span>
              </div>
              <div className="p-4 md:p-6 rounded-md bg-secondary border border-primary/10 text-center transition-all hover:border-primary">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black mb-1 md:mb-2 tracking-widest">SMA 20</p>
                <p className="text-xl md:text-3xl font-mono font-bold">${loading ? '...' : history[history.length - 1]?.sma20?.toFixed(2) || 'N/A'}</p>
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mt-1 md:mt-2 block">Short-term Avg</span>
              </div>
              <div className="p-4 md:p-6 rounded-md bg-secondary border border-primary/10 text-center transition-all hover:border-primary">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-black mb-1 md:mb-2 tracking-widest">EMA 50</p>
                <p className="text-xl md:text-3xl font-mono font-bold">${loading ? '...' : history[history.length - 1]?.ema50?.toFixed(2) || 'N/A'}</p>
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground mt-1 md:mt-2 block">Long-term Trend</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-primary text-white rounded-md p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-20 h-20 md:w-24 md:h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4 uppercase italic">Market Condition</h3>
              <p className="text-sm md:text-base font-medium opacity-90 leading-relaxed">
                Terminal analysis indicates a <span className="underline decoration-2 underline-offset-4 font-bold">{details && details.changePercent > 0 ? 'BULLISH' : 'BEARISH'}</span> trajectory for {symbol}. 
                Momentum is currently {Math.abs(details?.changePercent || 0) > 1.5 ? 'ACCELERATING' : 'STABILIZING'}.
              </p>
            </div>
            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/30 relative z-10">
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                <span>Status</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${error ? 'bg-red-400' : 'bg-green-400'}`} />
                  {error ? 'Interrupted' : 'Synchronized'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="pt-12 md:pt-16 pb-8 md:pb-12 border-t-2 border-primary text-center space-y-6 md:space-y-8">
        <div className="py-4 md:py-8">
          <h2 className="text-3xl md:text-8xl font-black tracking-tighter text-primary px-4 break-words" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            ANTON BESKI
          </h2>
        </div>
        <div className="space-y-3 md:space-y-4 px-4">
          <p className="text-[9px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest">
            © 2026 STARFISH Global Analytics Terminal. Powered by Alpaca Markets.
          </p>
          <p className="text-[8px] md:text-[11px] text-muted-foreground max-w-2xl mx-auto opacity-60">
            Data provided by Alpaca Securities LLC. Historical performance does not guarantee future results. 
            AI analysis is experimental and for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}