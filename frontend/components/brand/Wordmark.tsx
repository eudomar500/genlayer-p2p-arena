"use client";

import React, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useScrollDot } from "./ScrollDotContext";

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
  withSignature?: boolean;
  isHero?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 80,
  xl: 128,
};

export default function Wordmark({
  size = "lg",
  variant,
  withSignature = false,
  isHero = false,
}: WordmarkProps) {
  const height = sizeMap[size];
  const sigSize = Math.max(10, height * 0.18);
  const letters = "pointmarket".split("");
  
  const { introState } = useScrollDot();
  const controls = useAnimation();

  useEffect(() => {
    console.log("[Wordmark] introState changed:", introState, "isHero:", isHero);
    if (isHero && introState === "playing") {
      console.log("[Wordmark] starting letter wave!");
      controls.start((i) => ({
        y: [0, -6, 0],
        transition: {
          delay: 0.4 + i * 0.05,
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
          times: [0, 0.5, 1],
        },
      }));
    }
  }, [isHero, introState, controls]);

  return (
    <div className={`flex flex-col ${withSignature ? "items-start" : ""}`}>
      {/* 
        OPTION C: Layered approach. 
        HTML spans for perfectly clean Framer Motion transforms.
        SVG wrapper for the dot to guarantee 100% pixel-perfect positioning.
      */}
      <div 
        className="relative"
        style={{ height, width: height * 5 }}
      >
        {/* Layer 1: HTML letters */}
        <div 
          className="absolute inset-0 flex items-end"
          style={{ 
            color: "var(--text-primary)",
            fontFamily: "var(--font-inter)",
            fontSize: height * 0.84,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            // SVG baseline is y=75 on a 100px canvas (25px from bottom).
            paddingBottom: height * 0.25,
            lineHeight: 0, // Forces the flex item's bottom edge to be the exact baseline
          }}
        >
          {letters.map((l, i) => (
            <motion.span 
              key={i} 
              custom={i} 
              animate={isHero ? controls : undefined}
              style={{ display: "inline-block" }}
            >
              {l}
            </motion.span>
          ))}
        </div>

        {/* Layer 2: Exact SVG dot */}
        <svg
          viewBox="0 0 500 100"
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="488" cy="75" r="14" fill="var(--accent-primary)" />
        </svg>
      </div>

      {withSignature && (
        <div className="flex items-center gap-1.5 mt-1 opacity-80 pl-1">
          <span
            className="font-mono text-[var(--text-secondary)] uppercase tracking-widest"
            style={{ fontSize: sigSize, lineHeight: 1 }}
          >
            by
          </span>
          <svg width={sigSize} height={sigSize} viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="5" fill="var(--accent-primary)" />
          </svg>
          <span
            className="font-mono text-[var(--text-secondary)] uppercase tracking-widest"
            style={{ fontSize: sigSize, lineHeight: 1 }}
          >
            islandlabs
          </span>
        </div>
      )}
    </div>
  );
}
