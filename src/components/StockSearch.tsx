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
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-md items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter stock symbol (e.g. AAPL, TSLA)"
          className="pl-10 h-11 bg-white"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading} className="h-11 px-6 bg-accent hover:bg-accent/90 transition-all duration-300">
        {isLoading ? "Searching..." : "Analyze"}
      </Button>
    </form>
  );
}