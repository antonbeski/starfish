"use client"

import { useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReChartsTooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from "recharts";
import { StockDataPoint } from "@/lib/stock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StockChartProps {
  data: StockDataPoint[];
  symbol: string;
}

export function StockChart({ data, symbol }: StockChartProps) {
  const [chartType, setChartType] = useState<"price" | "technical">("price");

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-xl font-bold tracking-tight">Market Analysis: {symbol}</CardTitle>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
          <TabsList>
            <TabsTrigger value="price">Price Action</TabsTrigger>
            <TabsTrigger value="technical">Indicators</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="date" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                minTickGap={30}
              />
              <YAxis 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value}`}
              />
              <ReChartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)' 
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              
              <Area 
                type="monotone" 
                dataKey="close" 
                fill="hsl(var(--accent))" 
                stroke="none" 
                fillOpacity={0.05} 
                name="Price Area"
              />
              
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2} 
                dot={false} 
                name="Closing Price"
              />

              {chartType === "technical" && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="sma20" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={1.5} 
                    dot={false} 
                    name="SMA 20"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ema50" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={1.5} 
                    dot={false} 
                    name="EMA 50"
                  />
                </>
              )}
              
              <Bar 
                dataKey="volume" 
                yAxisId={1} 
                fill="hsl(var(--primary))" 
                opacity={0.1} 
                name="Volume"
              />
              <YAxis yAxisId={1} hide />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {chartType === "technical" && (
           <div className="h-[150px] w-full mt-8 border-t pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <XAxis dataKey="date" hide />
                  <YAxis fontSize={10} domain={[0, 100]} orientation="right" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <ReChartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke="hsl(var(--destructive))" 
                    dot={false} 
                    name="RSI (14)"
                  />
                  {/* Reference lines for RSI */}
                  <Line dataKey="rsi" stroke="none" /> 
                </ComposedChart>
              </ResponsiveContainer>
              <div className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">Relative Strength Index (RSI)</div>
           </div>
        )}
      </CardContent>
    </Card>
  );
}