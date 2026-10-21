import React, { useState, useRef, useEffect } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/no-image.svg',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  const handleLoad = () => setLoaded(true);
  const handleError = () => setError(true);

  const actualSrc = error || !src ? fallbackSrc : src;

  return (
    <div className="relative">
      <img
        ref={imgRef}
        src={actualSrc}
        alt={alt}
        loading="lazy"
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
      )}
    </div>
  );
};
