import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError = false, className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        'w-full h-11 px-3 text-sm rounded-[var(--radius-md)]',
        'bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]',
        'border transition-colors',
        hasError
          ? 'border-red-500 focus:border-red-500'
          : 'border-[var(--color-border)] focus:border-[var(--color-border-strong)]',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)] focus-visible:ring-offset-1',
        className,
      )}
      {...rest}
    />
  );
}
