interface BrowseLayoutProps {
  sidebar: React.ReactNode;
  search: React.ReactNode;
  results: React.ReactNode;
  count: React.ReactNode;
  chips?: React.ReactNode;
}

export function BrowseLayout({ sidebar, search, results, count, chips }: BrowseLayoutProps) {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] min-w-0 bg-[var(--color-page-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-12">
        {/* Search — full width */}
        <div className="mb-4">{search}</div>

        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          {sidebar}

          {/* Main content */}
          <main id="main" className="flex-1 min-w-0 flex flex-col gap-4">
            {chips}
            <div className="hidden lg:block">{count}</div>
            {results}
          </main>
        </div>
      </div>
    </div>
  );
}
