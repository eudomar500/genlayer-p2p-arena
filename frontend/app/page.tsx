"use client";

import React, { useEffect, useRef } from "react";
import { motion, useAnimation, useInView, type Variants } from "framer-motion";
import Link from "next/link";
import { Package, Wallet, Truck, CheckCircle, Scale, ArrowRight, SunMoon, HandCoins, UserCheck, CheckSquare, Zap, Shield, HelpCircle, Activity } from "lucide-react";
import Wordmark from "../components/brand/Wordmark";
import ScrollDot from "../components/brand/ScrollDot";
import DotIcon from "../components/brand/DotIcon";
import { useScrollDot } from "../components/brand/ScrollDotContext";

// Utility for animating numbers
function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true });
  const controls = useAnimation();
  const [displayValue, setDisplayValue] = React.useState("0");

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const duration = 1200; // 1.2s

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = ease * value;

        if (nodeRef.current) {
          setDisplayValue(current.toFixed(decimals));
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value.toFixed(decimals));
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, value, decimals]);

  return <span ref={nodeRef}>{displayValue}</span>;
}

export default function Page() {
  const { registerAnchor } = useScrollDot();
  
  // Section refs
  const heroRef = useRef<HTMLDivElement>(null);
  const convergenceRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const whyGenlayerRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerAnchor("hero", heroRef);
    registerAnchor("convergence", convergenceRef);
    registerAnchor("how-it-works", howItWorksRef);
    registerAnchor("stats", statsRef);
    registerAnchor("why-genlayer", whyGenlayerRef);
    registerAnchor("activity", activityRef);
  }, [registerAnchor]);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <>
      <ScrollDot />
      
      {/* 1. Hero */}
      <section 
        id="hero" 
        className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div 
            className="w-[1200px] h-[1200px] rounded-full"
            style={{
              background: "radial-gradient(circle, var(--accent-dim) 0%, transparent 60%)",
              opacity: 0.08
            }}
          />
        </div>

        <motion.div 
          className="z-10 flex flex-col items-center text-center px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="relative inline-block">
            <Wordmark size="xl" isHero={true} dotRef={heroRef} />
          </div>
          
          <p className="mt-8 text-[var(--text-secondary)] max-w-lg text-lg">
            Trustless P2P marketplace + meta-prediction market. Powered by AI consensus on GenLayer.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link 
              href="/marketplace" 
              className="bg-[var(--accent-primary)] hover:brightness-110 text-[var(--bg-deep)] px-6 py-3 rounded-md font-medium transition-all hover:-translate-y-0.5"
            >
              Browse marketplace
            </Link>
            <Link 
              href="/docs" 
              className="border border-[var(--border-strong)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] hover:brightness-110 px-6 py-3 rounded-md font-medium transition-all hover:-translate-y-0.5"
            >
              Read docs
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 2. The point */}
      <section id="convergence" className="py-32 px-6">
        <motion.div 
          className="max-w-[1024px] mx-auto flex flex-col items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div className="relative text-center">
            <div ref={convergenceRef} className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 opacity-0" />
            <h2 className="text-5xl font-medium tracking-tight">The point where everyone meets.</h2>
            <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-[640px] mx-auto">
              PointMarket is a single point of convergence for three actors who normally operate on separate platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20">
            {/* Sellers */}
            <div className="flex flex-col items-start text-left">
              <div className="w-4 h-4 rounded-full bg-[var(--accent-primary)] mb-6" />
              <h3 className="text-xl font-semibold mb-3">Sellers</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                List physical goods with escrow protection. AI consensus arbitrates disputes, no human moderator required.
              </p>
            </div>
            
            {/* Buyers */}
            <div className="flex flex-col items-start text-left">
              <div className="w-4 h-4 rounded-full bg-[var(--accent-primary)] mb-6" />
              <h3 className="text-xl font-semibold mb-3">Buyers</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Pay with locked funds released only on confirmed delivery. Disputes resolved by validator quorum.
              </p>
            </div>

            {/* Predictors */}
            <div className="flex flex-col items-start text-left">
              <div className="w-4 h-4 rounded-full bg-[var(--accent-primary)] mb-6" />
              <h3 className="text-xl font-semibold mb-3">Predictors</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Bet on marketplace activity. Objective markets read on-chain state; subjective markets resolve via LLM consensus.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. How it works */}
      <section id="how-it-works" className="py-32 px-6 bg-[var(--bg-elevated)]">
        <motion.div 
          className="max-w-[1024px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div className="text-center mb-20">
            <h2 className="text-4xl font-medium tracking-tight">How it works.</h2>
            <p className="mt-4 text-[var(--text-secondary)]">Two flows. One substrate.</p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="absolute right-[10%] top-12 bottom-12 w-px border-l-2 border-dashed border-[var(--accent-primary)] opacity-50" />

            {/* Marketplace flow */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-16 relative z-10">
              <FlowStep icon={<Package size={20} />} label="List" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<Wallet size={20} />} label="Buy" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<Truck size={20} />} label="Ship" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<CheckCircle size={20} />} label="Deliver" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <div className="relative">
                <div ref={howItWorksRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-0" />
                <FlowStep icon={<Scale size={20} />} label="Resolve" active />
              </div>
            </div>

            {/* Prediction flow */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative z-10">
              <FlowStep icon={<Activity size={20} />} label="Create market" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<HandCoins size={20} />} label="Bet" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<Shield size={20} />} label="Close" />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<CheckSquare size={20} />} label="Settle" active />
              <ArrowRight className="text-[var(--border-strong)] hidden lg:block" size={20} />
              <FlowStep icon={<Wallet size={20} />} label="Claim" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. Live stats */}
      <section id="stats" className="py-24 px-6">
        <motion.div 
          className="max-w-[1024px] mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div className="mb-12 relative">
            <div ref={statsRef} className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 -translate-x-8 opacity-0 hidden md:block" />
            <h2 className="text-3xl font-medium tracking-tight">Live on Studionet.</h2>
            <p className="mt-2 text-xs font-mono text-[var(--text-secondary)]">
              0x29f58...c6e67 + 0x2b0B5f...cb48E
            </p>
          </div>

          {/* TODO: connect to get_metrics in phase 3 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Total trades">
              <Counter value={1} />
            </StatCard>
            <StatCard label="Total volume" suffix=" GEN">
              <Counter value={1.00} decimals={2} />
            </StatCard>
            <StatCard label="Prediction markets">
              <Counter value={2} />
            </StatCard>
            <StatCard label="Fees forwarded" suffix=" GEN">
              <Counter value={0.03} decimals={2} />
            </StatCard>
          </div>
        </motion.div>
      </section>

      {/* 5. Why GenLayer */}
      <section id="why-genlayer" className="py-32 px-6">
        <motion.div 
          className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          {/* Left */}
          <div>
            <h2 className="text-4xl font-medium tracking-tight">Why GenLayer.</h2>
            <p className="mt-6 text-[var(--text-secondary)] text-base leading-relaxed max-w-[480px]">
              Trustless dispute resolution requires natural-language judgment. Solidity cannot make those calls without a centralized oracle or arbiter. GenLayer's Optimistic Democracy uses LLM-running validators as the consensus layer. The validators are the arbiters. No human moderation. No off-chain oracle. No single point of trust.
            </p>
            <a 
              href="https://genlayer.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] transition-colors font-medium"
            >
              Read the protocol docs <ArrowRight size={16} />
            </a>
          </div>

          {/* Right */}
          <div className="relative flex flex-col items-center justify-center p-8 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
            <div ref={whyGenlayerRef} className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 opacity-0" />
            
            {/* Top */}
            <div className="w-48 py-4 border border-[var(--border-strong)] rounded-lg text-center font-medium bg-[var(--bg-deep)]">
              Smart contract
            </div>
            
            <div className="h-6 w-px bg-[var(--border-strong)]" />
            
            {/* Middle */}
            <div className="w-64 py-4 border border-[var(--border-strong)] rounded-lg text-center font-medium bg-[var(--bg-deep)] flex flex-col items-center justify-center gap-2">
              <span>GenVM validators (5)</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[var(--text-secondary)]" />
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-[var(--border-strong)]" />
            
            {/* Bottom */}
            <div className="w-56 py-4 border border-[var(--border-strong)] rounded-lg text-center font-medium bg-[var(--bg-deep)] flex flex-col items-center justify-center gap-2">
              <span>LLM consensus</span>
              <div className="flex gap-3">
                <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)] opacity-80" />
                <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)] opacity-60" />
                <div className="w-3 h-3 rounded-sm bg-[var(--accent-primary)] opacity-40" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 6. Recent activity */}
      <section id="activity" className="py-24 px-6 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
        <motion.div 
          className="max-w-[1024px] mx-auto relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
        >
          <div ref={activityRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-0" />
          
          <div className="mb-12">
            <h2 className="text-3xl font-medium tracking-tight">Recent activity.</h2>
            <p className="mt-2 text-[var(--text-secondary)]">Direct from Studionet.</p>
          </div>

          <div className="w-full overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-deep)]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--text-tertiary)] uppercase bg-[var(--bg-elevated-2)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {/* TODO: replace with live data in phase 3 */}
                <ActivityRow type="Trade" id="#0" status="COMPLETED" time="6h ago" />
                <ActivityRow type="Market" id="#1" status="RESOLVED YES" time="6h ago" />
                <ActivityRow type="Market" id="#0" status="RESOLVED YES" time="6h ago" />
                <ActivityRow type="Trade" id="#0" status="DELIVERED" time="7h ago" />
                <ActivityRow type="Trade" id="#0" status="LISTED" time="8h ago" />
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <Link 
              href="/marketplace" 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 text-sm font-medium"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}

// Subcomponents

function FlowStep({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 w-32 rounded-xl border ${active ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-[var(--border-subtle)] bg-[var(--bg-deep)]'}`}>
      <div className={`mb-3 ${active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function StatCard({ label, children, suffix = "" }: { label: string; children: React.ReactNode; suffix?: string }) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-6 flex flex-col justify-between">
      <div className="text-xs font-mono text-opacity-50 text-[var(--text-tertiary)] uppercase tracking-wide mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)] animate-pulse" />
        Loading...
      </div>
      <div className="text-3xl font-semibold mt-2">
        {children}
        <span className="text-lg text-[var(--text-secondary)]">{suffix}</span>
      </div>
      <div className="mt-2 text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

function ActivityRow({ type, id, status, time }: { type: string; id: string; status: string; time: string }) {
  const isSuccess = status === "COMPLETED" || status.startsWith("RESOLVED");
  const badgeColors = isSuccess 
    ? "bg-[var(--success)]/15 text-[var(--success)]"
    : "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]";

  return (
    <tr className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)]">
          {type}
        </span>
      </td>
      <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{id}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColors}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-[var(--text-tertiary)]">{time}</td>
    </tr>
  );
}
