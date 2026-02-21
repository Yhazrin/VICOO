import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.(new Error(`Failed to load image: ${src}`));
  }, [onError, src]);

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {!isLoaded && !hasError && (
        <div
          className="lazy-image-placeholder absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {placeholder || (
            <div className="animate-pulse h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded" />
          )}
        </div>
      )}

      {hasError ? (
        <div
          className="lazy-image-error flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      ) : (
        isInView && (
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`lazy-image transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            {...props}
          />
        )
      )}
    </div>
  );
};

// Background image version
interface LazyBackgroundProps {
  src: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyBackground: React.FC<LazyBackgroundProps> = ({
  src,
  alt,
  children,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div
      ref={containerRef}
      className={`lazy-background ${className}`}
      style={{
        position: 'relative',
        backgroundImage: isInView ? `url(${src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.3s ease-in-out',
      }}
      role={alt ? 'img' : undefined}
      aria-label={alt}
    >
      {children}
    </div>
  );
};

export default LazyImage;
