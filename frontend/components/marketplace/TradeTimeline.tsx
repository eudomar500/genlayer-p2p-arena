"use client";

import { CheckCircle, Circle, AlertTriangle, XCircle } from "lucide-react";
import { TradeState } from "@/lib/genlayer/types";
import { truncateAddress } from "@/lib/wallet/format";

interface TradeTimelineProps {
  trade: {
    state: number;
    seller: string;
    buyer: string;
    shipped_at: number;
    disputed: boolean;
    llm_verdict_buyer_wins?: boolean;
    llm_verdict_reasoning?: string;
  };
}

export default function TradeTimeline({ trade }: TradeTimelineProps) {
  const steps = buildSteps(trade);
  
  return (
    <div className="relative">
      {steps.map((step, idx) => (
        <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Vertical line connecting nodes */}
          {idx < steps.length - 1 && (
            <div 
              className={`absolute left-3 top-7 w-px h-full ${step.reached ? "bg-[var(--accent-primary)]/50" : "bg-[var(--border-subtle)]"}`}
            />
          )}
          
          {/* Node icon */}
          <div className="relative z-10 flex-shrink-0">
            {step.icon}
          </div>
          
          {/* Step content */}
          <div className="flex-1 pb-2">
            <div className={`text-sm font-medium ${step.reached ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              {step.title}
            </div>
            {step.detail && (
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                {step.detail}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildSteps(trade: TradeTimelineProps["trade"]) {
  const reached = (minState: number) => trade.state >= minState && trade.state !== TradeState.CANCELLED && trade.state !== TradeState.REFUNDED;
  const isCancelled = trade.state === TradeState.CANCELLED;
  
  const filledIcon = (
    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
      <CheckCircle size={14} className="text-[var(--bg-deep)]" />
    </div>
  );
  
  const emptyIcon = (
    <div className="w-6 h-6 rounded-full border-2 border-[var(--border-subtle)]" />
  );
  
  const warningIcon = (
    <div className="w-6 h-6 rounded-full bg-[var(--warning)] flex items-center justify-center">
      <AlertTriangle size={14} className="text-[var(--bg-deep)]" />
    </div>
  );
  
  const cancelIcon = (
    <div className="w-6 h-6 rounded-full bg-[var(--text-tertiary)] flex items-center justify-center">
      <XCircle size={14} className="text-[var(--bg-deep)]" />
    </div>
  );
  
  const steps = [
    {
      title: "Listing created",
      detail: `By ${truncateAddress(trade.seller)}`,
      reached: true,
      icon: filledIcon,
    },
    {
      title: "Listing accepted",
      detail: reached(TradeState.PAID) && trade.buyer && trade.buyer !== trade.seller 
        ? `By ${truncateAddress(trade.buyer)}` 
        : undefined,
      reached: reached(TradeState.PAID) || trade.state === TradeState.REFUNDED,
      icon: (reached(TradeState.PAID) || trade.state === TradeState.REFUNDED) ? filledIcon : emptyIcon,
    },
    {
      title: "Shipped",
      detail: reached(TradeState.SHIPPED) 
        ? `Tracking provided by seller` 
        : undefined,
      reached: reached(TradeState.SHIPPED),
      icon: reached(TradeState.SHIPPED) ? filledIcon : emptyIcon,
    },
    {
      title: "Delivered & paid out",
      detail: trade.state === TradeState.COMPLETED 
        ? "Funds released to seller" 
        : undefined,
      reached: trade.state === TradeState.COMPLETED,
      icon: trade.state === TradeState.COMPLETED ? filledIcon : emptyIcon,
    },
  ];
  
  // Special states
  if (trade.disputed || trade.state === TradeState.DISPUTED) {
    steps.push({
      title: "Dispute opened",
      detail: "Awaiting LLM resolution",
      reached: true,
      icon: warningIcon,
    });
  }
  
  if (trade.disputed && (trade.state === TradeState.COMPLETED || trade.state === TradeState.REFUNDED)) {
    const winnerText = trade.llm_verdict_buyer_wins ? "buyer" : "seller";
    steps.push({
      title: `Dispute resolved by LLM (${winnerText} won)`,
      detail: trade.llm_verdict_reasoning || undefined,
      reached: true,
      icon: filledIcon,
    });
  }
  
  if (isCancelled) {
    return [
      {
        title: "Listing created",
        detail: `By ${truncateAddress(trade.seller)}`,
        reached: true,
        icon: filledIcon,
      },
      {
        title: "Listing cancelled",
        detail: "Seller cancelled before any buyer accepted",
        reached: true,
        icon: cancelIcon,
      },
    ];
  }

  if (trade.state === TradeState.REFUNDED && !trade.disputed) {
    // If it was refunded without dispute (maybe some manual contract refund or auto-refund)
    steps.push({
      title: "Refunded",
      detail: "Funds returned to buyer",
      reached: true,
      icon: filledIcon,
    });
  }
  
  return steps;
}
