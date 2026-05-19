"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import Lenis from "lenis";

export type IntroState = "pending" | "playing" | "done";

interface ScrollDotContextType {
  registerAnchor: (key: string, ref: React.RefObject<HTMLDivElement | null>) => void;
  scrollToSection: (key: string) => void;
  activeSection: string | null;
  anchors: Record<string, { y: number; x: number }>;
  lenisInstance: Lenis | null;
  setLenisInstance: (lenis: Lenis) => void;
  introState: IntroState;
  markIntroDone: () => void;
}

const ScrollDotContext = createContext<ScrollDotContextType | null>(null);

export function ScrollDotProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<Record<string, { y: number; x: number }>>({});
  const anchorRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [introState, setIntroState] = useState<IntroState>("pending");

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem("pointmarket-intro-played");
    if (hasPlayed) {
      setIntroState("done");
    } else {
      // Small delay ensures client is mounted and anchors can be calculated 
      // before we say we are playing, although we can just set playing immediately
      setIntroState("playing");
    }
  }, []);

  const markIntroDone = useCallback(() => {
    setIntroState("done");
    sessionStorage.setItem("pointmarket-intro-played", "true");
  }, []);

  const registerAnchor = useCallback((key: string, ref: React.RefObject<HTMLDivElement | null>) => {
    anchorRefs.current[key] = ref;
  }, []);

  const computeAnchors = useCallback(() => {
    const newAnchors: Record<string, { y: number; x: number }> = {};
    for (const [key, ref] of Object.entries(anchorRefs.current)) {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        // Calculate absolute position on document
        newAnchors[key] = {
          y: rect.top + window.scrollY,
          x: rect.left + window.scrollX + rect.width / 2, // Center of the element
        };
      }
    }
    setAnchors(newAnchors);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      computeAnchors();
    }, 100);

    window.addEventListener("resize", computeAnchors);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", computeAnchors);
    };
  }, [computeAnchors]);

  // Track active section based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scanLine = scrollY + viewportHeight * 0.4; // 40% down the screen

      let closestSection: string | null = null;
      let minDistance = Infinity;

      for (const [key, anchor] of Object.entries(anchors)) {
        const distance = Math.abs(anchor.y - scanLine);
        if (distance < minDistance) {
          minDistance = distance;
          closestSection = key;
        }
      }

      if (closestSection && closestSection !== activeSection) {
        setActiveSection(closestSection);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [anchors, activeSection]);

  const scrollToSection = useCallback(
    (key: string) => {
      const targetAnchor = anchors[key];
      if (targetAnchor && lenisInstance) {
        lenisInstance.scrollTo(targetAnchor.y - 120, { duration: 1.2 });
      } else if (targetAnchor) {
        window.scrollTo({ top: targetAnchor.y - 120, behavior: "smooth" });
      }
    },
    [anchors, lenisInstance]
  );

  return (
    <ScrollDotContext.Provider
      value={{
        registerAnchor,
        scrollToSection,
        activeSection,
        anchors,
        lenisInstance,
        setLenisInstance,
        introState,
        markIntroDone,
      }}
    >
      {children}
    </ScrollDotContext.Provider>
  );
}

export function useScrollDot() {
  const context = useContext(ScrollDotContext);
  if (!context) {
    throw new Error("useScrollDot must be used within a ScrollDotProvider");
  }
  return context;
}
