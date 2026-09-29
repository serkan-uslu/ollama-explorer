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

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
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
          className="flex min-h-11 min-w-0 items-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--color-text)] transition-opacity hover:opacity-80"
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
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex h-11 items-center rounded-[var(--radius-md)] px-3 text-sm transition-colors relative',
                  pathname === link.href
                    ? 'text-[var(--color-text)] font-medium bg-[var(--color-bg-muted)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]',
                )}
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
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] sm:flex"
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
            aria-controls="mobile-navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-bg)] md:hidden">
          <nav
            id="mobile-navigation"
            className="flex flex-col gap-1 px-4 py-3"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className={cn(
                    'px-3 h-11 flex items-center text-sm rounded-[var(--radius-md)] transition-colors relative',
                    pathname === link.href
                      ? 'text-[var(--color-text)] font-medium bg-[var(--color-bg-muted)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://github.com/serkan-uslu/ollama-explorer"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
            >
              <Github size={17} aria-hidden />
              GitHub
            </a>
          </nav>
          <Divider />
        </div>
      )}
    </header>
  );
}
