// Official bKash and Nagad Logo Components
import bkashLogo from '@/assets/bkash-logo.png';
import nagadLogo from '@/assets/nagad-logo.png';

export const BkashLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <img 
    src={bkashLogo} 
    alt="bKash" 
    className={className}
  />
);

export const NagadLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <img 
    src={nagadLogo} 
    alt="Nagad" 
    className={className}
  />
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
