"use client"

import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RateLimitProps {
  remaining: number;
  total: number;
}

export function RateLimitDisplay({ remaining, total }: RateLimitProps) {
  const percentage = (remaining / total) * 100;
  const isLow = percentage < 20;

  return (
    <div className="flex flex-col gap-2 p-4 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">API Health</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Simulated rate limit for yfinance-like data requests.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={`text-xs font-bold ${isLow ? 'text-destructive' : 'text-accent'}`}>
          {remaining} / {total}
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground italic">Resets every 60 minutes</p>
    </div>
  );
}