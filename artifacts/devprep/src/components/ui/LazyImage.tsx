import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: 'blur' | 'color' | 'none'
  placeholderColor?: string
  sizes?: string
  srcSet?: string
  webpSrcSet?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
  onLoad?: () => void
  onError?: (error: Error) => void
  aspectRatio?: string
  children?: ReactNode
  style?: React.CSSProperties
}

interface ImageState {
  loaded: boolean
  error: boolean
  visible: boolean
}

const supportsWebP = (): boolean => {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
  return false
}

const generateSrcSet = (src: string, widths: number[] = [320, 640, 960, 1280, 1920]): string => {
  const ext = src.split('.').pop()?.split('?')[0]
  const basePath = src.split('?')[0].replace(/\.[^/.]+$/, '')

  return widths.map(w => `${basePath}-${w}w.${ext} ${w}w`).join(', ')
}

const generateWebpSrcSet = (
  src: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string => {
  if (supportsWebP()) {
    const basePath = src.split('?')[0].replace(/\.[^/.]+$/, '')
    return widths.map(w => `${basePath}-${w}w.webp ${w}w`).join(', ')
  }
  return ''
}

export function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'blur',
  placeholderColor = '#f0f0f0',
  sizes,
  srcSet,
  webpSrcSet,
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  aspectRatio,
  children,
  style,
}: LazyImageProps) {
  const [state, setState] = useState<ImageState>({
    loaded: false,
    error: false,
    visible: false,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleLoad = useCallback(() => {
    setState(prev => ({ ...prev, loaded: true }))
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setState(prev => ({ ...prev, error: true }))
      onError?.(new Error('Failed to load image'))
    },
    [onError]
  )

  useEffect(() => {
    if (loading === 'eager' || !containerRef.current) {
      setState(prev => ({ ...prev, visible: true }))
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setState(prev => ({ ...prev, visible: true }))
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  useEffect(() => {
    if (state.loaded || !imgRef.current) return

    const img = imgRef.current
    if (img.complete && img.naturalWidth > 0) {
      handleLoad()
    }
  }, [state.loaded, handleLoad])

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: placeholder === 'color' ? placeholderColor : 'transparent',
    ...(aspectRatio && { aspectRatio }),
    ...style,
  }

  const blurStyle: React.CSSProperties = state.loaded
    ? {
        filter: 'blur(0)',
        opacity: 1,
        transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
      }
    : {
        filter: 'blur(20px)',
        opacity: 0.7,
        transform: 'scale(1.1)',
        transition: 'filter 0.3s ease-out, opacity 0.3s ease-out, transform 0.3s ease-out',
      }

  return (
    <div ref={containerRef} className={`lazy-image-container ${className}`} style={containerStyle}>
      {placeholder === 'blur' && !state.loaded && (
        <div
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: placeholderColor,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: 0.7,
          }}
          aria-hidden="true"
        />
      )}

      {state.visible && (
        <picture>
          {webpSrcSet || (src && !src.includes('.webp')) ? (
            <source
              type="image/webp"
              srcSet={webpSrcSet || generateWebpSrcSet(src)}
              sizes={sizes}
            />
          ) : null}
          <img
            ref={imgRef}
            src={src}
            srcSet={srcSet || generateSrcSet(src)}
            sizes={sizes}
            alt={alt}
            loading={loading}
            decoding={decoding}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              ...blurStyle,
            }}
            className="lazy-image"
          />
        </picture>
      )}

      {state.error && (
        <div
          className="lazy-image-error"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: placeholderColor,
            color: 'var(--muted-foreground)',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}

      {children && state.loaded && (
        <div className="lazy-image-overlay" style={{ position: 'absolute', inset: 0 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function useImagePreloader(urls: string[]) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const preloadImage = useCallback(
    (url: string) => {
      if (loaded.has(url) || loading.has(url)) return

      setLoading(prev => new Set(prev).add(url))

      const img = new Image()
      img.onload = () => {
        setLoaded(prev => new Set(prev).add(url))
        setLoading(prev => {
          const next = new Set(prev)
          next.delete(url)
          return next
        })
      }
      img.onerror = () => {
        setLoading(prev => {
          const next = new Set(prev)
          next.delete(url)
          return next
        })
      }
      img.src = url
    },
    [loaded, loading]
  )

  useEffect(() => {
    urls.forEach(preloadImage)
  }, [urls, preloadImage])

  return { loaded, loading, preloadImage }
}

export function ImageWithMultipleSources({
  sources,
  fallback,
  alt,
  className,
  ...props
}: {
  sources: Array<{ srcSet: string; type: string; media?: string }>
  fallback: string
  alt: string
  className?: string
} & Omit<LazyImageProps, 'src' | 'srcSet' | 'webpSrcSet'>) {
  return <LazyImage src={fallback} alt={alt} className={className} {...props} />
}

export default LazyImage
