'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const BAR_COUNT = 56;

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Real playback of the preview window (previewStartMs..previewEndMs), with a
 * waveform drawn from the actual file's decoded amplitude — never a
 * decorative random pattern. If decoding fails (format/CORS) the scrubber
 * still works from currentTime/duration alone.
 */
export function AudioPreview({
  src,
  previewStartMs,
  previewEndMs,
  comingSoonLabel,
}: {
  src: string | null;
  previewStartMs: number;
  previewEndMs: number;
  comingSoonLabel: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(previewStartMs);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const audioBuf = await ctx.decodeAudioData(buf);
        const channel = audioBuf.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channel.length / BAR_COUNT));
        const computed: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) sum += Math.abs(channel[start + j] ?? 0);
          computed.push(sum / blockSize);
        }
        const max = Math.max(...computed, 0.0001);
        if (!cancelled) setPeaks(computed.map((v) => v / max));
        void ctx.close();
      } catch {
        // Waveform stays flat; play/pause/seek still work.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src) {
    return (
      <div
        className="flex items-center gap-4 rounded-[var(--radius-panel)] border px-5 py-4 opacity-60"
        style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
      >
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {comingSoonLabel}
        </span>
      </div>
    );
  }

  const durationMs = Math.max(1, previewEndMs - previewStartMs);
  const progress = Math.min(1, Math.max(0, (currentMs - previewStartMs) / durationMs));

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      if (audio.currentTime * 1000 < previewStartMs || audio.currentTime * 1000 >= previewEndMs) {
        audio.currentTime = previewStartMs / 1000;
      }
      void audio.play();
    }
  }

  function seek(ratio: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const target = previewStartMs + ratio * durationMs;
    audio.currentTime = target / 1000;
    setCurrentMs(target);
  }

  return (
    <div
      className="flex items-center gap-4 rounded-[var(--radius-panel)] border px-5 py-4"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = previewStartMs / 1000;
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const ms = e.currentTarget.currentTime * 1000;
          setCurrentMs(ms);
          if (ms >= previewEndMs) e.currentTarget.pause();
        }}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)]"
        style={{ background: 'var(--champagne)' }}
      >
        {playing ? <Pause aria-hidden size={16} /> : <Play aria-hidden size={16} className="ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
        aria-label="Seek"
        className="flex h-8 flex-1 items-center gap-[2px]"
      >
        {(peaks ?? Array.from({ length: BAR_COUNT }, () => 0.35)).map((peak, i) => {
          const active = i / BAR_COUNT <= progress;
          return (
            <span
              key={i}
              className="w-full rounded-full"
              style={{
                height: `${Math.max(12, peak * 100)}%`,
                background: active ? 'var(--champagne)' : 'var(--line-strong)',
              }}
            />
          );
        })}
      </button>

      <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-dim)]">
        {formatClock(currentMs - previewStartMs)} / {formatClock(durationMs)}
      </span>
    </div>
  );
}
