import { ReactNode } from 'react'
import { Layout } from './Layout'

interface ContentLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: ReactNode
  sidebar?: ReactNode
  showSidebar?: boolean
}

export function ContentLayout({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  sidebar,
  showSidebar = true,
}: ContentLayoutProps) {
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null

    return (
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {crumb.href ? (
              <a href={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </a>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>
    )
  }

  return (
    <Layout
      title={title}
      description={description}
      showSidebar={showSidebar && !!sidebar}
      sidebarContent={sidebar}
      headerActions={actions}
    >
      {renderBreadcrumbs()}
      <div className="prose prose-gray dark:prose-invert max-w-none">{children}</div>
    </Layout>
  )
}
