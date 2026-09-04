import React from 'react';
import { getPlatformMeta } from '../utils/platformHelpers';
import { Tv } from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const meta = getPlatformMeta(platform);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      id={`badge-${meta.key}`}
      className={`inline-flex items-center rounded-md border ${meta.bgColor} ${meta.borderColor} ${meta.badgeTextColor} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Tv className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{meta.name}</span>
    </span>
  );
};
