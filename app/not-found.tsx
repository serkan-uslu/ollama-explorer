import Link from 'next/link';
import { buttonClassName } from '@/components/ui/atoms/Button';
import { OlliVideo } from '@/components/features/home/OlliVideo';

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center"
    >
      <div className="mb-8">
        <OlliVideo />
      </div>
      <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">Page not found</h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-8">
        The page you&rsquo;re looking for doesn&rsquo;t exist or the model may have been removed.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/models" className={buttonClassName()}>
          Browse models
        </Link>
        <Link href="/" className={buttonClassName('outline')}>
          Go home
        </Link>
      </div>
    </main>
  );
}
