import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        <div className="relative group">
          <input
            type={inputType}
            className={cn(
              'flex h-11 w-full rounded-xl border border-white/10 glass-input px-4 py-2 text-sm text-primary ring-offset-base file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus:border-accent-cyan focus:ring-[3px] focus:ring-accent-cyan/15 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              isPassword && 'pr-11',
              error && 'border-error focus:border-error focus:ring-error/10',
              className
            )}
            style={error ? {} : { boxShadow: '0 0 0 0 rgba(99,102,241,0)' }}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-error animate-fade-up">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
