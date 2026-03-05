'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Github } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Divider } from '@/components/ui/atoms/Divider';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/models', label: 'Models' },
  { href: '/about', label: 'About' },
  { href: '/roadmap', label: 'Roadmap' },
];

const MODELS_VISITED_KEY = 'models-visited';

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(() => {
    // Check if user has visited models page before during initialization
    if (typeof window !== 'undefined') {
      const hasVisitedModels = localStorage.getItem(MODELS_VISITED_KEY);
      return !hasVisitedModels;
    }
    return false;
  });

  // Handle models link click
  function handleModelsClick() {
    localStorage.setItem(MODELS_VISITED_KEY, 'true');
    setShowPulse(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:px-3 focus:py-1.5 focus:text-sm focus:rounded focus:bg-[var(--color-accent)] focus:text-[var(--color-on-accent)]"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--color-text)] font-semibold text-sm tracking-tight hover:opacity-80 transition-opacity"
          aria-label="Ollama Explorer — home"
        >
          <span>Ollama Explorer</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)]">
            Beta
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const isModels = link.href === '/models';
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isModels ? handleModelsClick : undefined}
                className={cn(
                  'px-3 h-9 flex items-center text-sm rounded-[var(--radius-md)] transition-colors relative',
                  pathname === link.href
                    ? 'text-[var(--color-text)] font-medium bg-[var(--color-bg-muted)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]',
                  // Border color animation for first-time users on Models link
                  showPulse && isModels && 'border-2 border-[var(--color-accent)] animate-pulse',
                )}
                style={
                  showPulse && isModels
                    ? {
                        animationDuration: '2s',
                      }
                    : undefined
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/serkan-uslu/ollama-explorer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            <Github size={18} />
          </a>
          <ThemeToggle />
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <nav className="flex flex-col px-4 py-3 gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => {
              const isModels = link.href === '/models';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setOpen(false);
                    if (isModels) handleModelsClick();
                  }}
                  className={cn(
                    'px-3 h-11 flex items-center text-sm rounded-[var(--radius-md)] transition-colors relative',
                    pathname === link.href
                      ? 'text-[var(--color-text)] font-medium bg-[var(--color-bg-muted)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]',
                    // Border color animation for first-time users on Models link
                    showPulse && isModels && 'border-2 border-[var(--color-accent)] animate-pulse',
                  )}
                  style={
                    showPulse && isModels
                      ? {
                          animationDuration: '2s',
                        }
                      : undefined
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <Divider />
        </div>
      )}
    </header>
  );
}
