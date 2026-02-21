"use client"

import { useState } from "react";
import { StockAnalysisOutput, analyzeStock } from "@/ai/flows/stock-analysis-flow";
import { StockDetails, StockDataPoint } from "@/lib/stock-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert, Zap, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AiAnalysisProps {
  details: StockDetails;
  history: StockDataPoint[];
}

export function AiAnalysis({ details, history }: AiAnalysisProps) {
  const [analysis, setAnalysis] = useState<StockAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeStock({
        symbol: details.symbol,
        name: details.name,
        price: details.price,
        changePercent: details.changePercent,
        marketCap: details.marketCap,
        peRatio: details.peRatio,
        history: history.slice(-30).map(h => ({
          date: h.date,
          close: h.close,
          rsi: h.rsi,
          sma20: h.sma20,
          ema50: h.ema50,
        })),
      });
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-primary pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-2xl font-black tracking-tighter uppercase italic">Intelligence Core</h2>
        </div>
        {!analysis && !loading && (
          <Button 
            onClick={handleAnalyze} 
            className="w-full sm:w-auto bg-primary text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] h-9 md:h-10 px-4 md:px-6 rounded-none hover:bg-black/90 shadow-[3px_3px_0px_black] md:shadow-[4px_4px_0px_black] active:translate-x-0.5 md:active:translate-x-1 active:translate-y-0.5 md:active:translate-y-1 active:shadow-none transition-all"
          >
            Initiate Gemini Scan
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 border-2 border-dashed border-primary/20 bg-secondary/30">
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin mb-4" />
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] animate-pulse text-center px-4">Processing Market Neural Pathways...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-2 border-primary rounded-none shadow-[4px_4px_0px_black] md:shadow-[8px_8px_0px_black]">
              <CardHeader className="bg-primary text-white py-3 px-4 md:px-6">
                <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" /> Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <p className="text-xs md:text-sm leading-relaxed font-medium">{analysis.summary}</p>
                <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Technical Breakdown
                    </h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">{analysis.technicalVerdict}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target className="w-3 h-3" /> Fundamental Status
                    </h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">{analysis.fundamentalHealth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="border-2 border-primary p-4 md:p-6 bg-white shadow-[4px_4px_0px_black]">
              <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4" /> Risk Assessment
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground">Sentiment</span>
                  <Badge className={`rounded-none font-black text-[9px] md:text-[10px] tracking-widest ${
                    analysis.sentiment === 'BULLISH' ? 'bg-green-600' : analysis.sentiment === 'BEARISH' ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    {analysis.sentiment}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground">Threat Level</span>
                  <Badge variant="outline" className="border-2 border-primary rounded-none font-black text-[9px] md:text-[10px] tracking-widest">
                    {analysis.riskLevel}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 md:mt-8 p-3 md:p-4 bg-secondary border border-primary/10 italic">
                <p className="text-[10px] md:text-[11px] font-medium leading-relaxed">
                  <AlertTriangle className="w-3 h-3 inline mr-2 mb-0.5" />
                  Directive: {analysis.recommendation}
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setAnalysis(null)}
                className="w-full mt-6 rounded-none border-2 border-primary font-black uppercase text-[8px] md:text-[9px] tracking-widest h-8 hover:bg-primary hover:text-white transition-all"
              >
                Clear Cache
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}