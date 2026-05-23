"use client";
import React from "react";
import { Check } from "lucide-react";
import type { TxUiState } from "../../lib/tx/types";

/**
 * Three-step progress indicator for a GenLayer transaction.
 *
 * The 14 protocol states collapse into 3 visible steps: Submitted,
 * Accepted, Finalized. See docs/TX_LIFECYCLE.md for the full mapping.
 *
 * The `failed` ui state is handled by TxItem before this component is
 * rendered, so this prop type is narrowed to the success path only.
 */

type ActiveStateProp = Extract<TxUiState, "submitted" | "accepted" | "finalized">;

const STEPS: { key: ActiveStateProp; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "accepted", label: "Accepted" },
  { key: "finalized", label: "Finalized" },
];

function stepStatus(
  currentIndex: number,
  stepIndex: number,
): "done" | "active" | "pending" {
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

interface TxProgressBarProps {
  uiState: ActiveStateProp;
}

export default function TxProgressBar({ uiState }: TxProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === uiState);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const status = stepStatus(currentIndex, idx);
        return (
          <React.Fragment key={step.key}>
            <StepCircle status={status} label={step.label} />
            {idx < STEPS.length - 1 && (
              <div
                className="h-px flex-1"
                style={{
                  backgroundColor:
                    idx < currentIndex
                      ? "var(--accent-primary)"
                      : "var(--border-subtle)",
                }}
                aria-hidden
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepCircle({
  status,
  label,
}: {
  status: "done" | "active" | "pending";
  label: string;
}) {
  const circleStyle: React.CSSProperties =
    status === "done" || status === "active"
      ? {
          backgroundColor: "var(--accent-primary)",
          borderColor: "var(--accent-primary)",
          color: "var(--bg-deep)",
        }
      : {
          backgroundColor: "transparent",
          borderColor: "var(--border-strong)",
          color: "var(--text-tertiary)",
        };

  const pulseClass = status === "active" ? "animate-pulse" : "";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${pulseClass}`}
        style={circleStyle}
        title={label}
        aria-label={`${label}: ${status}`}
      >
        {status === "done" && <Check size={12} aria-hidden />}
      </div>
      <span
        className="text-[10px]"
        style={{
          color:
            status === "pending"
              ? "var(--text-tertiary)"
              : "var(--text-secondary)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
