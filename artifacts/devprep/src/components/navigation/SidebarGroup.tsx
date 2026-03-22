import {
  SidebarGroup as SidebarGroupPrimitive,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { SidebarItem, SidebarItemProps } from './SidebarItem'

export interface SidebarGroupProps {
  id: string
  label: string
  items: SidebarItemProps[]
  collapsible?: boolean
}

export function SidebarGroup({
  id,
  label,
  items,
  collapsible = true,
}: SidebarGroupProps) {
  return (
    <SidebarGroupPrimitive>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarItem key={item.id} {...item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroupPrimitive>
  )
}