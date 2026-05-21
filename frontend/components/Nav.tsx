"use client";

import React from "react";
import Link from "next/link";
import Wordmark from "./brand/Wordmark";
import ThemeToggle from "./ThemeToggle";
import { useScrollDot } from "./brand/ScrollDotContext";

export default function Nav() {
  const { scrollToSection, activeSection } = useScrollDot();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    scrollToSection(section);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-deep)]/70 backdrop-blur-xl border-b border-[var(--border-subtle)] z-40">
      <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex-shrink-0 flex items-center h-full pt-1">
          <Link href="/" onClick={(e) => handleAnchorClick(e, "hero")}>
            <Wordmark size="md" />
          </Link>
        </div>

        {/* Right: Links & Actions */}
        <div className="flex items-center gap-6 h-full text-[14px] font-medium">
          {/* Group 1: Anchors */}
          <div className="hidden md:flex items-center gap-6 text-[var(--text-secondary)]">
            <a
              href="#how-it-works"
              onClick={(e) => handleAnchorClick(e, "how-it-works")}
              className={`hover:text-[var(--text-primary)] transition-colors ${
                activeSection === "how-it-works" ? "text-[var(--text-primary)]" : ""
              }`}
            >
              How it works
            </a>
            <a
              href="#why-genlayer"
              onClick={(e) => handleAnchorClick(e, "why-genlayer")}
              className={`hover:text-[var(--text-primary)] transition-colors ${
                activeSection === "why-genlayer" ? "text-[var(--text-primary)]" : ""
              }`}
            >
              Why GenLayer
            </a>
          </div>

          <div className="hidden md:block w-px h-4 bg-[var(--border-subtle)] mx-2" />

          {/* Group 2: Pages */}
          <div className="hidden lg:flex items-center gap-6 text-[var(--text-secondary)]">
            <Link href="/marketplace" className="hover:text-[var(--text-primary)] transition-colors">
              Marketplace
            </Link>
            <Link href="/markets" className="hover:text-[var(--text-primary)] transition-colors">
              Markets
            </Link>
            <Link href="/analytics" className="hover:text-[var(--text-primary)] transition-colors">
              Analytics
            </Link>
            <Link href="/docs" className="hover:text-[var(--text-primary)] transition-colors">
              Docs
            </Link>
          </div>

          {/* Group 3: Actions */}
          <div className="flex items-center gap-4">
            <div className="relative group flex items-center">
              <button
                type="button"
                disabled
                className="bg-[var(--accent-primary)] text-[var(--bg-deep)] px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50 transition-opacity"
              >
                Connect Wallet
              </button>
              {/* Tooltip */}
              <div className="absolute top-full right-0 mt-2 whitespace-nowrap bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Phase 2 -- coming soon
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
