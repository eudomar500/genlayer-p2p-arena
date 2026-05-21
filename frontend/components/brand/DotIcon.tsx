import React from "react";

interface DotIconProps {
  size?: number;
}

export default function DotIcon({ size = 64 }: DotIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="16" fill="var(--accent-primary)" />
      <circle
        cx="50"
        cy="50"
        r="24"
        stroke="var(--border-subtle)"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="50"
        r="32"
        stroke="var(--border-subtle)"
        strokeWidth="1"
      />
    </svg>
  );
}
