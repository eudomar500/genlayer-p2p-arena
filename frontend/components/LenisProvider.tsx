"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useScrollDot } from "./brand/ScrollDotContext";

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const { setLenisInstance } = useScrollDot();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      setLenisInstance(null as unknown as Lenis);
    };
  }, [setLenisInstance]);

  return <>{children}</>;
}
