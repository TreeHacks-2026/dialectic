/**
 * Ornate Calligraphic "D" Component
 * Based on the romanized/medieval style D
 */

export default function OrnateD({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top finial (heart/spade shape pointing up) */}
      <path d="M 60 8 L 57 14 L 60 18 L 63 14 Z" />
      
      {/* Main vertical stem (thick left side) */}
      <rect x="18" y="20" width="8" height="100" rx="1" />
      
      {/* Top-left serif (subtle inward curl) */}
      <path
        d="M 18 20 Q 15 20 13 22"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Bottom-left serif (elaborate upward curl) */}
      <path
        d="M 18 120 Q 12 120 8 115 Q 5 110 8 105 Q 10 100 12 102"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Large sweeping curve forming the bowl of D */}
      <path
        d="M 26 20 
           Q 32 18 40 16 
           Q 55 14 70 18 
           Q 85 22 92 32 
           Q 98 42 96 60 
           Q 94 78 88 88 
           Q 82 98 72 104 
           Q 60 110 48 108 
           Q 36 106 28 100"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Bottom connection to stem */}
      <path
        d="M 28 100 L 26 120"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Internal vertical element (resembling "1" - slender vertical stroke) */}
      <path
        d="M 38 30 L 38 95"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Three short horizontal lines (slightly angled upward) */}
      <line x1="42" y1="50" x2="58" y2="53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="62" x2="60" y2="66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="74" x2="62" y2="79" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Bottom finial (teardrop/spike pointing down) */}
      <path d="M 60 132 L 57 128 L 60 124 L 63 128 Z" />
    </svg>
  );
}
