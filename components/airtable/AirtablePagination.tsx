"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AirtablePaginationProps {
  nextOffset: string | null;
  currentPage: number;
  isLoading: boolean;
  onNextPage: () => void;
}

export function AirtablePagination({
  nextOffset,
  currentPage,
  isLoading,
  onNextPage,
}: AirtablePaginationProps) {
  if (!nextOffset) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-sm text-muted-foreground">Page {currentPage}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={isLoading}
        className="focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Load Next Page
      </Button>
    </div>
  );
}
