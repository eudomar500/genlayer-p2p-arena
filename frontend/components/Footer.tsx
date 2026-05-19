import React from "react";
import Link from "next/link";
import Wordmark from "./brand/Wordmark";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-deep)]">
      <div className="max-w-[1280px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          {/* Col 1 */}
          <div className="flex flex-col items-start">
            <Wordmark size="sm" withSignature />
            <p className="mt-4 text-sm text-[var(--text-secondary)] max-w-xs">
              Trustless P2P marketplace + meta-prediction market. Powered by AI consensus on GenLayer.
            </p>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-3 text-sm">
            <span className="font-medium text-[var(--text-primary)] mb-1">Product</span>
            <Link href="/marketplace" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              Marketplace
            </Link>
            <Link href="/markets" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              Markets
            </Link>
            <Link href="/analytics" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              Analytics
            </Link>
            <Link href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              Dashboard
            </Link>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-3 text-sm">
            <span className="font-medium text-[var(--text-primary)] mb-1">Resources</span>
            <Link href="/docs" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              Docs
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              GitHub
            </a>
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit">
              GenLayer
            </a>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] gap-4">
          <p>&copy; 2026 Islandlabs. MIT Licensed.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
