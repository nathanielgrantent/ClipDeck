import { cn } from '@/lib/utils';

type BadgeProps = {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Badge({ variant = 'default', size = 'md', dot, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-[11px]',
        size === 'md' && 'px-2.5 py-0.5 text-xs',
        variant === 'default' && 'bg-sidebar-hover text-text-secondary',
        variant === 'success' && 'bg-green-500/15 text-green-400',
        variant === 'warning' && 'bg-amber-500/15 text-amber-400',
        variant === 'danger' && 'bg-red-500/15 text-red-400',
        variant === 'info' && 'bg-accent/15 text-accent',
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'default' && 'bg-text-muted',
            variant === 'success' && 'bg-green-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'info' && 'bg-accent',
          )}
        />
      )}
      {children}
    </span>
  );
}
