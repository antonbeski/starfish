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
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-6 md:pb-8 px-5 md:px-8 border-b">
        <div>
          <CardTitle className="text-lg md:text-2xl font-black tracking-tight uppercase">Price Matrix: {symbol}</CardTitle>
          <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">90-Day Rolling Analysis</p>
        </div>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-2 w-full md:w-64 bg-secondary border border-primary/20">
            <TabsTrigger value="price" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-black text-[9px] md:text-[10px] tracking-widest h-8 md:h-10">Price Action</TabsTrigger>
            <TabsTrigger value="technical" className="data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-black text-[9px] md:text-[10px] tracking-widest h-8 md:h-10">Indicators</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4 md:p-8">
        <div className="h-[280px] sm:h-[350px] md:h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
              <XAxis 
                dataKey="date" 
                fontSize={9} 
                tickLine={false} 
                axisLine={{ stroke: 'black', strokeWidth: 1 }} 
                minTickGap={30}
                tick={{ fill: 'black', fontWeight: 'bold' }}
              />
              <YAxis 
                fontSize={9} 
                tickLine={false} 
                axisLine={{ stroke: 'black', strokeWidth: 1 }} 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${Math.round(value)}`}
                tick={{ fill: 'black', fontWeight: 'bold' }}
              />
              <ReChartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderColor: 'black',
                  borderWidth: '2px',
                  borderRadius: '0px',
                  boxShadow: '4px 4px 0px black',
                  fontSize: '10px'
                }}
                labelStyle={{ fontWeight: 'black', marginBottom: '4px' }}
              />
              <Legend 
                verticalAlign="top" 
                height={30} 
                iconType="rect" 
                wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '10px' }} 
              />
              
              <Area 
                type="stepAfter" 
                dataKey="close" 
                fill="black" 
                stroke="none" 
                fillOpacity={0.05} 
                name="Volume Shadow"
              />
              
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="black" 
                strokeWidth={2.5} 
                dot={false} 
                name="Closing Delta"
                animationDuration={1500}
              />

              {chartType === "technical" && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="sma20" 
                    stroke="black" 
                    strokeWidth={1.5} 
                    dot={false} 
                    name="SMA 20"
                    strokeDasharray="4 4"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ema50" 
                    stroke="#666" 
                    strokeWidth={1.5} 
                    dot={false} 
                    name="EMA 50"
                  />
                </>
              )}
              
              <Bar 
                dataKey="volume" 
                yAxisId={1} 
                fill="black" 
                opacity={0.15} 
                name="Trade Volume"
              />
              <YAxis yAxisId={1} hide />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {chartType === "technical" && (
           <div className="h-[120px] md:h-[200px] w-full mt-6 md:mt-8 border-t-2 border-primary pt-6 md:pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis fontSize={9} domain={[0, 100]} orientation="right" tickLine={false} axisLine={{ stroke: 'black' }} tick={{ fontWeight: 'bold' }} />
                  <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.2} />
                  <ReChartsTooltip 
                     contentStyle={{ 
                        backgroundColor: 'white', 
                        borderColor: 'black',
                        borderWidth: '2px',
                        borderRadius: '0px',
                        fontSize: '10px'
                      }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke="black" 
                    dot={false} 
                    name="RSI Momentum"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="text-center text-[8px] md:text-[10px] text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] font-black mt-3 md:mt-4">Relative Strength Oscillation (RSI)</div>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
