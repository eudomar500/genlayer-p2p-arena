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
    disputed_at?: number;
    dispute_initiator?: string;
    resolved_by_default?: boolean;
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
  const isRefunded = trade.state === TradeState.REFUNDED;
  
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

  const skippedIcon = cancelIcon;
  
  const steps = [
    {
      title: "Listing created",
      detail: `By ${truncateAddress(trade.seller)}`,
      reached: true,
      icon: filledIcon,
    },
    {
      title: "Listing accepted",
      detail: (reached(TradeState.PAID) || isRefunded) && trade.buyer && trade.buyer !== trade.seller 
        ? `By ${truncateAddress(trade.buyer)}` 
        : undefined,
      reached: reached(TradeState.PAID) || isRefunded,
      icon: (reached(TradeState.PAID) || isRefunded) ? filledIcon : emptyIcon,
    },
    {
      title: "Shipped",
      detail: reached(TradeState.SHIPPED) 
        ? `Tracking provided by seller` 
        : (isRefunded ? "Not shipped within window" : undefined),
      reached: reached(TradeState.SHIPPED) || isRefunded,
      icon: reached(TradeState.SHIPPED) 
        ? filledIcon 
        : (isRefunded ? skippedIcon : emptyIcon),
    },
    {
      title: "Delivered & paid out",
      detail: trade.state === TradeState.COMPLETED 
        ? "Funds released to seller" 
        : (isRefunded ? "Refund issued instead" : undefined),
      reached: trade.state === TradeState.COMPLETED || isRefunded,
      icon: trade.state === TradeState.COMPLETED 
        ? filledIcon 
        : (isRefunded ? skippedIcon : emptyIcon),
    },
  ];
  
  // Dispute lifecycle steps
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const initiatorSet =
    trade.dispute_initiator &&
    trade.dispute_initiator.toLowerCase() !== ZERO_ADDRESS;
  const initiatorIsBuyer =
    initiatorSet && trade.dispute_initiator!.toLowerCase() === trade.buyer.toLowerCase();
  const initiatorLabel = initiatorIsBuyer ? "buyer" : "seller";
  const isDisputeActive = trade.state === TradeState.DISPUTED;
  const isDisputeResolved =
    trade.disputed &&
    (trade.state === TradeState.COMPLETED || trade.state === TradeState.REFUNDED);

  if (trade.disputed || isDisputeActive) {
    const detail = initiatorSet
      ? `Initiated by ${initiatorLabel}`
      : "Awaiting LLM resolution";
    steps.push({
      title: "Dispute opened",
      detail,
      reached: true,
      icon: warningIcon,
    });
  }

  if (isDisputeResolved) {
    const winnerText = trade.llm_verdict_buyer_wins ? "buyer" : "seller";
    const resolvedByDefault = Boolean(trade.resolved_by_default);
    const title = resolvedByDefault
      ? `Dispute won by default (${winnerText} won)`
      : `Dispute resolved by LLM (${winnerText} won)`;
    const detail = resolvedByDefault
      ? "Other party did not respond within the window"
      : trade.llm_verdict_reasoning || undefined;
    steps.push({
      title,
      detail,
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
