'use client';

import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';
import { useRef, useState, useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function OlliVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    () => true,
  );

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    setUserInteracted(true);
    if (!nextMuted && video.paused) void video.play();
  }

  return (
    <figure className="relative aspect-[520/924] w-[190px] max-w-full select-none sm:w-[220px] md:w-[260px]">
      {reduceMotion ? (
        <Image
          src="/olli.jpg"
          alt="Olli, the Ollama Explorer mascot"
          fill
          sizes="(min-width: 768px) 260px, (min-width: 640px) 220px, 190px"
          preload
          className="rounded-3xl object-cover shadow-xl"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster="/olli.jpg"
            aria-label="Olli, the Ollama Explorer mascot"
            className="h-full w-full rounded-3xl object-cover shadow-xl"
          >
            <source src="/olli.mp4" type="video/mp4" />
            Your browser does not support the Olli video.
          </video>
          {!userInteracted ? (
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
              aria-label="Play Olli with sound"
              className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-2 text-xs font-semibold tracking-wide text-white [text-shadow:0_1px_6px_rgb(0_0_0/0.7)]"
            >
              <span className="relative flex min-h-14 min-w-14 items-center justify-center rounded-full bg-white/25 shadow-[0_4px_24px_rgb(0_0_0/0.35)] backdrop-blur">
                <span className="absolute h-[72px] w-[72px] animate-ping rounded-full bg-white/25 [animation-duration:1.4s]" />
                <span className="absolute h-[88px] w-[88px] animate-ping rounded-full bg-white/10 [animation-delay:300ms] [animation-duration:1.4s]" />
                <VolumeX size={26} aria-hidden className="relative" />
              </span>
              Tap to hear Olli
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
              aria-label={muted ? 'Play Olli with sound' : 'Mute Olli'}
              className="absolute bottom-3 right-3 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
            </button>
          )}
        </>
      )}
      <figcaption className="sr-only">
        Olli welcomes visitors to the local Ollama model explorer.
      </figcaption>
    </figure>
  );
}
