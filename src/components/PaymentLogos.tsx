// Official bKash and Nagad Logo Components
export const BkashLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#E2136E"/>
    <g transform="translate(80, 100)">
      {/* bKash "b" icon stylized */}
      <path d="M176 0C238.7 0 290 51.3 290 114C290 155.3 268.3 191.5 236 212.5L236 312H116V212.5C83.7 191.5 62 155.3 62 114C62 51.3 113.3 0 176 0Z" fill="white"/>
      <circle cx="176" cy="120" r="45" fill="#E2136E"/>
      {/* bKash text */}
      <text x="176" y="280" textAnchor="middle" fontSize="60" fill="white" fontFamily="Arial Black, sans-serif" fontWeight="bold">bKash</text>
    </g>
  </svg>
);

export const NagadLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#F6921E"/>
    <g transform="translate(56, 100)">
      {/* Nagad N shape */}
      <path d="M80 0L160 0L160 180L240 0L320 0L320 220L240 220L240 40L160 220L80 220L80 0Z" fill="white"/>
      {/* Nagad text */}
      <text x="200" y="280" textAnchor="middle" fontSize="56" fill="white" fontFamily="Arial Black, sans-serif" fontWeight="bold">নগদ</text>
    </g>
  </svg>
);

export const CashOnDeliveryIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#22C55E"/>
    {/* Money/Cash icon */}
    <rect x="80" y="140" width="260" height="160" rx="16" fill="white"/>
    <rect x="100" y="160" width="220" height="120" rx="8" fill="#22C55E" opacity="0.2"/>
    <circle cx="210" cy="220" r="40" fill="#22C55E"/>
    <text x="210" y="235" textAnchor="middle" fontSize="40" fill="white" fontWeight="bold">৳</text>
    {/* Checkmark */}
    <path d="M340 240L380 280L440 200" stroke="white" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"/>
    {/* COD text */}
    <text x="256" y="380" textAnchor="middle" fontSize="40" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold">COD</text>
  </svg>
);
