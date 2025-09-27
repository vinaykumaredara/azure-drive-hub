import React, { useEffect, useState } from 'react';

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholder?: React.ReactNode;
};

export default function AdminImage({ src, alt = '', className = '', placeholder = null }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [finalSrc, setFinalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setOk(false);
      setFinalSrc(null);
      return;
    }
    // Quick HEAD check to ensure the URL resolves to an image
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(src, { method: 'HEAD', cache: 'force-cache' });
        if (cancelled) return;
        const ct = resp.headers.get('content-type') || '';
        if (resp.ok && ct.startsWith('image')) {
          setOk(true);
          setFinalSrc(src);
        } else {
          setOk(false);
        }
      } catch (err) {
        if (!cancelled) setOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  if (ok === null) {
    // Loading placeholder
    return <div className={`animate-pulse bg-gray-200 ${className}`} style={{ minHeight: 160 }} />;
  }
  if (!ok || !finalSrc) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ minHeight: 160 }}>
        {placeholder ?? <span className="text-sm text-gray-500">No image</span>}
      </div>
    );
  }
  return <img src={finalSrc} alt={alt} className={className} loading="lazy" />;
}
