import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn('glass-panel rounded-xl shadow-2xl', className)}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
GlassPanel.displayName = 'GlassPanel';

export { GlassPanel };
