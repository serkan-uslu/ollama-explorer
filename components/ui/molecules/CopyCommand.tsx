'use client';

import { Check, Copy, Terminal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { trackCopyCommand } from '@/lib/utils/ga';

interface CopyCommandProps {
  command: string;
  className?: string;
  modelName?: string;
}

export function CopyCommand({ command, className, modelName }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track GA4 event
      if (modelName) {
        trackCopyCommand(modelName, command);
      }
    });
  }

  return (
    <div
      className={cn(
        'group flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)] py-1.5 pr-1.5 pl-3',
        className,
      )}
    >
      <Terminal size={14} className="shrink-0 text-[var(--color-text-subtle)]" aria-hidden />
      <code className="min-w-0 flex-1 break-normal font-mono text-xs leading-5 whitespace-normal text-[var(--color-text-muted)] [overflow-wrap:anywhere] sm:truncate sm:whitespace-nowrap">
        {command}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
        aria-label={copied ? 'Copied!' : `Copy command: ${command}`}
      >
        {copied ? (
          <Check size={14} className="text-[var(--color-text-muted)]" />
        ) : (
          <Copy size={14} />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? `${command} copied` : ''}
      </span>
    </div>
  );
}
