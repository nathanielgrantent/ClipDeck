'use client';

import { useEffect, useCallback, useRef } from 'react';

export function useKeyboardNavigation() {
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const getFocusableElements = useCallback(() => {
    return Array.from(document.querySelectorAll(focusableSelector)) as HTMLElement[];
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip navigation with Alt+S
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const main = document.querySelector('main');
        if (main) {
          const focusable = main.querySelectorAll(focusableSelector);
          if (focusable.length > 0) {
            (focusable[0] as HTMLElement).focus();
          }
        }
      }

      // Escape to close modals/menus
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          document.dispatchEvent(new CustomEvent('keydown:escape'));
        }
      }

      // Arrow key navigation in lists/menus
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.getAttribute('role') === 'menuitem' ||
            activeElement?.closest('[role="menu"]') ||
            activeElement?.closest('[role="listbox"]')) {
          e.preventDefault();
          const container = activeElement.closest('[role="menu"], [role="listbox"]');
          if (!container) return;
          const items = Array.from(container.querySelectorAll('[role="menuitem"], option')) as HTMLElement[];
          const currentIndex = items.indexOf(activeElement);
          const nextIndex = e.key === 'ArrowDown'
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
          items[nextIndex]?.focus();
        }
      }

      // Tab trapping in modals
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          const focusable = Array.from(modal.querySelectorAll(focusableSelector)) as HTMLElement[];
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusableSelector]);
}

export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const container = ref.current;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    
    const focusable = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
    if (focusable.length === 0) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    first.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [ref, active]);
}

export function useAriaLivepolite() {
  const ref = useRef<HTMLDivElement>(null);
  
  const announce = useCallback((message: string) => {
    if (ref.current) {
      ref.current.textContent = message;
    }
  }, []);
  
  return { ref, announce };
}
