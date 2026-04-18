import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white border-transparent',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    outline: 'bg-transparent text-white border-white/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]',
    md: 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest',
    lg: 'px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
