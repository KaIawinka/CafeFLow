import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    fullWidth = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
    
    const variants = {
      primary: 'bg-[var(--primary)] hover:bg-orange-600 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md focus:ring-[var(--ring)]',
      secondary: 'bg-[var(--secondary)] hover:bg-[#d3e4d8] dark:hover:bg-[#355242] text-[var(--secondary-foreground)] focus:ring-[var(--ring)]',
      outline: 'border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--ring)]',
      ghost: 'hover:bg-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--ring)]',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md focus:ring-red-500',
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[38px] gap-1.5',
      md: 'px-4 py-3 text-base min-h-[44px] gap-2',
      lg: 'px-6 py-4 text-lg min-h-[52px] gap-2.5',
    };
    
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
