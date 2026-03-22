export interface ImageOptimizationOptions {
  sizes?: number[]
  format?: 'webp' | 'avif' | 'original'
  quality?: number
  placeholderSize?: number
  lazy?: boolean
}

export interface OptimizedSrcSet {
  webp?: string
  avif?: string
  original: string
  placeholder: string
}

const DEFAULT_SIZES = [320, 640, 960, 1280, 1920]
const DEFAULT_QUALITY = 80
const BLUR_PLACEHOLDER_SIZE = 20

export function generateSrcSet(
  src: string,
  sizes: number[] = DEFAULT_SIZES,
  quality: number = DEFAULT_QUALITY
): string {
  if (!src) return ''

  const ext = src.split('.').pop()?.toLowerCase().split('?')[0] || ''
  const basePath = src.split('?')[0]
  const queryParams = src.includes('?') ? src.split('?')[1] : ''

  return sizes
    .map(size => {
      const optimizedSrc = `${basePath}${queryParams ? '?' + queryParams + '&' : '?'}w=${size}&q=${quality}`
      return `${optimizedSrc} ${size}w`
    })
    .join(', ')
}

export function generateWebPSrcSet(
  src: string,
  sizes: number[] = DEFAULT_SIZES,
  quality: number = DEFAULT_QUALITY
): string {
  if (!src) return ''

  const ext = src.split('.').pop()?.toLowerCase().split('?')[0] || ''
  const basePath = src.split('?')[0]
  const queryParams = src.includes('?') ? src.split('?')[1] : ''

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    return sizes
      .map(size => {
        const optimizedSrc = `${basePath}${queryParams ? '?' + queryParams + '&' : '?'}w=${size}&q=${quality}&fm=webp`
        return `${optimizedSrc} ${size}w`
      })
      .join(', ')
  }

  return ''
}

export function generatePictureSources(
  src: string,
  options: ImageOptimizationOptions = {}
): { webp?: string; avif?: string; original: string } {
  const { sizes = DEFAULT_SIZES, quality = DEFAULT_QUALITY } = options

  return {
    webp: generateWebPSrcSet(src, sizes, quality),
    avif: src,
    original: generateSrcSet(src, sizes, quality),
  }
}

export async function generateBlurPlaceholder(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!imageSrc) {
      resolve('')
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve('')
          return
        }

        canvas.width = BLUR_PLACEHOLDER_SIZE
        canvas.height = Math.round((img.height / img.width) * BLUR_PLACEHOLDER_SIZE)

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
        resolve(dataUrl)
      } catch {
        resolve('')
      }
    }

    img.onerror = () => resolve('')
    img.src = imageSrc
  })
}

export function generateResponsiveSizes(
  breakpoints: { [key: string]: string } = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(max-width: 1280px)': '33vw',
    '(min-width: 1281px)': '25vw',
  }
): string {
  return Object.values(breakpoints).join(', ')
}

export function getOptimalImageSize(
  containerWidth: number,
  pixelRatio: number = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
): number {
  const optimalWidth = Math.ceil(containerWidth * pixelRatio)

  return DEFAULT_SIZES.reduce((prev, curr) => {
    return curr >= optimalWidth ? prev : curr
  }, DEFAULT_SIZES[0])
}

export function preloadImage(
  src: string,
  type: 'webp' | 'avif' | 'image' = 'image'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src

    if (type !== 'image') {
      link.type = `image/${type}`
    }

    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to preload image: ${src}`))

    document.head.appendChild(link)
  })
}

export function observeImageLoad(
  img: HTMLImageElement,
  callback: (loaded: boolean) => void
): () => void {
  if (img.complete) {
    callback(true)
    return () => {}
  }

  const handleLoad = () => callback(true)
  const handleError = () => callback(false)

  img.addEventListener('load', handleLoad)
  img.addEventListener('error', handleError)

  return () => {
    img.removeEventListener('load', handleLoad)
    img.removeEventListener('error', handleError)
  }
}

export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options,
  })
}

export const SUPPORTS_WEBP =
  typeof window !== 'undefined'
    ? (() => {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      })()
    : false

export const SUPPORTS_AVIF =
  typeof window !== 'undefined'
    ? (() => {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        try {
          return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
        } catch {
          return false
        }
      })()
    : false

export default {
  generateSrcSet,
  generateWebPSrcSet,
  generatePictureSources,
  generateBlurPlaceholder,
  generateResponsiveSizes,
  getOptimalImageSize,
  preloadImage,
  observeImageLoad,
  createIntersectionObserver,
  SUPPORTS_WEBP,
  SUPPORTS_AVIF,
  DEFAULT_SIZES,
  DEFAULT_QUALITY,
  BLUR_PLACEHOLDER_SIZE,
}
