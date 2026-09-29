import type { Metadata } from 'next';
import Link from 'next/link';
import { Divider } from '@/components/ui/atoms/Divider';
import { buttonClassName } from '@/components/ui/atoms/Button';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Ollama Explorer protects your privacy and handles your data.',
  alternates: {
    canonical: 'https://ollama-explorer.vercel.app/privacy',
  },
  openGraph: {
    url: 'https://ollama-explorer.vercel.app/privacy',
    title: 'Privacy Policy | Ollama Model Explorer',
    description: 'Privacy policy for Ollama Model Explorer.',
  },
};

export default function PrivacyPage() {
  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-text-subtle)]">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Divider />

      {/* Introduction */}
      <section className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          At <strong className="text-[var(--color-text)]">Ollama Explorer</strong>, we take your
          privacy seriously. This policy explains how we collect, use, and protect your information.
        </p>
      </section>

      {/* Information We Collect */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          1. Information We Collect
        </h2>
        <div className="flex flex-col gap-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <p>
            <strong className="text-[var(--color-text)]">Analytics Data (with consent):</strong> If
            you accept cookies, we use Google Analytics 4 to understand how you use our site. This
            includes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Pages you visit and how long you stay</li>
            <li>Your browser type and device</li>
            <li>Approximate location (country/city level)</li>
            <li>How you arrived at our site (referral source)</li>
          </ul>
          <p className="mt-2">
            <strong className="text-[var(--color-text)]">No personal data:</strong> We do NOT
            collect your name, email, IP address, or any personally identifiable information.
          </p>
        </div>
      </section>

      {/* How We Use Your Data */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">2. How We Use Your Data</h2>
        <div className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <p>We use analytics data to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Improve site performance and user experience</li>
            <li>Understand which features are most popular</li>
            <li>Fix bugs and technical issues</li>
            <li>Make informed decisions about new features</li>
          </ul>
        </div>
      </section>

      {/* Cookies */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">3. Cookies</h2>
        <div className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <p>
            We use <strong className="text-[var(--color-text)]">Google Analytics cookies</strong>{' '}
            only if you click &rdquo;Accept&#34; on our cookie banner. You can withdraw consent at
            any time by:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Clearing your browser cookies</li>
            <li>Using your browser&apos;s private/incognito mode</li>
          </ul>
          <p className="mt-2">
            <strong className="text-[var(--color-text)]">Essential cookies:</strong> We use minimal
            localStorage for your theme preference (dark/light mode) and interface choices. These
            are strictly necessary and don&apos;t require consent.
          </p>
        </div>
      </section>

      {/* Data Sharing */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">4. Data Sharing</h2>
        <div className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <p>
            <strong className="text-[var(--color-text)]">We do NOT sell your data.</strong> We never
            share, sell, or rent your information to third parties for marketing purposes.
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Google Analytics:</strong> If you accept
            cookies, anonymous analytics data is processed by Google. See{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>

      {/* Your Rights */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">5. Your Rights</h2>
        <div className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Decline analytics cookies</li>
            <li>Access your browser data</li>
            <li>Clear your browser cookies at any time</li>
            <li>Use the site without accepting cookies</li>
          </ul>
        </div>
      </section>

      {/* Third-Party Links */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">6. Third-Party Links</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Our site contains links to external websites like{' '}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
          >
            ollama.com
          </a>{' '}
          and{' '}
          <a
            href="https://huggingface.co"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
          >
            Hugging Face
          </a>
          . We are not responsible for their privacy practices.
        </p>
      </section>

      {/* Children's Privacy */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          7. Children&apos;s Privacy
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Our service is not directed to children under 13. We do not knowingly collect information
          from children under 13.
        </p>
      </section>

      {/* Changes */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          8. Changes to This Policy
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          We may update this privacy policy from time to time. We will notify you of any changes by
          posting the new policy on this page and updating the &quot;Last updated&quot; date.
        </p>
      </section>

      <Divider />

      {/* Contact */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Contact Us</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          If you have questions about this privacy policy, please{' '}
          <a
            href="https://github.com/serkan-uslu/ollama-explorer/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
          >
            open an issue on GitHub
          </a>
          .
        </p>
      </section>

      {/* Back button */}
      <div className="pt-4">
        <Link href="/about" className={buttonClassName('outline')}>
          ← Back to About
        </Link>
      </div>
    </main>
  );
}
