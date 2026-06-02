import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden group',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-accent-indigo via-accent-indigo to-accent-violet text-white hover:shadow-glow-indigo hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:translate-x-[-100%] before:transition-transform hover:before:translate-x-[100%]',
        secondary: 'border border-white/15 bg-transparent text-secondary hover:bg-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]',
        danger: 'bg-gradient-to-r from-error to-rose-600 text-white hover:shadow-glow-error hover:scale-[1.02] active:scale-[0.98]',
        ghost: 'hover:bg-white/10 text-secondary hover:text-primary hover:scale-[1.02] active:scale-[0.98]',
        default: 'bg-section text-primary hover:bg-float hover:scale-[1.02] active:scale-[0.98] border border-white/10',
        link: 'text-accent-indigo underline-offset-4 hover:underline',
        success: 'bg-gradient-to-r from-success to-emerald-600 text-white hover:shadow-glow-success hover:scale-[1.02] active:scale-[0.98]',
        warning: 'bg-gradient-to-r from-warning to-amber-600 text-white hover:shadow-glow-warning hover:scale-[1.02] active:scale-[0.98]',
      },
      size: {
        sm: 'h-9 rounded-lg px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-lg',
        default: 'h-10 px-4 py-2',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    isLoading, 
    children, 
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        <span className={cn(
          'flex items-center justify-center gap-2 transition-all',
          isLoading && 'opacity-0'
        )}>
          {leftIcon && <span className="transition-transform group-hover:scale-110">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="transition-transform group-hover:translate-x-0.5">{rightIcon}</span>}
        </span>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };