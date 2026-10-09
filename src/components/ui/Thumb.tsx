/**
 * Grid-size photo. Loads the small `_t.jpg` thumbnail that uploads now ship with, and falls
 * back to the full image for older photos (and external links) that have none.
 */
import { useState } from 'react';
import { thumbUrl } from '../../lib/image';

export function Thumb({ url, className = 'w-full h-full object-cover' }: { url: string; className?: string }) {
  const small = thumbUrl(url);
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? url : small}
      alt=""
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => { if (!failed && small !== url) setFailed(true); }}
    />
  );
}
