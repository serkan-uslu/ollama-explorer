import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)] border border-[var(--color-accent)]',
  ghost:
    'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)] border border-transparent',
  outline:
    'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-11 px-3 text-xs gap-1.5',
  md: 'min-h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function buttonClassName(
  variant: Variant = 'primary',
  size: Size = 'md',
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={buttonClassName(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
