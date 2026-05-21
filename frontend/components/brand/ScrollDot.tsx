"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useAnimation } from "framer-motion";
import { useScrollDot } from "./ScrollDotContext";

export default function ScrollDot() {
  const { activeSection, anchors, introState, markIntroDone } = useScrollDot();
  const { scrollY } = useScroll();
  const [isMounted, setIsMounted] = useState(false);
  const [hasStartedIntro, setHasStartedIntro] = useState(false);
  const introControls = useAnimation();

  // We need to keep track of the target document position
  const [targetDoc, setTargetDoc] = useState({ x: -100, y: -100 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (activeSection && anchors[activeSection]) {
      setTargetDoc(anchors[activeSection]);
    } else if (anchors["hero"]) {
      // Default to hero if no active section yet
      setTargetDoc(anchors["hero"]);
    }
  }, [activeSection, anchors]);

  // The target screen position is the document position minus the current scroll
  const targetScreenY = useTransform(scrollY, (currentScroll) => {
    if (!isMounted) return -100;
    return targetDoc.y - currentScroll;
  });

  const targetScreenX = useTransform(() => {
    if (!isMounted) return -100;
    return targetDoc.x;
  });

  // Apply the requested spring physics
  const springConfig = { stiffness: 150, damping: 30 };
  const y = useSpring(targetScreenY, springConfig);
  const x = useSpring(targetScreenX, springConfig);

  useEffect(() => {
    if (introState === "playing" && isMounted && targetDoc.y !== -100 && !hasStartedIntro) {
      setHasStartedIntro(true);
      
      const sequence = async () => {
        try {
          // Initial setup: hidden above viewport
          introControls.set({ y: -100, x: targetDoc.x, opacity: 0, scaleY: 1 });
          
          // Wait 300ms
          await new Promise(r => setTimeout(r, 300));
          
          // Drop animation (stiffness: 80, damping: 12)
          introControls.start({
            opacity: 1,
            y: targetDoc.y - window.scrollY,
            transition: { type: "spring", stiffness: 80, damping: 12 }
          });

          // Wait until 1.0s total time (700ms from the 0.3s mark)
          await new Promise(r => setTimeout(r, 700));

          // Squash and stretch at landing
          await introControls.start({
            scaleY: [1, 0.85, 1],
            transition: { duration: 0.15, ease: "easeOut" }
          });
        } catch (error) {
          console.error("ScrollDot intro animation error:", error);
        } finally {
          // End of intro (1.15s)
          markIntroDone();
        }
      };
      
      sequence();
    }
  }, [introState, isMounted, targetDoc, introControls, hasStartedIntro, markIntroDone]);

  if (!isMounted) return null;

  const isPlaying = introState === "playing";

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        // When intro is done, use the scroll-tracking springs.
        // When playing, the x and y are controlled by introControls via the animate prop.
        ...(isPlaying ? {} : { x, y }),
        // Center the dot on its coordinates
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 50,
        pointerEvents: "none",
      }}
      animate={isPlaying ? introControls : { opacity: 1, scaleY: 1 }}
      initial={isPlaying ? { opacity: 0 } : false}
      transition={isPlaying ? undefined : { duration: 0 }}
      className="w-[14px] h-[14px] rounded-full"
    >
      <div
        className="w-full h-full rounded-full"
        style={{ backgroundColor: "var(--accent-primary)" }}
      />
    </motion.div>
  );
}
