import { ImageResponse } from 'next/og';

export const alt = 'Ollama Explorer - choose the right model and tag';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 72,
        background: 'linear-gradient(135deg, #09090b, #18181b)',
        color: '#fafafa',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', color: '#a5b4fc', fontSize: 24, marginBottom: 24 }}>
        LOCAL-FIRST MODEL DISCOVERY
      </div>
      <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, letterSpacing: -3 }}>
        Ollama Explorer
      </div>
      <div
        style={{ display: 'flex', maxWidth: 900, marginTop: 28, fontSize: 34, color: '#d4d4d8' }}
      >
        Pick a task and memory budget. Copy the exact ollama run model:tag command.
      </div>
      <div style={{ display: 'flex', marginTop: 56, fontSize: 20, color: '#71717a' }}>
        ollama-explorer.vercel.app
      </div>
    </div>,
    size,
  );
}
