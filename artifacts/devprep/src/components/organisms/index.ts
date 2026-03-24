// Organisms - Complex, distinct sections of UI
// Composed of molecules and atoms, containing application logic

// Navigation Organisms
export { Sidebar } from './Sidebar'
export type { SidebarProps, SidebarItem } from './Sidebar'

export { Header } from './Header'
export type { HeaderProps } from './Header'

export { Breadcrumbs } from './Breadcrumbs'
export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs'

// Data Display Organisms
export { DataTable } from './DataTable'
export type { DataTableProps, ColumnDef, PaginationConfig } from './DataTable'

// Overlay Organisms
export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  AlertModal,
} from './Modal'
export type { ModalProps, ModalContentProps, AlertModalProps } from './Modal'

export { ToastItem, Toaster, useToast } from './Toast'
export type { ToastProps, ToastItemProps, ToasterProps } from './Toast'

// Export existing components as organisms
export {
  ContentCard,
  NewBadge,
  QualityIndicator,
  HighlightAnimation,
  ContentTypeBadge,
} from '../ContentCard'
export { LiveFeed } from '../LiveFeed'
export { SearchModal } from '../SearchModal'
export { NewContentBanner } from '../NewContentBanner'
export { ContentList } from './ContentList'
