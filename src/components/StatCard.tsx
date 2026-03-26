import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'accent' | 'info' | 'destructive';
}

const variantStyles = {
  default: '',
  primary: 'border-primary/20 hover:border-primary/40',
  accent: 'border-accent/30 hover:border-accent/50',
  info: 'border-info/20 hover:border-info/40',
  destructive: 'border-destructive/20 hover:border-destructive/40',
};

export default function StatCard({ label, value, icon, onClick, variant = 'default' }: StatCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'stat-card text-left w-full',
        onClick && 'cursor-pointer',
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </Comp>
  );
}
