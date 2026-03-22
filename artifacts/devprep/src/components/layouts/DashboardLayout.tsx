import { ReactNode } from 'react'
import { Layout } from './Layout'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  sidebar?: ReactNode
  actions?: ReactNode
}

export function DashboardLayout({
  children,
  title,
  description,
  sidebar,
  actions,
}: DashboardLayoutProps) {
  return (
    <Layout
      title={title}
      description={description}
      showSidebar={!!sidebar}
      sidebarContent={sidebar}
      headerActions={actions}
    >
      <div className="space-y-6">{children}</div>
    </Layout>
  )
}
