import { type ReactNode, type HTMLAttributes } from 'react'

interface ResponsiveListProps extends HTMLAttributes<HTMLUListElement> {
  children: ReactNode
  variant?: 'unordered' | 'ordered'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const spacingClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const listVariantClasses = {
  unordered: 'list-disc',
  ordered: 'list-decimal',
}

export function ResponsiveList({
  children,
  variant = 'unordered',
  spacing = 'md',
  className = '',
  ...props
}: ResponsiveListProps) {
  const Component = variant === 'unordered' ? 'ul' : 'ol'
  const spacingClass = spacingClasses[spacing]
  const listClass = listVariantClasses[variant]

  return (
    <Component
      className={`
        ${listClass}
        ${spacingClass}
        pl-6
        text-responsive-base
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  )
}

interface ResponsiveListItemProps extends HTMLAttributes<HTMLLIElement> {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function ResponsiveListItem({
  children,
  icon,
  className = '',
  ...props
}: ResponsiveListItemProps) {
  return (
    <li
      className={`
        flex items-start gap-3
        text-responsive-base
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0 mt-1">{icon}</span>}
      <span>{children}</span>
    </li>
  )
}

// Responsive table component
interface ResponsiveTableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = '', ...props }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`} {...props}>
      <table className="w-full text-responsive-sm">{children}</table>
    </div>
  )
}

interface ResponsiveTableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
  className?: string
}

export function ResponsiveTableHeader({
  children,
  className = '',
  ...props
}: ResponsiveTableHeaderProps) {
  return (
    <thead
      className={`
        border-b border-border
        ${className}
      `}
      {...props}
    >
      {children}
    </thead>
  )
}

interface ResponsiveTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
  className?: string
}

export function ResponsiveTableBody({
  children,
  className = '',
  ...props
}: ResponsiveTableBodyProps) {
  return (
    <tbody
      className={`
        divide-y divide-border
        ${className}
      `}
      {...props}
    >
      {children}
    </tbody>
  )
}

interface ResponsiveTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode
  hover?: boolean
  className?: string
}

export function ResponsiveTableRow({
  children,
  hover = true,
  className = '',
  ...props
}: ResponsiveTableRowProps) {
  return (
    <tr
      className={`
        ${hover ? 'hover:bg-muted/50 transition-colors' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  )
}

interface ResponsiveTableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function ResponsiveTableCell({
  children,
  align = 'left',
  className = '',
  ...props
}: ResponsiveTableCellProps) {
  return (
    <td
      className={`
        ${alignClasses[align]}
        py-3 px-4
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  )
}

// Responsive form component
interface ResponsiveFormProps extends HTMLAttributes<HTMLFormElement> {
  children: ReactNode
  className?: string
}

export function ResponsiveForm({ children, className = '', ...props }: ResponsiveFormProps) {
  return (
    <form
      className={`
        space-y-6
        ${className}
      `}
      {...props}
    >
      {children}
    </form>
  )
}

interface ResponsiveFormGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function ResponsiveFormGroup({
  children,
  className = '',
  ...props
}: ResponsiveFormGroupProps) {
  return (
    <div
      className={`
        space-y-4
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResponsiveInputProps extends HTMLAttributes<HTMLInputElement> {
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function ResponsiveInput({
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}: ResponsiveInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`
        input-mobile w-full
        ${className}
      `}
      {...props}
    />
  )
}

interface ResponsiveTextareaProps extends HTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function ResponsiveTextarea({
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}: ResponsiveTextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      className={`
        input-mobile w-full resize-y
        min-h-[120px]
        ${className}
      `}
      {...props}
    />
  )
}

interface ResponsiveSelectProps extends HTMLAttributes<HTMLSelectElement> {
  children: ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
}

export function ResponsiveSelect({
  children,
  required = false,
  disabled = false,
  className = '',
  ...props
}: ResponsiveSelectProps) {
  return (
    <select
      required={required}
      disabled={disabled}
      className={`
        input-mobile w-full
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  )
}
