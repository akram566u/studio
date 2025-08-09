import * as React from 'react';
import { cn } from '@/lib/utils';

interface LevelBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  level: number;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className, ...props }) => {
  const levelColorClasses: { [key: number]: string } = {
    0: 'bg-gray-500',
    1: 'bg-blue-500',
    2: 'bg-green-600',
    3: 'bg-yellow-600',
    4: 'bg-orange-500',
    5: 'bg-red-600',
  };

  const badgeClass = levelColorClasses[level] || 'bg-purple-600'; // Default for levels > 5

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center size-10 rounded-full font-bold text-white',
        badgeClass,
        className
      )}
      {...props}
    >
      {level}
    </div>
  );
};

export { LevelBadge };
