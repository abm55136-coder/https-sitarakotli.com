import React from 'react';
import { useShop } from '../context/ShopContext';
import { LogoConfig } from '../types';
import { Sparkles, Crown, Star, Gem, Scissors, Feather } from 'lucide-react';

interface BrandLogoProps {
  variant?: 'header' | 'footer' | 'admin' | 'invoice' | 'modal' | 'large';
  showSubtext?: boolean;
  showUrdu?: boolean;
  customConfig?: LogoConfig;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  showSubtext = true,
  showUrdu = true,
  customConfig,
  className = '',
  onClick,
}) => {
  const { logoConfig: contextConfig, lang, shopProfile } = useShop();
  const config = customConfig || contextConfig;

  // Icon selector
  const renderIcon = (sizeClass: string) => {
    switch (config.icon) {
      case 'crown':
        return <Crown className={sizeClass} />;
      case 'star':
        return <Star className={sizeClass} fill="currentColor" />;
      case 'diamond':
        return <Gem className={sizeClass} />;
      case 'scissors':
        return <Scissors className={sizeClass} />;
      case 'feather':
        return <Feather className={sizeClass} />;
      case 'sparkles':
      default:
        return <Sparkles className={sizeClass} />;
    }
  };

  // Shape class for the emblem container
  const getShapeClasses = () => {
    switch (config.shape) {
      case 'crest':
        return 'rounded-b-2xl rounded-t-sm';
      case 'shield':
        return 'rounded-t-lg rounded-b-3xl';
      case 'diamond':
        return 'rotate-45 rounded-md';
      case 'minimal':
        return 'rounded-lg';
      case 'round':
      default:
        return 'rounded-full';
    }
  };

  // Dimension classes based on variant & config sizeScale
  const getDimensions = () => {
    if (variant === 'large') {
      return {
        box: 'w-20 h-20 sm:w-24 sm:h-24',
        icon: 'w-10 h-10',
        title: 'text-2xl sm:text-3xl',
        subtitle: 'text-xs sm:text-sm',
      };
    }
    if (variant === 'footer') {
      return {
        box: 'w-12 h-12',
        icon: 'w-6 h-6',
        title: 'text-xl',
        subtitle: 'text-xs',
      };
    }
    if (variant === 'admin') {
      return {
        box: 'w-10 h-10',
        icon: 'w-5 h-5',
        title: 'text-base font-bold',
        subtitle: 'text-[10px]',
      };
    }
    if (variant === 'invoice') {
      return {
        box: 'w-14 h-14',
        icon: 'w-7 h-7',
        title: 'text-xl font-bold',
        subtitle: 'text-xs',
      };
    }
    // Default: 'header'
    if (config.sizeScale === 'compact') {
      return {
        box: 'w-10 h-10',
        icon: 'w-4 h-4',
        title: 'text-base sm:text-lg',
        subtitle: 'text-[9px] sm:text-[10px]',
      };
    }
    if (config.sizeScale === 'prominent') {
      return {
        box: 'w-13 h-13 sm:w-16 sm:h-16',
        icon: 'w-7 h-7',
        title: 'text-xl sm:text-2xl',
        subtitle: 'text-[11px] sm:text-xs',
      };
    }
    // Standard header
    return {
      box: 'w-9 h-9 sm:w-13 sm:h-13',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
      title: 'text-sm sm:text-2xl',
      subtitle: 'text-[9px] sm:text-xs',
    };
  };

  const dims = getDimensions();
  const shapeClasses = getShapeClasses();
  const accent = config.accentColor || '#d4af37';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-3.5 min-w-0 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 1. Logo Emblem or Custom Uploaded Image */}
      <div
        className={`relative ${dims.box} shrink-0 p-[2px] shadow-lg flex items-center justify-center transition-transform hover:scale-105 duration-200 ${shapeClasses}`}
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, rgba(255,255,255,0.4) 50%, #8b6508 100%)`,
          boxShadow: `0 4px 15px -3px ${accent}40`,
        }}
      >
        <div
          className={`w-full h-full bg-stone-950 flex flex-col items-center justify-center border overflow-hidden ${shapeClasses}`}
          style={{ borderColor: `${accent}60` }}
        >
          {config.type === 'custom_image' && config.imageUrl ? (
            <img
              src={config.imageUrl}
              alt={config.primaryText}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover ${config.shape === 'diamond' ? '-rotate-45 scale-125' : ''}`}
            />
          ) : (
            <div
              className={`flex flex-col items-center justify-center text-amber-400 ${
                config.shape === 'diamond' ? '-rotate-45' : ''
              }`}
              style={{ color: accent }}
            >
              {renderIcon(dims.icon)}
              {config.badgeText && variant !== 'header' && (
                <span className="text-[7px] font-bold tracking-widest uppercase mt-0.5 opacity-80">
                  {config.badgeText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Brand Typography Block */}
      <div className="flex flex-col justify-center min-w-0">
        <div
          className={
            variant === 'header'
              ? 'flex items-baseline gap-1 sm:gap-1.5 whitespace-nowrap overflow-hidden'
              : 'flex items-center gap-1 sm:gap-1.5 flex-wrap'
          }
        >
          <span
            className={`font-serif-luxury font-bold tracking-wider gold-gradient-text uppercase whitespace-nowrap ${dims.title}`}
          >
            {config.primaryText || 'SITARA'}
          </span>
          <span className="text-[9px] sm:text-sm font-semibold tracking-wider sm:tracking-widest text-stone-200 uppercase whitespace-nowrap truncate">
            {config.secondaryText || 'CLOTH HOUSE'}
          </span>
        </div>

        {/* Subtext & Urdu Name */}
        {showSubtext && (
          <div
            className={`${
              variant === 'header' ? 'hidden sm:flex' : 'flex'
            } items-center gap-1 sm:gap-1.5 mt-0.5 text-stone-400 flex-wrap`}
          >
            {showUrdu && config.showUrdu && (
              <span
                className="font-urdu text-[10px] sm:text-xs font-semibold whitespace-nowrap"
                style={{ color: accent }}
                dir="rtl"
              >
                {config.urduText || 'ستارہ کلاٹھ ہاؤس'}
              </span>
            )}
            {showUrdu && config.showUrdu && <span className="hidden sm:inline text-stone-600 text-[10px]">•</span>}
            <span className={`hidden sm:inline tracking-widest font-medium text-stone-400 uppercase ${dims.subtitle}`}>
              {config.subtext || 'KOTLI • AZAD KASHMIR'}
            </span>
            <span className="text-stone-600 text-[10px] hidden sm:inline">•</span>
            <span
              className="hidden sm:inline font-semibold text-[10px] sm:text-[11px]"
              style={{ color: accent }}
            >
              {lang === 'ur'
                ? `مالک: ${shopProfile.ownerNameUrdu || 'اویس ملک'}`
                : `Prop. ${shopProfile.ownerName || 'Awais Malik'}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
