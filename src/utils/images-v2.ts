/**
 * Image Optimization Utilities v2
 * Advanced image loading, optimization, and caching
 */

// Image format support detection
export interface ImageFormatSupport {
  webp: boolean
  avif: boolean
  jpeg2000: boolean
  jpegxl: boolean
  png: boolean
  gif: boolean
}

// Image optimization options
export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'gif' | 'auto'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center'
  blur?: number
  sharpen?: boolean
  grayscale?: boolean
  crop?: {
    width: number
    height: number
    x: number
    y: number
  }
}

// Image cache entry
interface ImageCacheEntry {
  url: string
  blob: Blob
  timestamp: number
  size: number
}

// Image optimization class
export class ImageOptimizer {
  private cache: Map<string, ImageCacheEntry> = new Map()
  private maxCacheSize: number = 50 * 1024 * 1024 // 50MB
  private currentCacheSize: number = 0
  private formatSupport: ImageFormatSupport | null = null

  constructor() {
    this.detectFormatSupport()
  }

  // Detect browser image format support
  private detectFormatSupport(): void {
    if (typeof window === 'undefined') return

    this.formatSupport = {
      webp: false,
      avif: false,
      jpeg2000: false,
      jpegxl: false,
      png: true,
      gif: true,
    }

    // Test WebP support
    const webpImg = new Image()
    webpImg.onload = () => {
      this.formatSupport!.webp = webpImg.width > 0 && webpImg.height > 0
    }
    webpImg.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='

    // Test AVIF support
    const avifImg = new Image()
    avifImg.onload = () => {
      this.formatSupport!.avif = avifImg.width > 0 && avifImg.height > 0
    }
    avifImg.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLanAyaAAAAAAAAAgAAAgAEAAAAAhAAQAQAAAAAJBpcG1hAAAAAAAAAAEAAQECgICAgAAAI21kYXQSAAoIP8R8hAQ0BUAyDWeeUy0JG+QAACANEkA='
  }

  // Get browser format support
  getFormatSupport(): ImageFormatSupport {
    return this.formatSupport || {
      webp: false,
      avif: false,
      jpeg2000: false,
      jpegxl: false,
      png: true,
      gif: true,
    }
  }

  // Optimize image URL with parameters
  optimizeUrl(src: string, options: ImageOptimizationOptions = {}): string {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
      return src
    }

    const {
      width,
      height,
      quality = 80,
      format = 'auto',
      fit = 'cover',
      position = 'center',
      blur,
      sharpen,
      grayscale,
      crop,
    } = options

    const params = new URLSearchParams()

    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    if (quality !== 80) params.set('q', quality.toString())
    if (format !== 'auto') params.set('f', format)
    if (fit !== 'cover') params.set('fit', fit)
    if (position !== 'center') params.set('pos', position)
    if (blur) params.set('blur', blur.toString())
    if (sharpen) params.set('sharpen', '1')
    if (grayscale) params.set('gray', '1')
    
    if (crop) {
      params.set('crop', `${crop.width}x${crop.height}+${crop.x}+${crop.y}`)
    }

    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}${params.toString()}`
  }

  // Create responsive image srcset
  createSrcSet(
    src: string,
    widths: number[] = [320, 640, 960, 1280, 1920],
    options: Omit<ImageOptimizationOptions, 'width'> = {}
  ): string {
    const srcSet = widths.map(width => {
      const optimizedUrl = this.optimizeUrl(src, { ...options, width })
      return `${optimizedUrl} ${width}w`
    })

    return srcSet.join(', ')
  }

  // Create picture element with multiple formats
  createPictureElement(
    src: string,
    options: {
      alt: string
      width?: number
      height?: number
      className?: string
      loading?: 'lazy' | 'eager'
      decoding?: 'async' | 'sync' | 'auto'
    }
  ): string {
    const { alt, width, height, className, loading = 'lazy', decoding = 'async' } = options
    const baseName = src.split('/').pop()?.split('.')[0] || 'image'
    
    const formats = [
      { type: 'image/avif', extension: 'avif' },
      { type: 'image/webp', extension: 'webp' },
      { type: 'image/jpeg', extension: 'jpg' },
    ]

    let html = `<picture>`
    
    formats.forEach(({ type, extension }) => {
      const optimizedSrc = this.optimizeUrl(src, { format: extension as any })
      const srcSet = this.createSrcSet(optimizedSrc)
      html += `
        <source 
          type="${type}" 
          srcset="${srcSet}"
          ${width ? `width="${width}"` : ''}
          ${height ? `height="${height}"` : ''}
        />`
    })

    html += `
      <img 
        src="${this.optimizeUrl(src, { quality: 85 })}"
        alt="${alt}"
        ${width ? `width="${width}"` : ''}
        ${height ? `height="${height}"` : ''}
        ${className ? `class="${className}"` : ''}
        loading="${loading}"
        decoding="${decoding}"
      />
    </picture>`

    return html
  }

  // Lazy load image with intersection observer
  lazyLoadImage(
    img: HTMLImageElement,
    options: {
      threshold?: number
      rootMargin?: string
      onLoad?: () => void
      onError?: (error: Error) => void
    } = {}
  ): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: load immediately
      if (img.dataset.src) {
        img.src = img.dataset.src
      }
      return () => {}
    }

    const { threshold = 0.01, rootMargin = '50px 0px', onLoad, onError } = options

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement
          
          if (target.dataset.src) {
            target.src = target.dataset.src
            target.removeAttribute('data-src')
            
            target.onload = () => {
              target.classList.add('loaded')
              onLoad?.()
            }
            
            target.onerror = (error) => {
              target.classList.add('error')
              onError?.(new Error(`Failed to load image: ${target.dataset.src}`))
            }
          }
          
          observer.unobserve(target)
        }
      })
    }, {
      threshold,
      rootMargin,
    })

    observer.observe(img)

    return () => observer.disconnect()
  }

  // Batch lazy load multiple images
  lazyLoadImages(
    images: NodeListOf<HTMLImageElement> | HTMLImageElement[],
    options: {
      threshold?: number
      rootMargin?: string
      onLoad?: (img: HTMLImageElement) => void
      onError?: (img: HTMLImageElement, error: Error) => void
    } = {}
  ): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: load all images immediately
      images.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src
        }
      })
      return () => {}
    }

    const { threshold = 0.01, rootMargin = '50px 0px', onLoad, onError } = options

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement
          
          if (target.dataset.src) {
            target.src = target.dataset.src
            target.removeAttribute('data-src')
            
            target.onload = () => {
              target.classList.add('loaded')
              onLoad?.(target)
            }
            
            target.onerror = (error) => {
              target.classList.add('error')
              onError?.(target, new Error(`Failed to load image: ${target.dataset.src}`))
            }
          }
          
          observer.unobserve(target)
        }
      })
    }, {
      threshold,
      rootMargin,
    })

    images.forEach(img => observer.observe(img))

    return () => observer.disconnect()
  }

  // Preload critical images
  preloadImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const optimizedSrc = this.optimizeUrl(src, options)
      const img = new Image()
      
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to preload image: ${optimizedSrc}`))
      
      img.src = optimizedSrc
    })
  }

  // Preload multiple images
  preloadImages(sources: string[], options: ImageOptimizationOptions = {}): Promise<void[]> {
    return Promise.all(sources.map(src => this.preloadImage(src, options)))
  }

  // Cache image
  async cacheImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
    const cacheKey = this.getCacheKey(src, options)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return
    }

    try {
      const optimizedSrc = this.optimizeUrl(src, options)
      const response = await fetch(optimizedSrc)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const blob = await response.blob()
      const entry: ImageCacheEntry = {
        url: optimizedSrc,
        blob,
        timestamp: Date.now(),
        size: blob.size,
      }

      // Check cache size
      if (this.currentCacheSize + blob.size > this.maxCacheSize) {
        this.clearOldestCacheEntries()
      }

      this.cache.set(cacheKey, entry)
      this.currentCacheSize += blob.size
    } catch (error) {
      console.warn('Failed to cache image:', error)
    }
  }

  // Get cached image
  getCachedImage(src: string, options: ImageOptimizationOptions = {}): string | null {
    const cacheKey = this.getCacheKey(src, options)
    const entry = this.cache.get(cacheKey)
    
    if (entry) {
      return URL.createObjectURL(entry.blob)
    }
    
    return null
  }

  // Generate cache key
  private getCacheKey(src: string, options: ImageOptimizationOptions): string {
    const optionsString = JSON.stringify(options)
    return `${src}::${optionsString}`
  }

  // Clear oldest cache entries
  private clearOldestCacheEntries(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // Remove oldest 25% of entries
    const removeCount = Math.ceil(entries.length * 0.25)
    for (let i = 0; i < removeCount; i++) {
      const [key, entry] = entries[i]
      URL.revokeObjectURL(URL.createObjectURL(entry.blob))
      this.cache.delete(key)
      this.currentCacheSize -= entry.size
    }
  }

  // Clear all cache
  clearCache(): void {
    this.cache.forEach(entry => {
      URL.revokeObjectURL(URL.createObjectURL(entry.blob))
    })
    this.cache.clear()
    this.currentCacheSize = 0
  }

  // Get cache stats
  getCacheStats(): {
    count: number
    size: number
    maxSize: number
    utilization: number
  } {
    return {
      count: this.cache.size,
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilization: (this.currentCacheSize / this.maxCacheSize) * 100,
    }
  }
}

// React hook for image optimization
export function useImageOptimizer() {
  const [optimizer] = useState(() => new ImageOptimizer())
  
  return {
    optimizeUrl: optimizer.optimizeUrl.bind(optimizer),
    createSrcSet: optimizer.createSrcSet.bind(optimizer),
    createPictureElement: optimizer.createPictureElement.bind(optimizer),
    lazyLoadImage: optimizer.lazyLoadImage.bind(optimizer),
    preloadImage: optimizer.preloadImage.bind(optimizer),
    cacheImage: optimizer.cacheImage.bind(optimizer),
    getCachedImage: optimizer.getCachedImage.bind(optimizer),
    getCacheStats: optimizer.getCacheStats.bind(optimizer),
    clearCache: optimizer.clearCache.bind(optimizer),
    getFormatSupport: optimizer.getFormatSupport.bind(optimizer),
  }
}

// Utility functions
export function generateBlurPlaceholder(width: number = 40, height: number = 30): string {
  // Generate a tiny blur placeholder
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

export function createImageLoader(options: {
  onProgress?: (loaded: number, total: number) => void
  onComplete?: (blob: Blob) => void
  onError?: (error: Error) => void
}): (src: string) => Promise<Blob> {
  return async (src: string): Promise<Blob> => {
    try {
      const response = await fetch(src)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      let loaded = 0

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('ReadableStream not supported')
      }

      const chunks: Uint8Array[] = []
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        loaded += value.length
        
        if (total > 0 && options.onProgress) {
          options.onProgress(loaded, total)
        }
      }

      const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'image/jpeg' })
      
      if (options.onComplete) {
        options.onComplete(blob)
      }
      
      return blob
    } catch (error) {
      if (options.onError) {
        options.onError(error as Error)
      }
      throw error
    }
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer()

// Export default
export default {
  ImageOptimizer,
  imageOptimizer,
  useImageOptimizer,
  generateBlurPlaceholder,
  createImageLoader,
}