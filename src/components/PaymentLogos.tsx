// Official bKash and Nagad Logo Components
export const BkashLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#E2136E"/>
    <path d="M256 100C308.5 100 351 142.5 351 195C351 247.5 308.5 290 256 290C203.5 290 161 247.5 161 195C161 142.5 203.5 100 256 100Z" fill="white"/>
    <path d="M256 310C320 310 372 362 372 426V412H140V426C140 362 192 310 256 310Z" fill="white"/>
    <circle cx="256" cy="195" r="50" fill="#E2136E"/>
  </svg>
);

export const NagadLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#F6921E"/>
    <path d="M140 256L256 140L372 256L256 372L140 256Z" fill="white"/>
    <circle cx="256" cy="256" r="60" fill="#F6921E"/>
    <path d="M256 196C289.1 196 316 222.9 316 256C316 289.1 289.1 316 256 316C222.9 316 196 289.1 196 256C196 222.9 222.9 196 256 196Z" fill="white" stroke="#F6921E" strokeWidth="8"/>
  </svg>
);

export const CashOnDeliveryIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="64" fill="#22C55E"/>
    <rect x="100" y="160" width="220" height="140" rx="12" fill="white"/>
    <text x="210" y="245" textAnchor="middle" fontSize="48" fill="#22C55E" fontWeight="bold">৳</text>
    <path d="M340 220L390 270L460 200" stroke="white" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="140" y="330" width="140" height="20" rx="4" fill="white" opacity="0.8"/>
    <rect x="180" y="360" width="60" height="20" rx="4" fill="white" opacity="0.6"/>
  </svg>
);
