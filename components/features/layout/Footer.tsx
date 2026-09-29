import Link from 'next/link';
import { Github, AlertCircle, ExternalLink } from 'lucide-react';
import { Divider } from '@/components/ui/atoms/Divider';

export function Footer() {
  return (
    <footer className="w-full mt-auto">
      <Divider />

      {/* Disclaimer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-3 sm:py-2.5 border-b border-[var(--color-border)]">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-[var(--color-text-subtle)] mt-0.5 flex-shrink-0" />
          <p className="text-[11px] sm:text-[11px] text-[var(--color-text-subtle)] leading-relaxed">
            Catalog and tag fields are parsed from Ollama; unknown values stay unknown and missing
            licenses are unverified. Memory is a rough download-size estimate and varies with
            context, runtime, GPU offload and your OS. Verify requirements and licensing in the{' '}
            <Link
              href="https://ollama.com/library"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--color-text-muted)] transition-colors inline-flex items-center gap-0.5"
            >
              official Ollama library
              <ExternalLink size={10} className="inline-block" aria-hidden />
            </Link>
            . This site is not affiliated with Ollama.
          </p>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-4 sm:py-0">
        {/* Mobile layout */}
        <div className="sm:hidden flex flex-col gap-4">
          {/* Top row - Copyright + Data source */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--color-text-subtle)]">
              © {new Date().getFullYear()} Ollama Explorer
            </p>
            <p className="text-xs text-[var(--color-text-subtle)]">
              Data from{' '}
              <Link
                href="https://ollama.com/library"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[var(--color-text-muted)] transition-colors"
              >
                ollama.com
              </Link>
            </p>
          </div>

          {/* Bottom row - Links */}
          <div className="flex items-center justify-between">
            <Link
              href="/privacy"
              className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
            >
              Privacy
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="https://github.com/serkan-uslu/ollama-explorer/issues/new?assignees=&labels=bug&template=bug_report.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
              >
                Report issue
              </Link>
              <Link
                href="https://github.com/serkan-uslu/ollama-explorer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
                aria-label="View source on GitHub"
              >
                <Github size={14} aria-hidden />
                GitHub
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-4">
            <p className="text-xs text-[var(--color-text-subtle)]">
              © {new Date().getFullYear()} Ollama Explorer
            </p>
            <span className="text-[var(--color-text-subtle)]" aria-hidden>
              ·
            </span>
            <p className="text-xs text-[var(--color-text-subtle)]">
              Data from{' '}
              <Link
                href="https://ollama.com/library"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[var(--color-text-muted)] transition-colors"
              >
                ollama.com
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="https://github.com/serkan-uslu/ollama-explorer/issues/new?assignees=&labels=bug&template=bug_report.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
            >
              Report an issue
            </Link>
            <Link
              href="https://github.com/serkan-uslu/ollama-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
              aria-label="View source on GitHub"
            >
              <Github size={14} aria-hidden />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
