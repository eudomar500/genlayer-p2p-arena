"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useScrollDot } from "./ScrollDotContext";

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
  withSignature?: boolean;
  isHero?: boolean;
  dotRef?: React.RefObject<HTMLDivElement | null>;
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
  dotRef,
}: WordmarkProps) {
  const height = sizeMap[size];
  const letters = "pointmarket".split("");
  
  const { introState } = useScrollDot();
  const controls = useAnimation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHero && introState === "playing") {
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
        Linear Proportional Layout:
        Using HTML flex layout instead of absolute SVG positioning guarantees the dot
        stays proportionally pegged to the 't' regardless of font hinting or rendering
        differences across sizes.
      */}
      <div 
        className="flex items-baseline"
        style={{ height }}
      >
        <div 
          className="flex items-baseline"
          style={{ 
            color: "var(--text-primary)",
            fontFamily: "var(--font-inter)",
            fontSize: height * 0.84,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            lineHeight: 1
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

        {/* 
          Large static dot in flow:
          marginLeft provides a strict, proportional gap at every scale.
          translateY(50%) aligns its center perfectly with the baseline.
        */}
        <div 
          className="rounded-full shrink-0 relative"
          style={{
            backgroundColor: "var(--accent-primary)",
            width: height * 0.28,
            height: height * 0.28,
            marginLeft: height * 0.05,
            transform: "translateY(50%)"
          }}
        >
          {dotRef && (
            <div 
              ref={dotRef}
              className="absolute pointer-events-none"
              style={mounted ? {
                // Anchor starts precisely at the center of the large dot
                top: "50%",
                left: "50%",
                // Translate diagonally at exactly 45 degrees.
                // Diagonal Distance = largeDotRadius + smallDotRadius(7) + smallDotDiameter(14) = largeDotRadius + 21
                // dx = dy = DiagonalDistance * cos(45deg)
                transform: `translate(${(height * 0.14 + 21) * 0.7071}px, -${(height * 0.14 + 21) * 0.7071}px)`,
                width: 0,
                height: 0
              } : {
                // Hydration-safe initial state
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                opacity: 0
              }}
            />
          )}
        </div>
      </div>

      {withSignature && (
        <div className="flex items-center mt-1 pl-1">
          <span
            className="font-mono text-[var(--text-tertiary)]"
            style={{ fontSize: 12, lineHeight: 1 }}
          >
            by
          </span>
          <span
            className="rounded-full"
            style={{
              backgroundColor: "var(--accent-primary)",
              width: 8,
              height: 8,
              marginLeft: 6,
              marginRight: 6,
            }}
          />
          <span
            className="font-mono text-[var(--text-tertiary)]"
            style={{ fontSize: 12, lineHeight: 1 }}
          >
            islandlabs
          </span>
        </div>
      )}
    </div>
  );
}
