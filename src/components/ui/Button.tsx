import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'scale(0.96)';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      if (navigator.vibrate) navigator.vibrate(5);
    }
    onClick?.(e);
  };

  const variants = {
    primary: 'bg-white text-black hover:bg-white/90 border border-transparent',
    secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={cn(loading && 'invisible')}>{children}</span>
    </button>
  );
}
