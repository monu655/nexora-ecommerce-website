import { useEffect, useMemo, useState } from 'react';

/**
 * Catalogue photography is not part of this build, so each product renders a
 * deterministic branded visual derived from its colourway and category.
 * It keeps the grid consistent and avoids broken-image states entirely.
 */
const GLYPHS = {
  Audio: (c) => (
    <g stroke={c} strokeWidth="6" fill="none" strokeLinecap="round">
      <path d="M46 96a50 50 0 0 1 100 0" />
      <rect x="34" y="92" width="26" height="44" rx="13" fill={c} stroke="none" />
      <rect x="132" y="92" width="26" height="44" rx="13" fill={c} stroke="none" />
    </g>
  ),
  Wearables: (c) => (
    <g fill="none" stroke={c} strokeWidth="6" strokeLinecap="round">
      <rect x="66" y="58" width="60" height="76" rx="16" />
      <path d="M80 58V40h32v18M80 134v18h32v-18" />
      <path d="M84 96h10l6-12 8 22 6-10h10" strokeWidth="5" />
    </g>
  ),
  Keyboards: (c) => (
    <g fill="none" stroke={c} strokeWidth="5">
      <rect x="30" y="66" width="132" height="62" rx="10" />
      <g fill={c} stroke="none">
        {[0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={`${r}-${k}`} x={42 + k * 19} y={78 + r * 15} width="13" height="10" rx="2.5" opacity={0.85} />
        )))}
      </g>
    </g>
  ),
  Gaming: (c) => (
    <g fill="none" stroke={c} strokeWidth="6" strokeLinecap="round">
      <path d="M58 78h76a26 26 0 0 1 24 34l-6 22a16 16 0 0 1-28 5l-10-14H78l-10 14a16 16 0 0 1-28-5l-6-22a26 26 0 0 1 24-34Z" />
      <path d="M66 100h18M75 91v18" strokeWidth="5" />
      <circle cx="122" cy="99" r="4" fill={c} />
      <circle cx="136" cy="110" r="4" fill={c} />
    </g>
  ),
  'Laptop Accessories': (c) => (
    <g fill="none" stroke={c} strokeWidth="6" strokeLinejoin="round">
      <path d="M52 60h88v62H52z" />
      <path d="M36 134h120l-8 14H44z" />
    </g>
  ),
  'Mobile Accessories': (c) => (
    <g fill="none" stroke={c} strokeWidth="6">
      <rect x="68" y="46" width="56" height="100" rx="12" />
      <path d="M88 60h16" strokeLinecap="round" />
      <path d="M100 88l-10 18h20l-10 18" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
};

// Unsplash (and similar CDNs) can resize on the fly via query params.
// We rewrite the stored URL so a small grid thumbnail actually downloads a
// small image, instead of the same 900px file everywhere. Local files
// (no matching host) are returned untouched.
function optimizedUrl(url, width) {
  if (!url) return url;
  try {
    const u = new URL(url);
    const resizableHosts = ['images.unsplash.com', 'res.cloudinary.com'];
    const isResizable = resizableHosts.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`)
    );
    if (!isResizable) return url;
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', '65');
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

export function ProductVisual({ product, className = '', ratio = 'aspect-[4/3]', size = 480, priority = false }) {
  const color = product?.colorway || '#1B39C9';
  const glyph = useMemo(() => (GLYPHS[product?.category] || GLYPHS.Audio)(color), [product?.category, color]);
  const tint = `${color}0F`;
  const rawPhoto = product?.images?.[0] || product?.image;
  const photo = useMemo(() => optimizedUrl(rawPhoto, size), [rawPhoto, size]);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  // Reset load/error state whenever the photo actually changes — otherwise a
  // reused instance (e.g. in a virtualised or re-sorted list) can carry over
  // stale state from the previous product's image.
  useEffect(() => {
    setPhotoLoaded(false);
    setPhotoFailed(false);
  }, [photo]);

  // The generated visual is always painted first and the photograph fades in
  // over it once decoded. A slow, blocked or missing image therefore leaves a
  // finished-looking tile rather than an empty box waiting on an error event.
  const hasPhoto = Boolean(photo) && !photoFailed;

  return (
    <div className={`${ratio} ${className} relative overflow-hidden bg-surface-sunken`} style={{ backgroundColor: tint }}>
      <svg
        viewBox="0 0 192 192"
        className="h-full w-full"
        role={hasPhoto ? undefined : 'img'}
        aria-hidden={hasPhoto ? 'true' : undefined}
        aria-label={hasPhoto ? undefined : product?.name}
      >
        <circle cx="96" cy="96" r="70" fill="#fff" opacity="0.75" />
        {glyph}
      </svg>
      <span className="absolute bottom-2.5 left-3 text-[10px] font-semibold tracking-wide text-ink-muted/70">
        {product?.sku}
      </span>

      {hasPhoto && (
        <img
          src={photo}
          alt={product?.name || ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setPhotoLoaded(true)}
          onError={() => setPhotoFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            photoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}