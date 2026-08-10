'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function Modal({
  open,
  onClose,
  children,
  className,
  width = 560,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  width?: number;
  title?: string;
}) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    
    previousFocus.current = document.activeElement as HTMLElement;
    
    const focusable = contentRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab' && contentRef.current) {
        const focusableElements = Array.from(
          contentRef.current.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Dialog'}
    >
      <div
        ref={contentRef}
        className={cn('card w-full overflow-hidden animate-slide-up', className)}
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-black/20 px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary" id="modal-title">{title}</h2>
        {subtitle && <p className="text-xs text-text-muted" id="modal-subtitle">{subtitle}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent rounded"
          aria-label="Close dialog"
          aria-describedby="modal-title"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
