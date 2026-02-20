import { StockDetails } from "@/lib/stock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, BarChart3 } from "lucide-react";

interface StockSummaryProps {
  details: StockDetails;
}

export function StockSummary({ details }: StockSummaryProps) {
  const isPositive = details.change >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Price</CardTitle>
          <DollarSign className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${details.price}</div>
          <div className={`flex items-center text-xs font-semibold mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {isPositive ? '+' : ''}{details.change} ({details.changePercent}%)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Market Cap</CardTitle>
          <PieChart className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${details.marketCap}</div>
          <p className="text-xs text-muted-foreground mt-1">Total Valuation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fundamentals</CardTitle>
          <BarChart3 className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="text-xs">
              <span className="text-muted-foreground">P/E:</span>
              <span className="ml-1 font-bold">{details.peRatio}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">EPS:</span>
              <span className="ml-1 font-bold">{details.eps}</span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Yield:</span>
              <span className="ml-1 font-bold">{details.dividendYield}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">52 Week Range</CardTitle>
          <Activity className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-muted-foreground font-bold">${details.fiftyTwoWeekLow}</span>
            <span className="text-[10px] text-muted-foreground font-bold">${details.fiftyTwoWeekHigh}</span>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-accent" 
               style={{ 
                 width: `${((details.price - details.fiftyTwoWeekLow) / (details.fiftyTwoWeekHigh - details.fiftyTwoWeekLow)) * 100}%` 
               }} 
             />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}