import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ollama Explorer - Find the Right AI Model Fast';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '60px',
        position: 'relative',
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #fafafa 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fafafa 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
        }}
      />

      {/* Hero icon with glow */}
      <div
        style={{
          position: 'relative',
          marginBottom: 32,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -20,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          style={{
            fontSize: 88,
            lineHeight: 1,
            position: 'relative',
            color: '#fafafa',
          }}
        >
          ⬡
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: '#fafafa',
          marginBottom: 16,
          letterSpacing: '-2px',
          textAlign: 'center',
          textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        Ollama Explorer
      </div>

      {/* Subtitle with gradient */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 500,
          marginTop: 16,
          marginBottom: 40,
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.4,
          background: 'linear-gradient(90deg, #d4d4d8 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Find the perfect AI model in seconds, not hours
      </div>

      {/* Feature badges */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 900,
        }}
      >
        {[
          { label: '214+ Models', icon: '🤖', color: '#6366f1' },
          { label: 'Smart Filters', icon: '🎛️', color: '#8b5cf6' },
          { label: 'Side-by-Side Compare', icon: '📊', color: '#d946ef' },
          { label: 'One-Click Deploy', icon: '⚡', color: '#ec4899' },
        ].map(({ label, icon }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 16,
              fontWeight: 500,
              color: '#e4e4e7',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          marginTop: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: 8,
          fontSize: 18,
          fontWeight: 600,
          color: '#fafafa',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
        }}
      >
        <span>Explore Models →</span>
      </div>

      {/* Bottom URL */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          fontSize: 16,
          fontWeight: 500,
          color: '#71717a',
          letterSpacing: '0.5px',
        }}
      >
        ollama-explorer.vercel.app
      </div>

      {/* GitHub corner */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 36,
          fontSize: 14,
          fontWeight: 500,
          color: '#52525b',
        }}
      >
        github.com/serkan-uslu/ollama-explorer
      </div>
    </div>,
    { ...size },
  );
}
