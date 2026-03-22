import type { Plugin } from 'vite'

interface FontPreloadPluginOptions {
  include?: RegExp | string[]
  exclude?: RegExp | string[]
  prefetchAll?: boolean
  injectMarkers?: boolean
}

const DEFAULT_FONT_EXTENSIONS = /\.(woff|woff2|ttf|eot|otf)$/i

export function fontPreloadPlugin(options: FontPreloadPluginOptions = {}): Plugin {
  const {
    include = DEFAULT_FONT_EXTENSIONS,
    exclude = [],
    prefetchAll = false,
    injectMarkers = true,
  } = options

  const shouldInclude = (id: string) => {
    if (typeof include === 'string') {
      return id.includes(include)
    }
    if (Array.isArray(include)) {
      return include.some(ext => id.includes(ext))
    }
    if (include instanceof RegExp) {
      return include.test(id)
    }
    return false
  }

  const shouldExclude = (id: string) => {
    if (typeof exclude === 'string') {
      return id.includes(exclude)
    }
    if (Array.isArray(exclude)) {
      return exclude.some(ext => id.includes(ext))
    }
    if (exclude instanceof RegExp) {
      return exclude.test(id)
    }
    return false
  }

  const fontCache = new Map<string, { url: string; mimeType: string }>()

  const getMimeType = (file: string): string => {
    const ext = file.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      woff: 'font/woff',
      woff2: 'font/woff2',
      ttf: 'font/ttf',
      eot: 'application/vnd.ms-fontobject',
      otf: 'font/otf',
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  return {
    name: 'vite-plugin-font-preload',
    enforce: 'pre',

    buildStart() {
      fontCache.clear()
    },

    transform(src, id) {
      if (!shouldInclude(id) || shouldExclude(id)) return null

      const mimeType = getMimeType(id)
      const url = this.getFileName(id)

      fontCache.set(id, { url, mimeType })

      if (injectMarkers) {
        const css = `
          /* VITE-FONT-PRELOAD:START ${url} ${mimeType} */
          /* VITE-FONT-PRELOAD:END */
        `
        return {
          code: css + '\n' + src,
          map: null,
        }
      }

      return null
    },

    generateBundle(_, bundle) {
      const fonts: Array<{ url: string; mimeType: string; size: number }> = []

      for (const [id, { url, mimeType }] of fontCache) {
        const asset = bundle[url]
        if (asset && asset.type === 'asset') {
          fonts.push({
            url,
            mimeType,
            size:
              typeof asset.source === 'string'
                ? new Blob([asset.source]).size
                : asset.source.length,
          })
        }
      }

      if (fonts.length > 0 && injectMarkers) {
        const html = `
          <script id="vite-font-preload-data" type="application/json">
            ${JSON.stringify({
              fonts,
              mode: prefetchAll ? 'preload' : 'lazy',
              timestamp: Date.now(),
            })}
          </script>
        `

        const css = `
          /* Generated Font Preload */
          ${fonts
            .map(
              ({ url, mimeType }) => `
            /* Font: ${url} (${mimeType}) */
          `
            )
            .join('\n')}
        `

        this.emitFile({
          type: 'asset',
          fileName: 'font-preload.json',
          source: JSON.stringify({ fonts, mode: prefetchAll ? 'preload' : 'lazy' }),
        })
      }
    },

    transformIndexHtml(html) {
      if (!fontCache.size) return html

      const fontLinks = Array.from(fontCache.values()).map(({ url, mimeType }) => ({
        rel: 'preload',
        href: url,
        as: 'font',
        type: mimeType,
        crossorigin: mimeType.includes('woff') ? 'anonymous' : undefined,
      }))

      if (prefetchAll) {
        const prefetchLinks = fontLinks.map(link => ({
          ...link,
          rel: 'prefetch',
        }))

        return {
          html,
          tags: [
            ...fontLinks.map((attrs, i) => ({
              tag: 'link',
              attrs,
              inject: 'head' as const,
              key: `font-preload-${i}`,
            })),
            ...prefetchLinks.map((attrs, i) => ({
              tag: 'link',
              attrs,
              inject: 'head' as const,
              key: `font-prefetch-${i}`,
            })),
          ],
        }
      }

      return {
        html,
        tags: fontLinks.map((attrs, i) => ({
          tag: 'link',
          attrs,
          inject: 'head' as const,
          key: `font-preload-${i}`,
        })),
      }
    },
  }
}

export function generateFontFaceDeclaration(
  fontFamily: string,
  fontUrl: string,
  fontWeight: string = '400',
  fontStyle: string = 'normal',
  display: string = 'swap',
  unicodeRange?: string
): string {
  const url = fontUrl.startsWith('/') ? fontUrl : `/${fontUrl}`

  let declaration = `
    @font-face {
      font-family: '${fontFamily}';
      font-style: ${fontStyle};
      font-weight: ${fontWeight};
      font-display: ${display};
      src: url('${url}') format('${fontUrl.split('.').pop()?.replace('woff2', 'woff2').replace('woff', 'woff') || 'woff2'}');
  `

  if (unicodeRange) {
    declaration += `\n      unicode-range: ${unicodeRange};`
  }

  declaration += '\n    }'
  return declaration
}

export function createCriticalFontCss(
  fontFaces: Array<{
    fontFamily: string
    fontUrl: string
    fontWeight?: string
    fontStyle?: string
    unicodeRange?: string
  }>
): string {
  return `
    /* Critical Fonts - Preloaded */
    ${fontFaces
      .map(({ fontFamily, fontUrl, fontWeight, fontStyle, unicodeRange }) =>
        generateFontFaceDeclaration(
          fontFamily,
          fontUrl,
          fontWeight,
          fontStyle,
          'swap',
          unicodeRange
        )
      )
      .join('\n')}
  `
}

export function inlineCriticalFonts(html: string, criticalFonts: string[]): string {
  const styleTag = `<style>${criticalFonts.join('\n')}</style>`
  return html.replace('</head>', `${styleTag}</head>`)
}

export default fontPreloadPlugin
