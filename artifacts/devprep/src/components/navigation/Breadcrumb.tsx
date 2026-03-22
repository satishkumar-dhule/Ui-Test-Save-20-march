import React, { useMemo } from 'react'
import { useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { BreadcrumbItem, BreadcrumbSeparator, BreadcrumbEllipsis } from './BreadcrumbItem'

export interface BreadcrumbItemData {
  label: string
  path: string
}

export interface BreadcrumbProps {
  items?: BreadcrumbItemData[]
  autoGenerate?: boolean
  maxItems?: number
  collapsed?: boolean
  className?: string
  showHome?: boolean
  separator?: React.ReactNode
  onItemClick?: (item: BreadcrumbItemData) => void
}

/**
 * Breadcrumb - Auto-generated breadcrumb navigation from route
 * 
 * @example
 * // Auto-generated from route
 * <Breadcrumb />
 * 
 * // Custom items
 * <Breadcrumb 
 *   items={[
 *     { label: 'Home', path: '/' },
 *     { label: 'Settings', path: '/settings' },
 *     { label: 'Profile', path: '/settings/profile' }
 *   ]}
 * />
 */
export function Breadcrumb({
  items: customItems,
  autoGenerate = true,
  maxItems = 4,
  collapsed = true,
  className,
  showHome = true,
  separator,
  onItemClick,
}: BreadcrumbProps) {
  const [location] = useLocation()

  const breadcrumbItems = useMemo(() => {
    if (customItems) {
      return customItems
    }

    if (!autoGenerate) {
      return []
    }

    return generateBreadcrumbsFromPath(location, showHome)
  }, [customItems, autoGenerate, location, showHome])

  // Handle collapsed breadcrumbs for long paths
  const displayItems = useMemo(() => {
    if (!collapsed || breadcrumbItems.length <= maxItems) {
      return {
        items: breadcrumbItems,
        hasEllipsis: false,
      }
    }

    // Keep first, last, and items around current page
    const first = breadcrumbItems[0]
    const last = breadcrumbItems[breadcrumbItems.length - 1]
    const middleItems = breadcrumbItems.slice(1, -1)

    // Always show first, ellipsis, and last
    if (middleItems.length <= 1) {
      return {
        items: breadcrumbItems,
        hasEllipsis: false,
      }
    }

    // Show first, ellipsis, one middle, and last
    return {
      items: [first, { label: '...', path: '', isEllipsis: true }, middleItems[middleItems.length - 1], last],
      hasEllipsis: true,
    }
  }, [breadcrumbItems, collapsed, maxItems])

  const handleItemClick = (item: BreadcrumbItemData) => {
    if (onItemClick) {
      onItemClick(item)
    }
  }

  if (displayItems.items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn('py-2', className)}
      data-testid="breadcrumb-nav"
    >
      <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
        {displayItems.items.map((item, index) => {
          const isLast = index === displayItems.items.length - 1
          const isEllipsis = 'isEllipsis' in item && item.isEllipsis

          return (
            <React.Fragment key={`${item.path}-${index}`}>
              {isEllipsis ? (
                <BreadcrumbEllipsis />
              ) : (
                <BreadcrumbItem
                  label={item.label}
                  path={item.path}
                  isCurrent={isLast}
                  onClick={() => handleItemClick(item)}
                />
              )}
              {!isLast && (
                <BreadcrumbSeparator>
                  {separator}
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          )
        })}
      </ol>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbItems.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.label,
              item: item.path,
            })),
          }),
        }}
      />
    </nav>
  )
}

/**
 * Generate breadcrumb items from current path
 */
function generateBreadcrumbsFromPath(path: string, showHome: boolean): BreadcrumbItemData[] {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItemData[] = []

  if (showHome) {
    breadcrumbs.push({ label: 'Home', path: '/' })
  }

  let currentPath = ''
  segments.forEach((segment) => {
    currentPath += `/${segment}`
    const label = formatSegmentLabel(segment)
    breadcrumbs.push({
      label,
      path: currentPath,
    })
  })

  return breadcrumbs
}

/**
 * Format segment label for display
 */
function formatSegmentLabel(segment: string): string {
  // Special cases for common route segments
  const labelMap: Record<string, string> = {
    'content': 'Content',
    'practice': 'Practice',
    'exam': 'Exam',
    'coding': 'Coding Challenge',
    'voice': 'Voice Interview',
    'settings': 'Settings',
    'analytics': 'Analytics',
    'onboarding': 'Get Started',
  }

  // Check if it's a dynamic segment (starts with :)
  if (segment.startsWith(':')) {
    return 'Details'
  }

  // Check label map
  if (labelMap[segment]) {
    return labelMap[segment]
  }

  // Convert to title case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Breadcrumb with custom patterns
 */
export function HomeChannelContentTypeContentBreadcrumb({
  channel,
  contentType,
  contentTitle,
  className,
}: {
  channel: string
  contentType: string
  contentTitle: string
  className?: string
}) {
  return (
    <Breadcrumb
      items={[
        { label: 'Home', path: '/' },
        { label: channel.charAt(0).toUpperCase() + channel.slice(1), path: `/channel/${channel}` },
        { label: contentType.charAt(0).toUpperCase() + contentType.slice(1), path: `/channel/${channel}/${contentType}` },
        { label: contentTitle, path: `/channel/${channel}/${contentType}/${encodeURIComponent(contentTitle)}` },
      ]}
      className={className}
    />
  )
}

/**
 * Settings section breadcrumb
 */
export function SettingsSectionBreadcrumb({
  section,
  className,
}: {
  section: string
  className?: string
}) {
  return (
    <Breadcrumb
      items={[
        { label: 'Home', path: '/' },
        { label: 'Settings', path: '/settings' },
        { label: section.charAt(0).toUpperCase() + section.slice(1), path: `/settings/${section}` },
      ]}
      className={className}
    />
  )
}

/**
 * Analytics report breadcrumb
 */
export function AnalyticsReportBreadcrumb({
  reportType,
  reportName,
  className,
}: {
  reportType: string
  reportName?: string
  className?: string
}) {
  const items = [
    { label: 'Home', path: '/' },
    { label: 'Analytics', path: '/analytics' },
    { label: reportType.charAt(0).toUpperCase() + reportType.slice(1), path: `/analytics/${reportType}` },
  ]

  if (reportName) {
    items.push({ label: reportName, path: `/analytics/${reportType}/${encodeURIComponent(reportName)}` })
  }

  return (
    <Breadcrumb
      items={items}
      className={className}
    />
  )
}

// Re-export for convenience
export { BreadcrumbItem, BreadcrumbSeparator, BreadcrumbEllipsis } from './BreadcrumbItem'
export type { BreadcrumbItemProps } from './BreadcrumbItem'