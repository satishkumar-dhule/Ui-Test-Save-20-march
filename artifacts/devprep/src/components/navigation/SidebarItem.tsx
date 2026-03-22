import React from 'react'
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuAction,
  SidebarMenuSub,
} from '@/components/ui/sidebar'

export interface SidebarItemProps {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  isActive?: boolean
  onClick?: () => void
  tooltip?: string
  children?: SidebarItemProps[]
  action?: React.ReactNode
}

export function SidebarItem({
  id,
  label,
  icon,
  badge,
  isActive = false,
  onClick,
  tooltip,
  children,
  action,
}: SidebarItemProps) {
  const hasChildren = Array.isArray(children) && children.length > 0

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onClick}
        tooltip={tooltip || label}
      >
        {icon && <span className="h-4 w-4">{icon}</span>}
        <span>{label}</span>
        {badge !== undefined && (
          <SidebarMenuBadge>{badge}</SidebarMenuBadge>
        )}
      </SidebarMenuButton>
      {action && <SidebarMenuAction>{action}</SidebarMenuAction>}
      {hasChildren && (
        <SidebarMenuSub>
          {children!.map((child) => (
            <SidebarItem key={child.id} {...child} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}