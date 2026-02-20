import { StockDetails } from "@/lib/stock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3 } from "lucide-react";

interface StockSummaryProps {
  details: StockDetails;
}

export function StockSummary({ details }: StockSummaryProps) {
  const isPositive = details.change >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-2 border-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Market Price</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black font-mono tracking-tighter">${details.price}</div>
          <div className={`flex items-center text-sm font-bold mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1.5" /> : <TrendingDown className="w-4 h-4 mr-1.5" />}
            {isPositive ? '+' : ''}{details.change} ({details.changePercent}%)
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Market Cap</CardTitle>
          <PieChart className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black font-mono tracking-tighter">${details.marketCap}</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-wider">Equity Valuation</p>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Fundamentals</CardTitle>
          <BarChart3 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-2 mt-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">P/E</span>
              <span className="text-lg font-black font-mono">{details.peRatio}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">EPS</span>
              <span className="text-lg font-black font-mono">{details.eps}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Yearly Range</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black font-mono">${details.fiftyTwoWeekLow}</span>
            <span className="text-[10px] font-black font-mono">${details.fiftyTwoWeekHigh}</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-primary/20">
             <div 
               className="h-full bg-primary" 
               style={{ 
                 width: `${((details.price - details.fiftyTwoWeekLow) / (details.fiftyTwoWeekHigh - details.fiftyTwoWeekLow)) * 100}%` 
               }} 
             />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-3 text-center tracking-widest">52 Week Velocity</p>
        </CardContent>
      </Card>
    </div>
  );
}