"use client";

import { useState, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AirtableSearchBarProps {
  onSearch: (text: string) => void;
  onClear: () => void;
  isLoading: boolean;
  activeSearch: string | null;
  disabled?: boolean;
}

export function AirtableSearchBar({
  onSearch,
  onClear,
  isLoading,
  activeSearch,
  disabled,
}: AirtableSearchBarProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSearch(trimmed);
  };

  const handleClear = () => {
    setText("");
    onClear();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search in table…"
            className="pl-9 pr-8"
            disabled={disabled || isLoading}
          />
          {text && (
            <button
              type="button"
              onClick={() => setText("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          disabled={!text.trim() || disabled || isLoading}
          className="shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {activeSearch && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
            <Search className="h-3 w-3" />
            Searching for &ldquo;{activeSearch}&rdquo;
            <button
              type="button"
              onClick={handleClear}
              className="ml-0.5 hover:text-primary/60 focus-visible:outline-none rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
