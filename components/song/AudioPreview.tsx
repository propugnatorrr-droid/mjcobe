'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Pause,
  Play,
} from 'lucide-react';

const BAR_COUNT = 56;

function formatClock(ms: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(ms / 1000),
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${String(
    seconds,
  ).padStart(2, '0')}`;
}

export function AudioPreview({
  src,
  previewStartMs,
  previewEndMs,
  allowFullPlayback,
  comingSoonLabel,
}: {
  src: string | null;
  previewStartMs: number;
  previewEndMs: number;
  allowFullPlayback: boolean;
  comingSoonLabel: string;
}) {
  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );

  const [playing, setPlaying] =
    useState(false);

  const [
    mediaDurationMs,
    setMediaDurationMs,
  ] = useState<number | null>(null);

  const [currentMs, setCurrentMs] =
    useState(
      allowFullPlayback
        ? 0
        : previewStartMs,
    );

  const [peaks, setPeaks] =
    useState<number[] | null>(null);

  useEffect(() => {
    if (!src) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response =
          await fetch(src);

        const buffer =
          await response.arrayBuffer();

        const BrowserAudioContext =
          window.AudioContext ??
          (
            window as unknown as {
              webkitAudioContext:
                typeof AudioContext;
            }
          ).webkitAudioContext;

        const context =
          new BrowserAudioContext();

        const audioBuffer =
          await context.decodeAudioData(
            buffer,
          );

        const channel =
          audioBuffer.getChannelData(0);

        const blockSize = Math.max(
          1,
          Math.floor(
            channel.length /
              BAR_COUNT,
          ),
        );

        const computed: number[] = [];

        for (
          let index = 0;
          index < BAR_COUNT;
          index += 1
        ) {
          let sum = 0;
          const start =
            index * blockSize;

          for (
            let offset = 0;
            offset < blockSize;
            offset += 1
          ) {
            sum += Math.abs(
              channel[
                start + offset
              ] ?? 0,
            );
          }

          computed.push(
            sum / blockSize,
          );
        }

        const maximum = Math.max(
          ...computed,
          0.0001,
        );

        if (!cancelled) {
          setPeaks(
            computed.map(
              (value) =>
                value / maximum,
            ),
          );
        }

        void context.close();
      } catch {
        // Playback remains available
        // when waveform decoding fails.
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
        style={{
          borderColor: 'var(--line)',
          background: 'var(--ink-2)',
        }}
      >
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {comingSoonLabel}
        </span>
      </div>
    );
  }

  const effectiveStartMs =
    allowFullPlayback
      ? 0
      : previewStartMs;

  const requestedEndMs =
    allowFullPlayback &&
    mediaDurationMs
      ? mediaDurationMs
      : previewEndMs;

  const effectiveEndMs =
    mediaDurationMs
      ? Math.min(
          requestedEndMs,
          mediaDurationMs,
        )
      : requestedEndMs;

  const durationMs = Math.max(
    1,
    effectiveEndMs -
      effectiveStartMs,
  );

  const progress = Math.min(
    1,
    Math.max(
      0,
      (
        currentMs -
        effectiveStartMs
      ) / durationMs,
    ),
  );

  function toggle() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      return;
    }

    const current =
      audio.currentTime * 1000;

    if (
      current < effectiveStartMs ||
      current >= effectiveEndMs
    ) {
      audio.currentTime =
        effectiveStartMs / 1000;
    }

    void audio.play();
  }

  function seek(ratio: number) {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const target =
      effectiveStartMs +
      ratio * durationMs;

    audio.currentTime =
      target / 1000;

    setCurrentMs(target);
  }

  return (
    <div
      className="flex items-center gap-4 rounded-[var(--radius-panel)] border px-5 py-4"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--ink-2)',
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const duration =
            Math.round(
              event.currentTarget
                .duration * 1000,
            );

          setMediaDurationMs(duration);

          event.currentTarget.currentTime =
            effectiveStartMs / 1000;

          setCurrentMs(
            effectiveStartMs,
          );
        }}
        onPlay={() =>
          setPlaying(true)
        }
        onPause={() =>
          setPlaying(false)
        }
        onTimeUpdate={(event) => {
          const milliseconds =
            event.currentTarget
              .currentTime * 1000;

          setCurrentMs(milliseconds);

          if (
            milliseconds >=
            effectiveEndMs
          ) {
            event.currentTarget.pause();
          }
        }}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={
          playing ? 'Pause' : 'Play'
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--champagne)] text-[var(--ink)]"
      >
        {playing ? (
          <Pause
            aria-hidden
            size={16}
          />
        ) : (
          <Play
            aria-hidden
            size={16}
            className="ml-0.5"
          />
        )}
      </button>

      <button
        type="button"
        onClick={(event) => {
          const rectangle =
            event.currentTarget
              .getBoundingClientRect();

          seek(
            (
              event.clientX -
              rectangle.left
            ) / rectangle.width,
          );
        }}
        aria-label="Seek"
        className="flex h-8 flex-1 items-center gap-[2px]"
      >
        {(
          peaks ??
          Array.from(
            {
              length: BAR_COUNT,
            },
            () => 0.35,
          )
        ).map((peak, index) => {
          const active =
            index / BAR_COUNT <=
            progress;

          return (
            <span
              key={index}
              className="w-full rounded-full"
              style={{
                height:
                  `${Math.max(
                    12,
                    peak * 100,
                  )}%`,
                background: active
                  ? 'var(--champagne)'
                  : 'var(--line-strong)',
              }}
            />
          );
        })}
      </button>

      <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-dim)]">
        {formatClock(
          currentMs -
            effectiveStartMs,
        )}
        {' / '}
        {formatClock(durationMs)}
      </span>
    </div>
  );
}
