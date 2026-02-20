"use client"

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockSearchProps {
  onSearch: (symbol: string) => void;
  isLoading?: boolean;
}

export function StockSearch({ onSearch, isLoading }: StockSearchProps) {
  const [symbol, setSymbol] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.toUpperCase().trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
        <Input
          type="text"
          placeholder="Enter Ticker (e.g. AAPL, TSLA, NVDA)"
          className="pl-11 h-12 bg-white border-2 border-primary text-primary font-bold placeholder:text-muted-foreground/50 rounded-md focus-visible:ring-offset-0 focus-visible:ring-1"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading} 
        className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tighter rounded-md transition-all active:scale-95"
      >
        {isLoading ? "Analyzing..." : "Analyze"}
      </Button>
    </form>
  );
}