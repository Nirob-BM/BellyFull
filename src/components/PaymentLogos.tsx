// Official bKash, Nagad, and COD Logo Components
import bkashLogo from '@/assets/bkash-logo.png';
import nagadLogo from '@/assets/nagad-logo.png';
import codIcon from '@/assets/cod-icon.png';

export const BkashLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <img 
    src={bkashLogo} 
    alt="bKash" 
    className={className}
            loading="lazy"
            decoding="async"/>
);

export const NagadLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <img 
    src={nagadLogo} 
    alt="Nagad" 
    className={className}
            loading="lazy"
            decoding="async"/>
);

export const CashOnDeliveryIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <img 
    src={codIcon} 
    alt="Cash on Delivery" 
    className={className}
            loading="lazy"
            decoding="async"/>
);
