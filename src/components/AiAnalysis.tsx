"use client"

import { useState } from "react";
import { StockAnalysisOutput, analyzeStock } from "@/ai/flows/stock-analysis-flow";
import { StockDetails, StockDataPoint } from "@/lib/stock-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2, ShieldAlert, Zap, Target, TrendingUp, AlertTriangle } from "lucide-react";
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
      <div className="flex items-center justify-between border-b-2 border-primary pb-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6" />
          <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">Intelligence Core</h2>
        </div>
        {!analysis && !loading && (
          <Button 
            onClick={handleAnalyze} 
            className="bg-primary text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-none hover:bg-black/90 shadow-[4px_4px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            Initiate Gemini Scan
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-primary/20 bg-secondary/30">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Processing Market Neural Pathways...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-2 border-primary rounded-none shadow-[8px_8px_0px_black]">
              <CardHeader className="bg-primary text-white py-3 px-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed font-medium">{analysis.summary}</p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Technical Breakdown
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.technicalVerdict}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target className="w-3 h-3" /> Fundamental Status
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.fundamentalHealth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="border-2 border-primary p-6 bg-white shadow-[4px_4px_0px_black]">
              <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Risk Assessment
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Sentiment</span>
                  <Badge className={`rounded-none font-black text-[10px] tracking-widest ${
                    analysis.sentiment === 'BULLISH' ? 'bg-green-600' : analysis.sentiment === 'BEARISH' ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    {analysis.sentiment}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Threat Level</span>
                  <Badge variant="outline" className="border-2 border-primary rounded-none font-black text-[10px] tracking-widest">
                    {analysis.riskLevel}
                  </Badge>
                </div>
              </div>

              <div className="mt-8 p-4 bg-secondary border border-primary/10 italic">
                <p className="text-[11px] font-medium leading-relaxed">
                  <AlertTriangle className="w-3 h-3 inline mr-2 mb-0.5" />
                  Directive: {analysis.recommendation}
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setAnalysis(null)}
                className="w-full mt-6 rounded-none border-2 border-primary font-black uppercase text-[9px] tracking-widest h-8 hover:bg-primary hover:text-white transition-all"
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
