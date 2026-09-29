interface DetailLayoutProps {
  back: React.ReactNode;
  header: React.ReactNode;
  main: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function DetailLayout({ back, header, main, sidebar }: DetailLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-12">
      <div className="mb-4 sm:mb-6">{back}</div>
      <div className="mb-6 border-b border-[var(--color-border)] pb-6 sm:mb-8 sm:pb-8">
        {header}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
        <main
          id="main"
          className="flex min-w-0 flex-1 flex-col gap-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-[var(--shadow-sm)] sm:p-6"
        >
          {main}
        </main>
        {sidebar && (
          <aside className="flex w-full shrink-0 flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 shadow-[var(--shadow-sm)] sm:p-5 lg:w-72 xl:w-80">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
