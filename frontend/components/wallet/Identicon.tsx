import React from "react";
import Avatar from "boring-avatars";

interface IdenticonProps {
  address: string;
  size?: number;
}

const identiconColors = [
  "#FF6B1A",  // accent-primary
  "#E85D04",  // accent-dim
  "#1C1C1C",  // bg-elevated-2 (Not #0A0A0A to avoid blending with nav background)
  "#A3A3A3",  // text-secondary
  "#F5F5F0",  // text-primary
];

export default function Identicon({ address, size = 32 }: IdenticonProps) {
  return (
    <Avatar
      size={size}
      name={address}
      variant="beam" // Beam provides nice clean gradient circles
      colors={identiconColors}
    />
  );
}
