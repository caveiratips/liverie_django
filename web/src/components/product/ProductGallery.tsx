'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProductImage } from '@/data/types/product';

function getImageUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const url = String(u);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/media/')) return url;
  if (url.startsWith('/media/')) return `/api/media${url.replace('/media', '')}`;
  return url;
}

export default function ProductGallery({ images = [], title }: { images?: ProductImage[]; title: string }) {
  const normalized = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images]);
  const initialIndex = useMemo(() => {
    const idx = normalized.findIndex((img) => img?.is_primary);
    return idx >= 0 ? idx : 0;
  }, [normalized]);

  const [index, setIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const current = normalized[index];
  const currentUrl = getImageUrl(current?.url);
  const currentAlt = current?.alt_text || title;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  const scale = hovered ? 1.75 : 1;

  return (
    <div className="rounded-lg border bg-card p-3">
      <div
        ref={containerRef}
        className="aspect-square w-full overflow-hidden rounded-md bg-muted"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={onMouseMove}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={currentAlt}
            className="h-full w-full object-cover"
            style={{ transformOrigin: `${origin.x}% ${origin.y}%`, transform: `scale(${scale})`, transition: 'transform 120ms ease' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">Sem imagem</div>
        )}
      </div>
      {normalized.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {normalized.map((img, idx) => {
            const url = getImageUrl(img?.url);
            const active = idx === index;
            return (
              <button
                type="button"
                key={idx}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded border bg-muted ${active ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setIndex(idx)}
                aria-label={`Ver imagem ${idx + 1}`}
              >
                {url ? (
                  <img src={url} alt={img?.alt_text || title} className="h-full w-full object-cover" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}