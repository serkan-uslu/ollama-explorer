'use client';

import { useEffect } from 'react';
import { Bug, ExternalLink } from 'lucide-react';
import { trackExternalLinkClick, trackModelView } from '@/lib/utils/ga';

interface ModelDetailActionsProps {
  modelName: string;
  modelSlug: string;
  availability: string;
  sourceUrl: string;
}

function safeOllamaUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'ollama.com' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function ModelDetailActions({
  modelName,
  modelSlug,
  availability,
  sourceUrl,
}: ModelDetailActionsProps) {
  const ollamaUrl = safeOllamaUrl(sourceUrl);
  const reportUrl = `https://github.com/serkan-uslu/ollama-explorer/issues/new?template=wrong_data.yml&title=${encodeURIComponent(`[Data] ${modelSlug}`)}`;

  useEffect(() => {
    trackModelView(modelName, modelSlug, availability);
  }, [availability, modelName, modelSlug]);

  return (
    <div className="flex flex-col gap-3">
      {ollamaUrl && (
        <a
          href={ollamaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackExternalLinkClick(ollamaUrl, 'ollama')}
          className="inline-flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
        >
          <ExternalLink size={16} aria-hidden />
          View source on Ollama
        </a>
      )}
      <a
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
      >
        <Bug size={16} aria-hidden />
        Report incorrect data
      </a>
    </div>
  );
}
