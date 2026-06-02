'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import type { Toast } from '@/types';

export function ToasterContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.slice(0, 3).map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isHovered, setIsHovered] = React.useState(false);
  
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isHovered) {
      timer = setTimeout(() => {
        onRemove(toast.id);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isHovered, onRemove, toast.id]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-accent-indigo" />,
  };

  const borderColors = {
    success: 'border-l-success',
    error: 'border-l-error',
    warning: 'border-l-warning',
    info: 'border-l-accent-indigo',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-xl border border-white/5 border-l-[3px] bg-card p-4 shadow-card-hover backdrop-blur-md',
        borderColors[toast.type as keyof typeof borderColors]
      )}
    >
      <div className="flex-shrink-0">{icons[toast.type as keyof typeof icons]}</div>
      <div className="flex-1 space-y-1">
        <h3 className="text-sm font-semibold text-primary">{toast.title}</h3>
        {toast.description && <p className="text-xs text-secondary leading-relaxed">{toast.description}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-md p-1 text-muted hover:bg-white/5 hover:text-primary transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
