"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ProfileContent from "@/components/profile/ProfileContent";

export default function ProfileDrawerIntercept() {
  const router = useRouter();
  const params = useParams();
  const address = params.address as string;

  useEffect(() => {
    // Disable body scroll when drawer is open
    document.body.style.overflow = "hidden";
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={handleClose}
          className="absolute inset-0 bg-[var(--bg-deep)]/70 backdrop-blur-xl pointer-events-auto"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full md:w-[480px] h-[calc(100vh-64px)] mt-16 bg-[var(--bg-deep)] border-l border-[var(--border-subtle)] shadow-2xl pointer-events-auto flex flex-col"
        >
          {/* Header/Close */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pt-8 pb-12">
            <ProfileContent address={address} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
