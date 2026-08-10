'use client';

import { useAccessibility } from '@/components/accessibility/accessibility-provider';
import { AppShell } from '@/components/layout/app-shell';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id: string;
}

function Toggle({ checked, onChange, label, description, id }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-text-primary cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-content',
          checked ? 'bg-accent' : 'bg-sidebar-hover'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
  id: string;
}

function Select({ value, onChange, label, options, id }: SelectProps) {
  return (
    <div className="py-3">
      <label htmlFor={id} className="text-sm font-medium text-text-primary block mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function AccessibilityPage() {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">Accessibility Settings</h1>
          <p className="text-sm text-text-muted mt-1">
            Customize how ClipDeck looks and behaves for your comfort.
          </p>
        </div>

        <div className="space-y-6">
          {/* Visual */}
          <section className="card p-5" aria-labelledby="visual-heading">
            <h2 id="visual-heading" className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Visual
            </h2>
            <div className="divide-y divide-black/10">
              <Toggle
                id="high-contrast"
                checked={settings.highContrast}
                onChange={(v) => updateSetting('highContrast', v)}
                label="High Contrast"
                description="Increase contrast between text and backgrounds for better readability"
              />
              <Toggle
                id="large-text"
                checked={settings.largeText}
                onChange={(v) => updateSetting('largeText', v)}
                label="Large Text"
                description="Increase base font size across the application"
              />
              <Select
                id="font-size"
                value={settings.fontSize}
                onChange={(v) => updateSetting('fontSize', v as 'small' | 'medium' | 'large' | 'xlarge')}
                label="Font Size"
                options={[
                  { value: 'small', label: 'Small (14px)' },
                  { value: 'medium', label: 'Medium (16px) - Default' },
                  { value: 'large', label: 'Large (18px)' },
                  { value: 'xlarge', label: 'Extra Large (20px)' },
                ]}
              />
              <Select
                id="contrast-theme"
                value={settings.contrastTheme}
                onChange={(v) => updateSetting('contrastTheme', v as 'default' | 'high' | 'maximum')}
                label="Contrast Theme"
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'high', label: 'High Contrast' },
                  { value: 'maximum', label: 'Maximum Contrast' },
                ]}
              />
              <Toggle
                id="focus-indicators"
                checked={settings.focusIndicators}
                onChange={(v) => updateSetting('focusIndicators', v)}
                label="Enhanced Focus Indicators"
                description="Show visible focus rings when navigating with keyboard"
              />
            </div>
          </section>

          {/* Motion & Animation */}
          <section className="card p-5" aria-labelledby="motion-heading">
            <h2 id="motion-heading" className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Motion &amp; Animation
            </h2>
            <div className="divide-y divide-black/10">
              <Toggle
                id="reduced-motion"
                checked={settings.reducedMotion}
                onChange={(v) => updateSetting('reducedMotion', v)}
                label="Reduce Motion"
                description="Minimize animations and transitions throughout the interface"
              />
              <Toggle
                id="show-animations"
                checked={settings.showAnimations}
                onChange={(v) => updateSetting('showAnimations', v)}
                label="Show Animations"
                description="Enable or disable decorative animations"
              />
              <Toggle
                id="auto-play"
                checked={settings.autoPlay}
                onChange={(v) => updateSetting('autoPlay', v)}
                label="Auto-play Videos"
                description="Automatically play videos when they appear on screen"
              />
            </div>
          </section>

          {/* Navigation */}
          <section className="card p-5" aria-labelledby="navigation-heading">
            <h2 id="navigation-heading" className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Navigation
            </h2>
            <div className="divide-y divide-black/10">
              <Toggle
                id="keyboard-navigation"
                checked={settings.keyboardNavigation}
                onChange={(v) => updateSetting('keyboardNavigation', v)}
                label="Keyboard Navigation"
                description="Navigate the entire app using only your keyboard"
              />
              <Toggle
                id="screen-reader-mode"
                checked={settings.screenReaderMode}
                onChange={(v) => updateSetting('screenReaderMode', v)}
                label="Screen Reader Mode"
                description="Optimize the interface for screen reader compatibility"
              />
            </div>
          </section>

          {/* Keyboard Shortcuts Reference */}
          <section className="card p-5" aria-labelledby="shortcuts-heading">
            <h2 id="shortcuts-heading" className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
              </svg>
              Keyboard Shortcuts
            </h2>
            <div className="grid gap-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-black/5">
                <span className="text-text-secondary">Skip to main content</span>
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-hover text-text-muted font-mono">Alt + S</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/5">
                <span className="text-text-secondary">Close modal / menu</span>
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-hover text-text-muted font-mono">Escape</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/5">
                <span className="text-text-secondary">Navigate list items</span>
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-hover text-text-muted font-mono">Arrow Keys</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/5">
                <span className="text-text-secondary">Activate button/link</span>
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-hover text-text-muted font-mono">Enter</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-secondary">Navigate between elements</span>
                <kbd className="px-1.5 py-0.5 rounded bg-sidebar-hover text-text-muted font-mono">Tab</kbd>
              </div>
            </div>
          </section>

          {/* Reset */}
          <div className="flex justify-between items-center">
            <button
              onClick={resetSettings}
              className="text-sm text-text-muted hover:text-red-400 transition-colors"
            >
              Reset to defaults
            </button>
            <p className="text-xs text-text-muted">
              Settings are saved locally on this device
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
