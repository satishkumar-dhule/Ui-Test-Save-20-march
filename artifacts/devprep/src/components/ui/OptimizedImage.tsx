import { cn } from '@/lib/utils'
import { forwardRef, useState, useEffect, useRef, useCallback } from 'react'
import {
  generateSrcSet,
  generateWebPSrcSet,
  generateBlurPlaceholder,
  createIntersectionObserver,
  SUPPORTS_WEBP,
  type ImageOptimizationOptions,
} from '@/utils/imageOptimizer'

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  sizes?: string
  optimizationOptions?: ImageOptimizationOptions
  showSkeleton?: boolean
  skeletonClassName?: string
  fallbackSrc?: string
  aspectRatio?: number
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  onLoadStart?: () => void
  onLoadComplete?: () => void
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      sizes = '100vw',
      optimizationOptions = {},
      showSkeleton = true,
      skeletonClassName,
      fallbackSrc,
      aspectRatio,
      objectFit = 'cover',
      className,
      onLoadStart,
      onLoadComplete,
      loading = 'lazy',
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [blurDataUrl, setBlurDataUrl] = useState<string>('')
    const [shouldLoad, setShouldLoad] = useState(loading === 'eager')
    const imgRef = useRef<HTMLImageElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const { sizes: optimizationSizes, quality = 80, placeholderSize = 20 } = optimizationOptions

    const srcSet = generateSrcSet(src, optimizationSizes, quality)
    const webpSrcSet = generateWebPSrcSet(src, optimizationSizes, quality)
    const showWebp = SUPPORTS_WEBP && webpSrcSet

    useEffect(() => {
      if (loading === 'lazy' && containerRef.current) {
        const observer = createIntersectionObserver(
          entries => {
            const entry = entries[0]
            if (entry?.isIntersecting) {
              setShouldLoad(true)
              observer?.disconnect()
            }
          },
          { rootMargin: '100px 0px' }
        )

        if (observer) {
          observer.observe(containerRef.current)
          return () => observer.disconnect()
        }
        return undefined
      }
      return undefined
    }, [loading])

    useEffect(() => {
      if (placeholderSize > 0) {
        generateBlurPlaceholder(src)
          .then(setBlurDataUrl)
          .catch(() => setBlurDataUrl(''))
      }
    }, [src, placeholderSize])

    const handleLoad = useCallback(() => {
      setIsLoaded(true)
      onLoadComplete?.()
    }, [onLoadComplete])

    const handleError = useCallback(() => {
      setHasError(true)
      if (fallbackSrc && imgRef.current) {
        imgRef.current.src = fallbackSrc
      }
    }, [fallbackSrc])

    const handleLoadStart = useCallback(() => {
      onLoadStart?.()
    }, [onLoadStart])

    useEffect(() => {
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        handleLoad()
      }
    }, [handleLoad])

    const containerStyle = aspectRatio ? { aspectRatio: aspectRatio.toString() } : undefined

    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden', className)}
        style={containerStyle}
      >
        {showSkeleton && !isLoaded && !hasError && (
          <div
            className={cn('absolute inset-0 bg-muted animate-pulse', skeletonClassName)}
            aria-hidden="true"
          />
        )}

        {blurDataUrl && !isLoaded && (
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              backgroundImage: `url(${blurDataUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(10px)',
              transform: 'scale(1.1)',
              opacity: isLoaded ? 0 : 1,
            }}
            aria-hidden="true"
          />
        )}

        {shouldLoad && (
          <picture>
            {showWebp && <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />}
            <img
              ref={imgRef}
              src={src}
              srcSet={srcSet}
              sizes={sizes}
              alt={alt}
              loading={loading}
              decoding="async"
              onLoadStart={handleLoadStart}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'w-full h-full transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                objectFit === 'cover' && 'object-cover',
                objectFit === 'contain' && 'object-contain',
                objectFit === 'fill' && 'object-fill',
                objectFit === 'none' && 'object-none'
              )}
              {...props}
            />
          </picture>
        )}

        {!shouldLoad && (
          <div
            ref={ref as React.Ref<HTMLDivElement>}
            className="w-full h-full"
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'

export interface ImageSkeletonProps {
  width?: string | number
  height?: string | number
  aspectRatio?: number
  className?: string
  variant?: 'rectangular' | 'rounded' | 'circular'
}

export function ImageSkeleton({
  width = '100%',
  height,
  aspectRatio,
  className,
  variant = 'rectangular',
}: ImageSkeletonProps) {
  const variantClasses = {
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
  }

  return (
    <div
      className={cn('bg-muted animate-pulse', variantClasses[variant], className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: height
          ? typeof height === 'number'
            ? `${height}px`
            : height
          : aspectRatio
            ? undefined
            : '200px',
        aspectRatio: aspectRatio,
      }}
      aria-hidden="true"
    />
  )
}

export interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'sizes'> {
  breakpoints?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }
}

const DEFAULT_BREAKPOINTS = {
  sm: '100vw',
  md: '50vw',
  lg: '33vw',
  xl: '25vw',
}

export function ResponsiveImage({
  breakpoints = DEFAULT_BREAKPOINTS,
  ...props
}: ResponsiveImageProps) {
  const sizes = Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(min-width: ${breakpoint}) ${size}`)
    .join(', ')

  return <OptimizedImage {...props} sizes={sizes} />
}

export interface LazyImageProps extends Omit<OptimizedImageProps, 'loading'> {
  rootMargin?: string
  threshold?: number
}

export function LazyImage({
  rootMargin = '100px 0px',
  threshold = 0.01,
  ...props
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return <div ref={containerRef}>{isInView && <OptimizedImage {...props} loading="lazy" />}</div>
}

export default OptimizedImage
