/**
 * Pure formatting utilities for display values.
 * Constants (sort options, pagination config) live in lib/constants.ts.
 */

export function formatPulls(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'Unknown';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatRam(gb: number | null | undefined): string {
  if (gb === null || gb === undefined) return 'Unknown';
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  return `${gb} GB`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Unknown';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatContextWindow(n: number | null | undefined): string {
  if (n === null || n === undefined) return 'Unknown';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return 'Unknown';
  const gigabytes = bytes / 1_000_000_000;
  return gigabytes < 1
    ? `${Math.round(bytes / 1_000_000)} MB`
    : `${gigabytes.toFixed(gigabytes < 10 ? 1 : 0)} GB`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}
