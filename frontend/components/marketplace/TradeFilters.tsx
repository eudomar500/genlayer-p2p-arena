"use client";

import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { TRADE_STATE_LABELS } from "@/lib/genlayer/types";

interface TradeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stateFilter: number | null;
  onStateFilterChange: (value: number | null) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  resultsCount: number;
}

export default function TradeFilters({
  search,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  page,
  totalPages,
  onPageChange,
  resultsCount,
}: TradeFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" 
            size={16} 
          />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>
        
        <select
          value={stateFilter === null ? "" : String(stateFilter)}
          onChange={(e) => onStateFilterChange(e.target.value === "" ? null : Number(e.target.value))}
          className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
        >
          <option value="">All states</option>
          {Object.entries(TRADE_STATE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span>{resultsCount} {resultsCount === 1 ? "trade" : "trades"}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono">{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
