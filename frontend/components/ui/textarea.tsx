import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  showCounter?: boolean;
  maxLength?: number;
  minHeight?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCounter, maxLength, value, onChange, minHeight = '160px', ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0);

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (onChange) onChange(e);
    };

    return (
      <div className="w-full space-y-1.5">
        <textarea
          className={cn(
            'flex w-full rounded-2xl border border-white/10 bg-input px-4 py-3 text-sm ring-offset-base placeholder:text-muted/60 focus-visible:outline-none focus:border-accent-indigo focus:ring-[3px] focus:ring-accent-indigo/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none',
            error && 'border-error focus:border-error focus:ring-error/10',
            className
          )}
          style={{ minHeight }}
          ref={ref}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex justify-between items-center px-1">
          {error ? (
            <p className="text-xs font-medium text-error animate-fade-up">{error}</p>
          ) : <div />}
          {showCounter && maxLength && (
            <span className="text-[10px] text-muted font-mono">
              {charCount} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
